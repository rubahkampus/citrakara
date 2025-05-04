// src/lib/services/proposal.service.ts
import { Types } from "mongoose";
import { IProposal } from "@/lib/db/models/proposal.model";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import {
  proposalRepository,
  ProposalInput,
  ArtistAdjustment,
} from "@/lib/db/repositories/proposal.repository";
import { findCommissionListingById } from "@/lib/db/repositories/commissionListing.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";
import { IContract } from "@/lib/db/models/contract.model";
import { IEscrowTransaction } from "@/lib/db/models/escrowTransaction.model";
import type { Cents } from "@/types/common";

/** Input types for proposals */
export interface GeneralOptionsInput {
  optionGroups?: Record<
    string,
    {
      selectedLabel: string;
      price: Cents;
    }
  >;
  addons?: Record<string, Cents>;
  answers?: Record<string, string>;
}

export interface SubjectOptionsInput {
  [subjectTitle: string]: {
    instances: Array<{
      optionGroups?: Record<
        string,
        {
          selectedLabel: string;
          price: Cents;
        }
      >;
      addons?: Record<string, Cents>;
      answers?: Record<string, string>;
    }>;
  };
}

export interface SubmitProposalInput {
  earliestDate: Date;
  latestDate: Date;
  deadline: Date;
  generalDescription: string;
  referenceImages?: string[];
  generalOptions?: GeneralOptionsInput;
  subjectOptions?: SubjectOptionsInput;
}

export interface ArtistDecision {
  accept: boolean;
  surcharge?: number;
  discount?: number;
  reason?: string;
}

export interface ProposalService {
  submitProposal(
    clientId: string,
    listingId: string,
    input: SubmitProposalInput
  ): Promise<IProposal>;

  artistRespond(
    artistId: string,
    proposalId: string,
    decision: ArtistDecision
  ): Promise<IProposal>;

  clientRespondToAdjustment(
    clientId: string,
    proposalId: string,
    accept: boolean,
    rejectionReason?: string
  ): Promise<IProposal>;

  autoExpireProposals(asOf?: Date): Promise<number>;

  finalizeProposal(proposalId: string): Promise<{
    proposal: IProposal;
    contract: IContract;
    escrowTx: IEscrowTransaction;
  }>;
}

/** Helper function to validate availability window */
const validateAvailability = (
  earliestDate: Date,
  deadline: Date,
  latestDate: Date
): void => {
  if (earliestDate > deadline || deadline > latestDate) {
    throw new Error(
      "Invalid availability window: earliest <= deadline <= latest must be satisfied"
    );
  }
  if (earliestDate >= latestDate) {
    throw new Error(
      "Invalid availability window: earliest must be before latest"
    );
  }
};

/** Helper function to compute rush fees */
const computeRush = (
  earliestDate: Date,
  deadline: Date,
  latestDate: Date,
  rushSettings?: {
    mode: string;
    rushFee?: {
      kind: "flat" | "perDay";
      amount: number;
    };
  }
): { days: number; paidDays: number; fee: number } | null => {
  if (!rushSettings?.rushFee || rushSettings.mode !== "withRush") {
    return null;
  }

  const rushDays = Math.max(
    0,
    Math.ceil(
      (latestDate.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000)
    )
  );

  const paidDays = Math.max(
    0,
    Math.ceil(
      (deadline.getTime() - earliestDate.getTime()) / (24 * 60 * 60 * 1000)
    )
  );

  if (paidDays <= 0) return null;

  const rushFee =
    rushSettings.rushFee.kind === "flat"
      ? rushSettings.rushFee.amount
      : paidDays * rushSettings.rushFee.amount;

  return {
    days: rushDays,
    paidDays,
    fee: rushFee,
  };
};

