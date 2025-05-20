// src/lib/services/contract.service.ts
import type { ObjectId, Cents, ISODate } from "@/types/common";
import * as contractRepo from "@/lib/db/repositories/contract.repository";
import * as escrowService from "./escrowTransaction.service";
import * as walletService from "./wallet.service";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import {
  finalizeAcceptance,
  findProposalById,
} from "@/lib/db/repositories/proposal.repository";
import { HttpError } from "./commissionListing.service";
import { applySlotDelta } from "./commissionListing.service";
import { IContract } from "../db/models/contract.model";
import { connectDB } from "../db/connection";
import { ClientSession, startSession } from "mongoose";
import { toObjectId } from "../utils/toObjectId";

//=============================================================================
// CONTRACT RETRIEVAL FUNCTIONS
//=============================================================================

/**
 * Get contract by ID with appropriate permissions check
 *
 * @param contractId - ID of the contract to retrieve
 * @param userId - ID of the user requesting the contract
 * @returns The contract document if found and user has permission
 * @throws HttpError if contract not found or user doesn't have permission
 */
export async function getContractById(
  contractId: string | ObjectId,
  userId: string
): Promise<IContract> {
  try {
    await connectDB();

    // Try to populate everything but catch specific errors
    try {
      const contract = await contractRepo.findContractById(contractId, {
        lean: true,
        populate: [
          "cancelTickets",
          "revisionTickets",
          "changeTickets",
          "resolutionTickets",
        ],
      });

      if (!contract) {
        throw new HttpError("Contract not found", 404);
      }

      // Verify user is part of the contract
      const isClient = contract.clientId.toString() === userId;
      const isArtist = contract.artistId.toString() === userId;

      if (!isClient && !isArtist) {
        throw new HttpError("Not authorized to view this contract", 403);
      }

      return contract;
    } catch (error) {
      // If the error is related to missing model registration, try again without populating
      if (error instanceof Error && error.name === "MissingSchemaError") {
        console.warn(
          "Schema registration issue detected, fetching without population"
        );

        const contract = await contractRepo.findContractById(contractId, {
          lean: true,
          // Skip population
        });

        if (!contract) {
          throw new HttpError("Contract not found", 404);
        }

        // Verify user is part of the contract
        const isClient = contract.clientId.toString() === userId;
        const isArtist = contract.artistId.toString() === userId;

        if (!isClient && !isArtist) {
          throw new HttpError("Not authorized to view this contract", 403);
        }

        // Provide empty arrays for the tickets that couldn't be populated
        contract.cancelTickets = [];
        contract.revisionTickets = [];
        contract.changeTickets = [];
        contract.resolutionTickets = [];

        return contract;
      }

      throw error;
    }
  } catch (error) {
    console.error("Error in getContractById:", error);
    throw error;
  }
}

/**
 * Get all contracts for a user (as client, artist or both)
 *
 * @param userId - ID of the user whose contracts to retrieve
 * @returns Object containing two arrays: contracts as client and contracts as artist
 */
export async function getUserContracts(userId: string): Promise<{
  asClient: IContract[];
  asArtist: IContract[];
}> {
  const clientContracts = await contractRepo.findContractsByUser(
    userId,
    "client",
    { lean: true }
  );
  const artistContracts = await contractRepo.findContractsByUser(
    userId,
    "artist",
    { lean: true }
  );

  return {
    asClient: clientContracts,
    asArtist: artistContracts,
  };
}

/**
 * Get the artist's latest active contract deadline
 * Used for calculating availability windows for new proposals
 *
 * @param artistId - ID of the artist to check
 * @returns The latest deadline date or null if no active contracts
 */
export async function getLatestActiveContractDeadline(
  artistId: string | ObjectId
): Promise<Date | null> {
  try {
    const deadline = await contractRepo.getLatestActiveContractDeadline(
      artistId
    );
    return deadline;
  } catch (error) {
    console.error("Error getting latest contract deadline:", error);
    // In case of error, return null to indicate no active contracts
    // This is safer than blocking proposal creation
    return null;
  }
}

//=============================================================================
// CONTRACT CREATION FUNCTIONS
//=============================================================================

/**
 * Create a new contract from an accepted proposal
 *
 * @param proposalId - ID of the accepted proposal
 * @param paymentAmount - Initial payment amount in cents
 * @returns The newly created contract
 * @throws HttpError if proposal not found or not in accepted status
 */
