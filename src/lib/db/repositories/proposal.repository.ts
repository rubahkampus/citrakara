// src/lib/db/repositories/proposal.repository.ts
import mongoose, { ClientSession, ObjectId, Types } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import Proposal, { IProposal } from "@/lib/db/models/proposal.model";
import CommissionListing from "@/lib/db/models/commissionListing.model";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import type { ISODate, Cents } from "@/types/common";
/** Input type for creating a proposal */
export interface ProposalInput {
  clientId: string | ObjectId;
  artistId: string | ObjectId;
  listingId: string | ObjectId;
  deadline: ISODate;
  generalDescription: string;
  referenceImages?: string[];
  generalOptions?: {
    optionGroups?: Record<
      string,
      {
        selectedLabel: string;
        price: Cents;
      }
    >;
    addons?: Record<string, Cents>;
    answers?: Record<string, string>;
  };
  subjectOptions?: Record<
    string,
    {
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
    }
  >;
}

/** Options for find operations */
export interface FindOpts {
  status?: string[];
  beforeExpire?: boolean;
}

/** Artist adjustment input */
export interface ArtistAdjustment {
  surcharge?: {
    amount: number;
    reason: string;
  };
  discount?: {
    amount: number;
    reason: string;
  };
}

/** Availability estimate */
export interface Estimate {
  earliestDate: Date;
  latestDate: Date;
}

/** Snapshot of listing essential fields */
export interface ListingSnapshot {
  title: string;
  basePrice: Cents;
  slots: number;
  generalOptions?: any;
  subjectOptions?: any;
  cancelationFee: {
    kind: "flat" | "percentage";
    amount: number;
  };
  deadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number;
    max: number;
    rushFee?: {
      kind: "flat" | "perDay";
      amount: number;
    };
  };
  revisions?: any;
  milestones?: any;
}

/** Repository interface */
export interface ProposalRepository {
  createProposal(input: ProposalInput): Promise<IProposal>;
  getProposalById(id: string | ObjectId): Promise<IProposal | null>;
  findProposalsByArtist(
    artistId: string | ObjectId,
    opts?: FindOpts
  ): Promise<IProposal[]>;
  findProposalsByClient(
    clientId: string | ObjectId,
    opts?: FindOpts
  ): Promise<IProposal[]>;
  findProposalsByListing(listingId: string | ObjectId): Promise<IProposal[]>;
  findExpiredProposals(asOf?: Date): Promise<IProposal[]>;

  expireProposal(id: string | ObjectId): Promise<void>;
  bulkExpirePending(asOf?: Date): Promise<number>;

  artistResponds(
    id: string | ObjectId,
    accepts: boolean,
    adjustment?: ArtistAdjustment,
    rejectionReason?: string
  ): Promise<IProposal>;
  clientRespondsToAdjustment(
    id: string | ObjectId,
    accepts: boolean,
    rejectionReason?: string
  ): Promise<IProposal>;
  finalizeAcceptance(id: string | ObjectId): Promise<IProposal>;

  computeDynamicEstimate(
    listing: ListingSnapshot,
    availability?: { earliestDate: Date; latestDate: Date }
  ): Estimate;
  snapshotListing(listingId: string | ObjectId): Promise<ListingSnapshot>;
  recalculateRushAndPrice(proposal: IProposal): IProposal;
  
}

/** Helper function to convert string to ObjectId */
function toObjectId(
  id: string | mongoose.Types.ObjectId | mongoose.Schema.Types.ObjectId
): mongoose.Types.ObjectId {
  if (typeof id === "string") {
    return new mongoose.Types.ObjectId(id);
  }
  if (id instanceof mongoose.Schema.Types.ObjectId) {
    return new mongoose.Types.ObjectId(id.toString());
  }
  return id;
}