/** Helper function to compute price breakdown */
const computePriceBreakdown = (
  basePrice: Cents,
  generalOptions?: GeneralOptionsInput,
  subjectOptions?: SubjectOptionsInput,
  rush?: { fee: number } | null,
  adjustments?: {
    surcharge?: { amount: number };
    discount?: { amount: number };
  }
) => {
  let optionGroupsTotal = 0;
  let addonsTotal = 0;

  // Calculate general options
  if (generalOptions?.optionGroups) {
    Object.values(generalOptions.optionGroups).forEach((selection) => {
      optionGroupsTotal += selection.price;
    });
  }
  if (generalOptions?.addons) {
    Object.values(generalOptions.addons).forEach((price) => {
      addonsTotal += price;
    });
  }

  // Calculate subject options
  if (subjectOptions) {
    Object.values(subjectOptions).forEach((subject) => {
      subject.instances.forEach((instance) => {
        if (instance.optionGroups) {
          Object.values(instance.optionGroups).forEach((selection) => {
            optionGroupsTotal += selection.price;
          });
        }
        if (instance.addons) {
          Object.values(instance.addons).forEach((price) => {
            addonsTotal += price;
          });
        }
      });
    });
  }

  const surcharge = adjustments?.surcharge?.amount || 0;
  const discount = adjustments?.discount?.amount || 0;
  const rushFee = rush?.fee || 0;

  return {
    base: basePrice,
    optionGroups: optionGroupsTotal,
    addons: addonsTotal,
    rush: rushFee,
    discount,
    surcharge,
    total:
      basePrice +
      optionGroupsTotal +
      addonsTotal +
      rushFee +
      surcharge -
      discount,
  };
};