export async function createContractFromProposal(
  proposalId: string | ObjectId,
  paymentAmount: Cents
): Promise<IContract> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the proposal
    const proposal = await findProposalById(proposalId);
    if (!proposal) {
      throw new HttpError("Proposal not found", 404);
    }

    if (proposal.status !== "accepted") {
      throw new HttpError(
        "Proposal must be in accepted status to create a contract",
        400
      );
    }

    // Create escrow hold transaction
    const holdTransaction = await escrowService.createHoldTransaction(
      proposalId, // Temporarily use proposalId until we have contractId
      proposal.clientId,
      paymentAmount,
      "Initial contract payment"
    );

    // Calculate deadline and grace period
    const deadlineAt = new Date(proposal.deadline);
    const graceEndsAt = new Date(deadlineAt);
    graceEndsAt.setDate(
      graceEndsAt.getDate() + (proposal.listingSnapshot.graceDays || 7)
    );

    // Create initial contract terms from proposal
    const contractTerms = [
      {
        contractVersion: 1,
        generalDescription: proposal.generalDescription,
        referenceImages: proposal.referenceImages,
        generalOptions: proposal.generalOptions,
        subjectOptions: proposal.subjectOptions,
      },
    ];

    // Create finance object
    const finance = {
      basePrice: proposal.calculatedPrice.base,
      optionFees: proposal.calculatedPrice.optionGroups,
      addons: proposal.calculatedPrice.addons,
      rushFee: proposal.calculatedPrice.rush,
      discount: proposal.calculatedPrice.discount,
      surcharge: proposal.calculatedPrice.surcharge,
      runtimeFees: 0,
      total: proposal.calculatedPrice.total,
      totalPaid: paymentAmount,
      totalOwnedByArtist: 0,
      totalOwnedByClient: 0,
    };

    // Create contract input
    const contractInput: contractRepo.CreateContractInput = {
      clientId: proposal.clientId,
      artistId: proposal.artistId,
      listingId: proposal.listingId,
      proposalId: proposal._id,
      proposalSnapshot: proposal.toObject(),
      contractTerms,
      deadlineAt,
      graceEndsAt,
      finance,
      escrowTxnId: holdTransaction._id,
      flow: proposal.listingSnapshot.flow,
    };

    // Add milestones if milestone flow
    if (
      proposal.listingSnapshot.flow === "milestone" &&
      proposal.listingSnapshot.milestones
    ) {
      if (proposal.listingSnapshot.revisions?.type === "milestone") {
        contractInput.milestones = proposal.listingSnapshot.milestones.map(
          (m: any, idx: number) => ({
            index: idx,
            title: m.title,
            percent: m.percent,
            status: idx === 0 ? "inProgress" : "pending",
            revisionPolicy: m.policy,
          })
        );
      } else {
        contractInput.milestones = proposal.listingSnapshot.milestones.map(
          (m: any, idx: number) => ({
            index: idx,
            title: m.title,
            percent: m.percent,
            status: idx === 0 ? "inProgress" : "pending",
          })
        );
      }
    }

    // Add revision policy if standard
    if (proposal.listingSnapshot.revisions?.type === "standard") {
      contractInput.revisionPolicy = proposal.listingSnapshot.revisions.policy;
    }

    // Create the contract
    const contract = await contractRepo.createContract(contractInput, session);

    // Update the escrow transaction with the correct contractId
    await escrowService.updateTransactionContract(
      holdTransaction._id,
      contract._id,
      session
    );

    await finalizeAcceptance(proposalId, session);

    await session.commitTransaction();

    // Update the listing to increment slots used
    await applySlotDelta(proposal.listingId.toString(), 1);
    return contract;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

//=============================================================================
// CONTRACT UPDATE FUNCTIONS
//=============================================================================

/**
 * Update contract status
 *
 * @param contractId - ID of the contract to update
 * @param status - New status for the contract
 * @param workPercentage - Optional work percentage completion
 * @returns The updated contract
 */
export async function updateContractStatus(
  contractId: string | ObjectId,
  status: string,
  workPercentage?: number
): Promise<any> {
  return contractRepo.updateContractStatus(
    contractId,
    status as any,
    workPercentage
  );
}

/**
 * Extend contract deadline
 *
 * @param contractId - ID of the contract to extend
 * @param userId - ID of the user requesting the extension (must be client)
 * @param newDeadline - New deadline date
 * @returns The updated contract
 * @throws HttpError if contract not found or user doesn't have permission
 */