/** Helper function to validate duration constraints */
const validateDuration = (availability: Estimate, deadline: Date) => {
  const { earliestDate, latestDate } = availability;

  if (earliestDate >= latestDate) {
    throw new Error("earliestDate must be before latestDate");
  }

  if (deadline < earliestDate || deadline > latestDate) {
    throw new Error("deadline must be between earliestDate and latestDate");
  }

  return true;
};

/** Calculate rush fees based on listing and selected deadline */
const calculateRush = (
  listingSnapshot: ListingSnapshot,
  deadline: Date,
  availability: Estimate
) => {
  if (
    listingSnapshot.deadline.mode !== "withRush" ||
    !listingSnapshot.deadline.rushFee
  ) {
    return null;
  }

  const rushDays = Math.max(
    0,
    Math.ceil(
      (availability.latestDate.getTime() - deadline.getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  const paidDays = Math.max(
    0,
    Math.ceil(
      (deadline.getTime() - availability.earliestDate.getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  if (paidDays <= 0) {
    // normalize to zero so downstream code never sees null/undefined
    return { days: 0, paidDays: 0, fee: 0 };
  }

  const rushFee =
    listingSnapshot.deadline.rushFee.kind === "flat"
      ? listingSnapshot.deadline.rushFee.amount
      : paidDays * listingSnapshot.deadline.rushFee.amount;

  return {
    days: rushDays,
    paidDays,
    fee: rushFee,
  };
};

/** Calculate total price from selections */
const calculateSelectedPrice = (
  generalOptions?: ProposalInput["generalOptions"],
  subjectOptions?: ProposalInput["subjectOptions"]
): {
  optionGroups: Cents;
  addons: Cents;
} => {
  let optionGroupsTotal = 0;
  let addonsTotal = 0;

  // Sum general options
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

  // Sum subject options
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

  return { optionGroups: optionGroupsTotal, addons: addonsTotal };
};

/** Implementation of the proposal repository */
export const proposalRepository: ProposalRepository = {
  /** Create a new proposal */
  async createProposal(input: ProposalInput): Promise<IProposal> {
    await connectDB();

    // Convert IDs to ObjectId
    const clientId = toObjectId(input.clientId);
    const artistId = toObjectId(input.artistId);
    const listingId = toObjectId(input.listingId);

    // Get listing snapshot
    const listingSnapshot = await this.snapshotListing(listingId.toString());

    // Compute dynamic estimate
    const availability = this.computeDynamicEstimate(listingSnapshot);

    // Validate deadline
    validateDuration(availability, new Date(input.deadline));

    // Validate reference images count
    if (input.referenceImages && input.referenceImages.length > 5) {
      throw new Error("Maximum 5 reference images allowed");
    }

    // Calculate rush and pricing
    const rush = calculateRush(
      listingSnapshot,
      new Date(input.deadline),
      availability
    );
    const { optionGroups: optionGroupsPrice, addons: addonsPrice } =
      calculateSelectedPrice(input.generalOptions, input.subjectOptions);

    const calculatedPrice = {
      base: listingSnapshot.basePrice,
      optionGroups: optionGroupsPrice,
      addons: addonsPrice,
      rush: rush?.fee || 0,
      discount: 0,
      surcharge: 0,
      total:
        listingSnapshot.basePrice +
        optionGroupsPrice +
        addonsPrice +
        (rush?.fee || 0),
    };

    // Create proposal
    const proposal = new Proposal({
      clientId,
      artistId,
      listingId,
      listingSnapshot,
      status: "pendingArtist",
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      availability,
      deadline: input.deadline,
      rush,
      generalDescription: input.generalDescription,
      referenceImages: input.referenceImages || [],
      generalOptions: input.generalOptions || {},
      subjectOptions: input.subjectOptions || {},
      calculatedPrice,
    });

    return proposal.save();
  },

  /** Get proposal by ID */
  async getProposalById(id: string | ObjectId): Promise<IProposal | null> {
    await connectDB();
    return Proposal.findById(toObjectId(id));
  },

  /** Find proposals by artist */
  async findProposalsByArtist(
    artistId: string | ObjectId,
    opts?: FindOpts
  ): Promise<IProposal[]> {
    await connectDB();

    const query: any = { artistId: toObjectId(artistId) };

    if (opts?.status) {
      query.status = { $in: opts.status };
    }

    if (opts?.beforeExpire) {
      query.expiresAt = { $gt: new Date() };
    }

    return Proposal.find(query).sort({ createdAt: -1 });
  },

  /** Find proposals by client */
  async findProposalsByClient(
    clientId: string | ObjectId,
    opts?: FindOpts
  ): Promise<IProposal[]> {
    await connectDB();

    const query: any = { clientId: toObjectId(clientId) };

    if (opts?.status) {
      query.status = { $in: opts.status };
    }

    return Proposal.find(query).sort({ createdAt: -1 });
  },

  /** Find proposals by listing */
  async findProposalsByListing(
    listingId: string | ObjectId
  ): Promise<IProposal[]> {
    await connectDB();
    return Proposal.find({ listingId: toObjectId(listingId) }).sort({
      createdAt: -1,
    });
  },

  /** Find expired proposals */
  async findExpiredProposals(asOf: Date = new Date()): Promise<IProposal[]> {
    await connectDB();
    return Proposal.find({
      status: { $in: ["pendingArtist", "pendingClient"] },
      expiresAt: { $lte: asOf },
    });
  },

  /** Expire a proposal */
  async expireProposal(id: string | ObjectId): Promise<void> {
    await connectDB();
    await Proposal.findByIdAndUpdate(toObjectId(id), {
      status: "expired",
      $unset: { expiresAt: "" },
    });
  },

  /** Bulk expire pending proposals */
  async bulkExpirePending(asOf: Date = new Date()): Promise<number> {
    await connectDB();
    const result = await Proposal.updateMany(
      {
        status: { $in: ["pendingArtist", "pendingClient"] },
        expiresAt: { $lte: asOf },
      },
      {
        status: "expired",
        $unset: { expiresAt: "" },
      }
    );
    return result.modifiedCount;
  },

  /** Artist responds to proposal */
  async artistResponds(
    id: string | ObjectId,
    accepts: boolean,
    adjustment?: ArtistAdjustment,
    rejectionReason?: string
  ): Promise<IProposal> {
    await connectDB();

    const proposalId = toObjectId(id);
    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "pendingArtist") {
      throw new Error("Proposal is not in pendingArtist status");
    }

    // Check if proposal is expired
    if (proposal.expiresAt && proposal.expiresAt < new Date()) {
      throw new Error("Proposal has expired");
    }

    if (!accepts) {
      if (!rejectionReason) {
        throw new Error("Rejection reason is required when rejecting");
      }

      proposal.status = "rejectedArtist";
      proposal.rejectionReason = rejectionReason;
      proposal.expiresAt = undefined;

      return proposal.save();
    }

    // Accept with optional adjustment
    if (adjustment?.surcharge || adjustment?.discount) {
      // Calculate new price with adjustment
      const surchargeAmount = adjustment.surcharge?.amount || 0;
      const discountAmount = adjustment.discount?.amount || 0;

      proposal.artistAdjustments = adjustment;
      proposal.calculatedPrice.surcharge = surchargeAmount;
      proposal.calculatedPrice.discount = discountAmount;
      proposal.calculatedPrice.total =
        proposal.calculatedPrice.base +
        proposal.calculatedPrice.optionGroups +
        proposal.calculatedPrice.addons +
        proposal.calculatedPrice.rush +
        surchargeAmount -
        discountAmount;

      proposal.status = "pendingClient";
      proposal.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // Another 72 hours
    } else {
      proposal.status = "accepted";
      proposal.expiresAt = undefined;
    }

    return proposal.save();
  },

  /** Client responds to adjustment */
  async clientRespondsToAdjustment(
    id: string | ObjectId,
    accepts: boolean,
    rejectionReason?: string
  ): Promise<IProposal> {
    await connectDB();

    const proposalId = toObjectId(id);
    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "pendingClient") {
      throw new Error("Proposal is not in pendingClient status");
    }

    if (accepts) {
      proposal.status = "accepted";
      proposal.expiresAt = undefined;
    } else {
      proposal.status = "rejectedClient";
      if (rejectionReason) {
        proposal.rejectionReason = rejectionReason;
      }
      proposal.expiresAt = undefined;
    }

    return proposal.save();
  },

  /** Finalize acceptance */
  async finalizeAcceptance(id: string | ObjectId): Promise<IProposal> {
    await connectDB();

    const proposalId = toObjectId(id);
    const proposal = await Proposal.findById(proposalId);

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "accepted") {
      throw new Error("Proposal is not in accepted status");
    }

    // Additional finalization logic can be added here
    // e.g., trigger events for escrow, slot reduction, etc.

    return proposal;
  },

  /** Compute dynamic estimate */
  // TODO: Refactor later if contract is implemented
  // Dynamic estimate is counted based on artist active contract that has the highest deadline (most likely the latest contract the artist has)
  // Now only applies if there's no active contract for the artist
  computeDynamicEstimate(
    listing: ListingSnapshot,
    availability?: Estimate
  ): Estimate {
    const now = new Date();
    let earliestDate: Date;
    let latestDate: Date;

    if (availability) {
      // Use provided availability if available
      return availability;
    }

    // Calculate based on deadline mode
    switch (listing.deadline.mode) {
      case "standard":
        earliestDate = new Date(
          now.getTime() + listing.deadline.min * 24 * 60 * 60 * 1000
        );
        latestDate = new Date(
          now.getTime() + listing.deadline.max * 24 * 60 * 60 * 1000
        );
        break;
      case "withDeadline":
      case "withRush":
        earliestDate = new Date(
          now.getTime() + listing.deadline.min * 24 * 60 * 60 * 1000
        );
        latestDate = new Date(
          now.getTime() + listing.deadline.max * 24 * 60 * 60 * 1000
        );
        break;
      default:
        throw new Error("Invalid deadline mode");
    }

    return { earliestDate, latestDate };
  },

  /** Create listing snapshot */
  async snapshotListing(
    listingId: string | ObjectId
  ): Promise<ListingSnapshot> {
    await connectDB();

    const listing = await CommissionListing.findById(toObjectId(listingId));

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Create snapshot with only required fields
    const snapshot: ListingSnapshot = {
      title: listing.title,
      basePrice: listing.basePrice,
      slots: listing.slots,
      generalOptions: listing.generalOptions,
      subjectOptions: listing.subjectOptions,
      cancelationFee: listing.cancelationFee,
      deadline: listing.deadline,
      revisions: listing.revisions,
      milestones: listing.milestones,
    };

    return snapshot;
  },

  /** Recalculate rush and price */
  recalculateRushAndPrice(proposal: IProposal): IProposal {
    const { listingSnapshot, deadline, availability } = proposal;

    // Recalculate rush
    const rush = calculateRush(
      listingSnapshot,
      new Date(deadline),
      availability
    );

    // Recalculate price
    const { optionGroups: optionGroupsPrice, addons: addonsPrice } =
      calculateSelectedPrice(proposal.generalOptions, proposal.subjectOptions);

    proposal.rush = rush || undefined;
    proposal.calculatedPrice = {
      base: listingSnapshot.basePrice,
      optionGroups: optionGroupsPrice,
      addons: addonsPrice,
      rush: rush?.fee || 0,
      discount: proposal.calculatedPrice.discount || 0,
      surcharge: proposal.calculatedPrice.surcharge || 0,
      total:
        listingSnapshot.basePrice +
        optionGroupsPrice +
        addonsPrice +
        (rush?.fee || 0) +
        (proposal.calculatedPrice.surcharge || 0) -
        (proposal.calculatedPrice.discount || 0),
    };

    return proposal;
  },
};