/** Implementation of the proposal service */
export const proposalService: ProposalService = {
  /** Submit a new proposal */
  async submitProposal(
    clientId: string,
    listingId: string,
    input: SubmitProposalInput
  ): Promise<IProposal> {
    // 1. Load & Validate Listing
    const listing = await findCommissionListingById(listingId, { lean: true });

    if (!listing) {
      throw new Error("Listing not found");
    }

    if (!listing.isActive || listing.isDeleted) {
      throw new Error("Listing not accepting orders");
    }

    // 2. Validate Dates
    validateAvailability(input.earliestDate, input.deadline, input.latestDate);

    // 3. Compute Dynamic Estimate
    const availability = proposalRepository.computeDynamicEstimate(listing, {
      earliestDate: input.earliestDate,
      latestDate: input.latestDate,
    });

    // 4. Compute Rush & Pricing
    const rush = computeRush(
      input.earliestDate,
      input.deadline,
      input.latestDate,
      listing.deadline
    );

    const calculatedPrice = computePriceBreakdown(
      listing.basePrice,
      input.generalOptions,
      input.subjectOptions,
      rush
    );

    // 5. Create Proposal
    const proposalInput: ProposalInput = {
      clientId,
      artistId: listing.artistId,
      listingId: listing._id,
      deadline: input.deadline,
      generalDescription: input.generalDescription,
      referenceImages: input.referenceImages,
      generalOptions: input.generalOptions,
      subjectOptions: input.subjectOptions,
    };

    const proposal = await proposalRepository.createProposal(proposalInput);

    // 6. Notify Artist (to be implemented)
    // NotificationService.notify(listing.artistId.toString(), "New proposal received");

    return proposal;
  },

  /** Artist responds to proposal */
  async artistRespond(
    artistId: string,
    proposalId: string,
    decision: ArtistDecision
  ): Promise<IProposal> {
    // 1. Fetch & Authorize
    const proposal = await proposalRepository.getProposalById(proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.artistId.toString() !== artistId) {
      throw new Error("Not authorized to respond to this proposal");
    }

    // 2. Handle Response
    let adjustment: ArtistAdjustment | undefined;

    if (decision.accept && (decision.surcharge || decision.discount)) {
      adjustment = {};

      if (decision.surcharge) {
        adjustment.surcharge = {
          amount: decision.surcharge,
          reason: decision.reason || "Artist adjustment",
        };
      }

      if (decision.discount) {
        adjustment.discount = {
          amount: decision.discount,
          reason: decision.reason || "Artist adjustment",
        };
      }
    }

    const updatedProposal = await proposalRepository.artistResponds(
      proposalId,
      decision.accept,
      adjustment,
      decision.reason
    );

    // 3. Notify Client (to be implemented)
    if (decision.accept && adjustment) {
      // NotificationService.notify(proposal.clientId.toString(), "Artist proposed a price adjustment");
    } else if (!decision.accept) {
      // NotificationService.notify(proposal.clientId.toString(), "Artist rejected your proposal");
    } else {
      // NotificationService.notify(proposal.clientId.toString(), "Artist accepted your proposal");
    }

    return updatedProposal;
  },

  /** Client responds to adjustment */
  async clientRespondToAdjustment(
    clientId: string,
    proposalId: string,
    accept: boolean,
    rejectionReason?: string
  ): Promise<IProposal> {
    // 1. Fetch & Authorize
    const proposal = await proposalRepository.getProposalById(proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.clientId.toString() !== clientId) {
      throw new Error("Not authorized to respond to this proposal");
    }

    // 2. Handle Response
    const updatedProposal = await proposalRepository.clientRespondsToAdjustment(
      proposalId,
      accept,
      rejectionReason
    );

    // 3. Notify Artist (to be implemented)
    const message = accept
      ? "Client accepted your adjustment; ready to invoice"
      : "Client rejected your adjustment";
    // NotificationService.notify(proposal.artistId.toString(), message);

    return updatedProposal;
  },

  /** Auto-expire proposals */
  async autoExpireProposals(asOf: Date = new Date()): Promise<number> {
    return proposalRepository.bulkExpirePending(asOf);
  },

  /** Finalize accepted proposal */
  async finalizeProposal(proposalId: string): Promise<{
    proposal: IProposal;
    contract: IContract;
    escrowTx: IEscrowTransaction;
  }> {
    // 1. Fetch & Validate
    const proposal = await proposalRepository.getProposalById(proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "accepted") {
      throw new Error("Proposal must be in accepted status to finalize");
    }

    // 2. Hold Escrow (to be implemented)
    // const escrowTx = await EscrowService.holdFunds(
    //   proposal.clientId.toString(),
    //   proposal.calculatedPrice.total
    // );

    // Create mock escrow transaction for now
    const escrowTx = {
      _id: new Types.ObjectId(),
      contractId: new Types.ObjectId(),
      type: "hold" as const,
      from: "client" as const,
      to: "escrow" as const,
      amount: proposal.calculatedPrice.total,
      currency: "IDR" as const,
      status: "held" as const,
      createdAt: new Date(),
      note: "Escrow hold for accepted proposal",
    } as unknown as IEscrowTransaction;

    // 3. Convert to Contract (to be implemented)
    // const contract = await ContractService.createFromProposal(proposal);

    // Create mock contract for now
    const contract = {
      _id: new Types.ObjectId(),
      clientId: proposal.clientId,
      artistId: proposal.artistId,
      listingId: proposal.listingId,
      proposalId: proposal._id,
      contractNumber: `CONTRACT-${Date.now()}`,
      status: "pending_start",
      statusHistory: [],
      events: [],
      listingSnapshot: proposal.listingSnapshot,
      proposalSnapshot: proposal,
      contractVersion: 1,
      flow: proposal.listingSnapshot.flow || "standard",
      work: [],
      revisionTickets: [],
      cancelTickets: [],
      contractChangeTickets: [],
      resolutionTickets: [],
      finance: proposal.calculatedPrice,
      payment: {
        status: "pending",
      },
      deadlineAt: proposal.deadline,
      graceEndsAt: new Date(
        new Date(proposal.deadline).getTime() + 7 * 24 * 60 * 60 * 1000
      ),
      isHidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IContract;

    // 4. Reduce Slot (to be implemented)
    // await SlotService.decrement(
    //   proposal.listingSnapshot.artistId,
    //   proposal.listingSnapshot.slots
    // );

    // 5. Finalize Proposal
    const finalizedProposal = await proposalRepository.finalizeAcceptance(
      proposalId
    );

    return {
      proposal: finalizedProposal,
      contract,
      escrowTx,
    };
  },
};