export async function extendContractDeadline(
  contractId: string | ObjectId,
  userId: string,
  newDeadline: ISODate
): Promise<any> {
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is the client
  if (contract.clientId.toString() !== userId) {
    throw new HttpError("Only clients can extend deadlines", 403);
  }

  // Calculate new grace period
  const newGraceEndsAt = new Date(newDeadline);
  newGraceEndsAt.setDate(
    newGraceEndsAt.getDate() +
      (contract.proposalSnapshot.listingSnapshot.graceDays || 7)
  );

  return contractRepo.updateContractDeadline(
    contractId,
    newDeadline,
    newGraceEndsAt
  );
}

/**
 * Update contract terms (after a change ticket is accepted)
 *
 * @param contractId - ID of the contract to update
 * @param newTerms - New terms to apply to the contract
 * @returns The updated contract
 */
export async function updateContractTerms(
  contractId: string | ObjectId,
  newTerms: any
): Promise<any> {
  return contractRepo.updateContractTerms(contractId, newTerms);
}

/**
 * Update contract finance (for runtime fees like revision or change fees)
 *
 * @param contractId - ID of the contract to update
 * @param runtimeFees - Fees to add to the contract
 * @param session - MongoDB session for transaction
 * @returns The updated contract
 */
export async function updateContractFinance(
  contractId: string | ObjectId,
  runtimeFees: number,
  session: ClientSession
): Promise<any> {
  return contractRepo.updateContractFinance(contractId, runtimeFees, session);
}

//=============================================================================
// CONTRACT MILESTONE FUNCTIONS
//=============================================================================

/**
 * Update milestone status
 *
 * @param contractId - ID of the contract containing the milestone
 * @param milestoneIdx - Index of the milestone to update
 * @param status - New status for the milestone
 * @param uploadId - Optional ID of the upload associated with this milestone update
 * @param session - Optional MongoDB session for transaction
 * @returns The updated contract with updated milestone
 */
export async function updateMilestoneStatus(
  contractId: string | ObjectId,
  milestoneIdx: number,
  status: "pending" | "inProgress" | "submitted" | "accepted" | "rejected",
  uploadId?: string | ObjectId,
  session?: ClientSession
): Promise<any> {
  return contractRepo.updateMilestoneStatus(
    contractId,
    milestoneIdx,
    status,
    uploadId,
    session
  );
}

/**
 * Increment revision counter for a contract or specific milestone
 *
 * @param contractId - ID of the contract
 * @param session - MongoDB session for transaction
 * @param milestoneIdx - Optional index of the milestone (for milestone-based revisions)
 * @returns The updated contract
 */
export async function incrementRevisionCounter(
  contractId: string | ObjectId,
  session: ClientSession,
  milestoneIdx?: number
): Promise<any> {
  return contractRepo.incrementRevisionCounter(
    contractId,
    milestoneIdx,
    session
  );
}

/**
 * Decrement revision counter for a contract or specific milestone
 *
 * @param contractId - ID of the contract
 * @param session - MongoDB session for transaction
 * @param milestoneIdx - Optional index of the milestone (for milestone-based revisions)
 * @returns The updated contract
 */
export async function decrementRevisionCounter(
  contractId: string | ObjectId,
  session: ClientSession,
  milestoneIdx?: number
): Promise<any> {
  return contractRepo.decrementRevisionCounter(
    contractId,
    milestoneIdx,
    session
  );
}

//=============================================================================
// CONTRACT TICKET & UPLOAD FUNCTIONS
//=============================================================================

/**
 * Add a ticket reference to a contract
 *
 * @param contractId - ID of the contract
 * @param ticketType - Type of ticket (cancel, revision, change, resolution)
 * @param ticketId - ID of the ticket to add
 * @param session - Optional MongoDB session for transaction
 * @returns The updated contract
 * @throws Error if contract not found or ticket type invalid
 */
export async function addTicketToContract(
  contractId: string | ObjectId,
  ticketType: "cancel" | "revision" | "change" | "resolution",
  ticketId: string | ObjectId,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId, { session });
  if (!contract) {
    throw new Error("Contract not found");
  }

  // Map ticket type to the appropriate contract field
  let updateField;
  switch (ticketType) {
    case "cancel":
      updateField = "cancelTickets";
      break;
    case "revision":
      updateField = "revisionTickets";
      break;
    case "change":
      updateField = "changeTickets";
      break;
    case "resolution":
      updateField = "resolutionTickets";
      break;
    default:
      throw new Error(`Invalid ticket type: ${ticketType}`);
  }

  // Create update object
  const update = { $push: { [updateField]: toObjectId(ticketId) } };

  // Update the contract
  return contractRepo.addTicketToContract(
    contractId,
    ticketType,
    toObjectId(ticketId),
    session
  );
}

/**
 * Add an upload to a contract
 *
 * @param contractId - ID of the contract
 * @param uploadType - Type of upload (progressStandard, progressMilestone, revision, final)
 * @param uploadId - ID of the upload to add
 * @param session - Optional MongoDB session for transaction
 * @returns The updated contract
 */
export async function addUploadToContract(
  contractId: string | ObjectId,
  uploadType: "progressStandard" | "progressMilestone" | "revision" | "final",
  uploadId: string | ObjectId,
  session?: ClientSession
): Promise<any> {
  return contractRepo.addUploadToContract(
    contractId,
    uploadType,
    uploadId,
    session
  );
}

//=============================================================================
// CONTRACT COMPLETION & CANCELLATION FUNCTIONS
//=============================================================================

/**
 * Process contract completion (Final delivery accepted)
 *
 * @param contractId - ID of the contract to complete
 * @param isLate - Whether the completion is late (past deadline)
 * @param session - Optional MongoDB session for transaction
 * @returns Object containing the updated contract and transaction details
 * @throws HttpError if contract not found
 */
export async function processContractCompletion(
  contractId: string | ObjectId,
  isLate: boolean = false,
  session?: ClientSession
): Promise<any> {
  await connectDB();
  let localSession: ClientSession | undefined;

  if (!session) {
    localSession = await startSession();
    session = localSession;
  }

  try {
    if (localSession) {
      localSession.startTransaction();
    }

    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Update contract status
    const status = isLate ? "completedLate" : "completed";
    await contractRepo.updateContractStatus(contractId, status, 100, session);

    // Calculate payouts
    const { artistPayout, clientPayout } =
      await contractRepo.calculateContractPayouts(contractId);

    // Process payments
    const transactions = [];

    if (artistPayout > 0) {
      const releaseTx = await escrowService.createReleaseTransaction(
        contractId,
        contract.clientId,
        contract.artistId,
        artistPayout,
        `${status} payment`,
        session
      );
      transactions.push(releaseTx);
    }

    if (clientPayout > 0) {
      const refundTx = await escrowService.createRefundTransaction(
        contractId,
        contract.clientId,
        clientPayout,
        `${status} refund (late penalty)`,
        session
      );
      transactions.push(refundTx);
    }

    // Set contract completion details
    await contractRepo.setContractCompletion(
      contractId,
      100,
      undefined,
      undefined,
      session
    );

    if (localSession) {
      await localSession.commitTransaction();
    }

    return { contract, transactions };
  } catch (error) {
    if (localSession) {
      await localSession.abortTransaction();
    }
    throw error;
  } finally {
    if (localSession) {
      localSession.endSession();
    }
  }
}

/**
 * Process contract cancellation
 *
 * @param contractId - ID of the contract to cancel
 * @param by - Who initiated the cancellation (client or artist)
 * @param workPercentage - Percentage of work completed at cancellation
 * @param isLate - Whether the cancellation is late (past deadline)
 * @param session - Optional MongoDB session for transaction
 * @returns Object containing the updated contract and transaction details
 * @throws HttpError if contract not found
 */
export async function processContractCancellation(
  contractId: string | ObjectId,
  by: "client" | "artist",
  workPercentage: number,
  isLate: boolean = false,
  session?: ClientSession
): Promise<any> {
  await connectDB();
  let localSession: ClientSession | undefined;

  if (!session) {
    localSession = await startSession();
    session = localSession;
  }

  try {
    if (localSession) {
      localSession.startTransaction();
    }

    const contract = await contractRepo.findContractById(contractId, {
      session,
    });

    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Update contract status
    let status: any;
    if (by === "client") {
      status = isLate ? "cancelledClientLate" : "cancelledClient";
    } else {
      status = isLate ? "cancelledArtistLate" : "cancelledArtist";
    }

    await contractRepo.updateContractStatus(
      contractId,
      status,
      workPercentage,
      session
    );

    // Calculate payouts
    const { artistPayout, clientPayout } =
      await contractRepo.calculateContractPayouts(contractId, session);

    // Process payments
    const transactions = [];

    if (artistPayout > 0) {
      const releaseTx = await escrowService.createReleaseTransaction(
        contractId,
        contract.clientId,
        contract.artistId,
        artistPayout,
        `${status} payment`,
        session
      );
      transactions.push(releaseTx);
    }

    if (clientPayout > 0) {
      const refundTx = await escrowService.createRefundTransaction(
        contractId,
        contract.clientId,
        clientPayout,
        `${status} refund`,
        session
      );
      transactions.push(refundTx);
    }

    // Update listing slots (free up the slot)
    await applySlotDelta(contract.listingId.toString(), -1);

    // Set cancel summary
    await contractRepo.setContractCancellation(
      contractId,
      {
        by,
        at: new Date(),
        isLate,
        workPercentage,
        artistPayout,
        clientPayout,
        escrowTxnIds: transactions.map((tx) => tx._id),
      },
      session
    );

    if (localSession) {
      await localSession.commitTransaction();
    }

    return { contract, transactions };
  } catch (error) {
    if (localSession) {
      await localSession.abortTransaction();
    }
    throw error;
  } finally {
    if (localSession) {
      localSession.endSession();
    }
  }
}

/**
 * Process contract not completed (grace period passed)
 *
 * @param contractId - ID of the contract to mark as not completed
 * @returns Object containing the updated contract and refund transaction
 * @throws HttpError if contract not found
 */
export async function processContractNotCompleted(
  contractId: string | ObjectId
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Update contract status
    await contractRepo.updateContractStatus(
      contractId,
      "notCompleted",
      0,
      session
    );

    // Refund client fully
    const refundTx = await escrowService.createRefundTransaction(
      contractId,
      contract.clientId,
      contract.finance.total,
      "Contract not completed refund",
      session
    );

    // Update listing slots (free up the slot)
    await applySlotDelta(contract.listingId.toString(), -1);

    await session.commitTransaction();

    return { contract, transaction: refundTx };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Claim payment or refund for a contract
 *
 * @param contractId - ID of the contract to claim funds from
 * @param userId - ID of the user claiming funds (must be client or artist)
 * @returns Result of the appropriate process function
 * @throws HttpError if contract not found, user doesn't have permission, or no funds to claim
 */
export async function claimFunds(
  contractId: string | ObjectId,
  userId: string
): Promise<any> {
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is part of the contract
  const isClient = contract.clientId.toString() === userId;
  const isArtist = contract.artistId.toString() === userId;

  if (!isClient && !isArtist) {
    throw new HttpError("Not authorized to claim funds for this contract", 403);
  }

  // Verify contract is in a terminal state
  const terminalStates = [
    "completed",
    "completedLate",
    "cancelledClient",
    "cancelledClientLate",
    "cancelledArtist",
    "cancelledArtistLate",
    "notCompleted",
  ];

  if (!terminalStates.includes(contract.status)) {
    throw new HttpError(
      "Contract must be completed or cancelled to claim funds",
      400
    );
  }

  // Process based on user role and contract status
  if (isArtist) {
    // For artist, we need to check if they are owed money
    if (contract.finance.totalOwnedByArtist <= 0) {
      throw new HttpError("No funds to claim", 400);
    }

    // Release funds to artist
    return processContractCompletion(
      contractId,
      contract.status.includes("Late")
    );
  } else {
    // For client, we need to check if they are owed money
    if (contract.finance.totalOwnedByClient <= 0) {
      throw new HttpError("No funds to claim", 400);
    }

    // Refund client
    if (contract.status === "notCompleted") {
      return processContractNotCompleted(contractId);
    } else {
      return processContractCancellation(
        contractId,
        contract.status.includes("Client") ? "client" : "artist",
        contract.workPercentage,
        contract.status.includes("Late")
      );
    }
  }
}

//=============================================================================
// CONTRACT UTILITY FUNCTIONS
//=============================================================================

/**
 * Calculate appropriate payouts for a contract
 *
 * @param contractId - ID of the contract to calculate payouts for
 * @returns Object containing artist and client payout amounts
 */
export async function calculatePayouts(
  contractId: string | ObjectId
): Promise<{ artistPayout: number; clientPayout: number }> {
  return contractRepo.calculateContractPayouts(contractId);
}

/**
 * Determine if a contract is late based on its deadline
 *
 * @param contract - The contract to check
 * @returns True if the current date is past the deadline
 */
export function isContractLate(contract: IContract): boolean {
  // Check if there's a deadline and if current date is past it
  if (contract.deadlineAt) {
    const now = new Date();
    return now > new Date(contract.deadlineAt);
  }
  return false;
}

/**
 * Check if a contract is past grace period
 *
 * @param contract - The contract to check
 * @returns True if the current date is past the grace period end date
 */
export function isContractPastGrace(contract: any): boolean {
  return new Date(contract.graceEndsAt) < new Date();
}
