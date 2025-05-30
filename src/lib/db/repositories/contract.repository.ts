// src/lib/db/repositories/contract.repository.ts
import { connectDB } from "@/lib/db/connection";
import Contract, { IContract } from "@/lib/db/models/contract.model";
import { ClientSession, Types } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";
import { toObjectId } from "@/lib/utils/toObjectId";
import {
  ensureModelsRegistered,
  FinalUpload,
  ProgressUploadMilestone,
  RevisionUpload,
} from "../models";
import {
  IProgressUploadMilestone,
  IFinalUpload,
  IRevisionUpload,
} from "../models/upload.model";

// Interface for creating a new contract
export interface CreateContractInput {
  clientId: string | ObjectId;
  artistId: string | ObjectId;
  listingId: string | ObjectId;
  proposalId: string | ObjectId;
  proposalSnapshot: any; // The snapshot of the accepted proposal
  contractTerms: Array<{
    contractVersion: number;
    generalDescription: string;
    referenceImages: string[];
    generalOptions?: any;
    subjectOptions?: any;
  }>;
  deadlineAt: ISODate;
  graceEndsAt: ISODate;
  finance: {
    basePrice: number;
    optionFees: number;
    addons: number;
    rushFee: number;
    discount: number;
    surcharge: number;
    total: number;
  };
  escrowTxnId: string | ObjectId;
  flow?: "standard" | "milestone";
  milestones?: Array<{
    index: number;
    title: string;
    percent: number;
    revisionPolicy?: any;
  }>;
  revisionPolicy?: any;
}

/**
 * Find contract by ID with robust error handling
 */
export async function findContractById(
  contractId: string | ObjectId,
  options: {
    session?: ClientSession;
    lean?: boolean;
    populate?: string[];
  } = {}
): Promise<IContract | null> {
  try {
    // Ensure all models are registered
    ensureModelsRegistered();

    const { session, lean = false, populate = [] } = options;

    let query = Contract.findById(contractId);

    // Apply population if requested
    if (populate && populate.length > 0) {
      try {
        populate.forEach((path) => {
          query = query.populate(path);
        });
      } catch (err) {
        console.warn(
          `Population error for path(s) ${populate.join(", ")}:`,
          err
        );
        // Continue without population
      }
    }

    if (session) {
      query = query.session(session);
    }

    if (lean) {
      query = query.lean();
    }

    return await query.exec();
  } catch (error) {
    console.error("Error in findContractById:", error);
    // If it's a specific model error, try again without population
    if (error instanceof Error && error.name === "MissingSchemaError") {
      try {
        const { session, lean = false } = options;
        let query = Contract.findById(contractId);

        if (session) {
          query = query.session(session);
        }

        if (lean) {
          query = query.lean();
        }

        return await query.exec();
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// Find contracts by user (as client or artist)
export async function findContractsByUser(
  userId: string | ObjectId,
  role: "client" | "artist" | "both",
  options?: { status?: string[]; lean?: boolean; session?: ClientSession }
): Promise<IContract[]> {
  await connectDB();

  const filter: any = {};

  if (role === "client") {
    filter.clientId = toObjectId(userId);
  } else if (role === "artist") {
    filter.artistId = toObjectId(userId);
  } else if (role === "both") {
    filter.$or = [
      { clientId: toObjectId(userId) },
      { artistId: toObjectId(userId) },
    ];
  }

  if (options?.status && options.status.length > 0) {
    filter.status = { $in: options.status };
  }

  let query = Contract.find(filter).sort({ updatedAt: -1 });

  if (options?.session) {
    query = query.session(options.session);
  }

  if (options?.lean) {
    return query.lean<IContract[]>();
  }

  return query;
}

// Create a new contract
export async function createContract(
  input: CreateContractInput,
  session?: ClientSession
): Promise<IContract> {
  await connectDB();

  const contract = new Contract({
    contractVersion: 1,
    clientId: toObjectId(input.clientId),
    artistId: toObjectId(input.artistId),
    listingId: toObjectId(input.listingId),
    proposalId: toObjectId(input.proposalId),
    proposalSnapshot: input.proposalSnapshot,
    contractTerms: input.contractTerms,
    status: "active",
    statusHistory: [{ event: "active", at: new Date() }],
    workPercentage: 0,
    deadlineAt: input.deadlineAt,
    graceEndsAt: input.graceEndsAt,
    finance: input.finance,
    escrowTxnId: toObjectId(input.escrowTxnId),
    cancelTickets: [],
    revisionTickets: [],
    changeTickets: [],
    resolutionTickets: [],
    progressUploadsStandard: [],
    progressUploadsMilestone: [],
    revisionUploads: [],
    finalUploads: [],
  });

  // Add flow-specific fields
  if (input.flow === "milestone" && input.milestones) {
    contract.flow = "milestone";
    contract.milestones = input.milestones;
    contract.currentMilestoneIndex = 0;

    // Set the first milestone as in progress
    if (contract.milestones.length > 0) {
      contract.milestones[0].status = "inProgress";
      contract.milestones[0].startedAt = new Date();
    }
  }

  // Add revision policy if provided
  if (input.revisionPolicy) {
    contract.revisionPolicy = input.revisionPolicy;
    contract.revisionDone = 0;
  }

  return contract.save({ session });
}

// Update contract status
export async function updateContractStatus(
  id: string | ObjectId,
  status: IContract["status"],
  workPercentage?: number,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const update: any = {
    status,
    $push: { statusHistory: { event: status, at: new Date() } },
  };

  if (workPercentage !== undefined) {
    update.workPercentage = workPercentage;
  }

  return Contract.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

// Update contract deadline
export async function updateContractDeadline(
  id: string | ObjectId,
  deadlineAt: ISODate,
  graceEndsAt: ISODate,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const contract = await Contract.findById(toObjectId(id)).session(
    session || null
  );
  if (!contract) return null;

  // Record the extension
  const extension = {
    requestedAt: new Date(),
    previousDeadlineAt: contract.deadlineAt,
    previousGraceEndsAt: contract.graceEndsAt,
    newDeadlineAt: deadlineAt,
    newGraceEndsAt: graceEndsAt,
  };

  if (!contract.lateExtensions) {
    contract.lateExtensions = [];
  }

  contract.lateExtensions.push(extension);
  contract.deadlineAt = deadlineAt;
  contract.graceEndsAt = graceEndsAt;

  return contract.save({ session });
}

// Update contract terms
export async function updateContractTerms(
  id: string | ObjectId,
  newTerms: any, // New contract terms object
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const contract = await Contract.findById(toObjectId(id)).session(
    session || null
  );
  if (!contract) return null;

  // Increment contract version
  const newVersion = contract.contractVersion + 1;

  // Add new terms to the terms array
  contract.contractTerms.push({
    contractVersion: newVersion,
    generalDescription: newTerms.generalDescription,
    referenceImages: newTerms.referenceImages,
    generalOptions: newTerms.generalOptions,
    subjectOptions: newTerms.subjectOptions,
  });

  contract.contractVersion = newVersion;

  return contract.save({ session });
}

// Add a ticket ID to the appropriate ticket array
export async function addTicketToContract(
  contractId: string | ObjectId,
  ticketType: "cancel" | "revision" | "change" | "resolution",
  ticketId: string | ObjectId,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const arrayField = `${ticketType}Tickets`;

  const update = {
    $push: { [arrayField]: toObjectId(ticketId) },
  };

  return Contract.findByIdAndUpdate(toObjectId(contractId), update, {
    new: true,
    session,
  });
}

// Add an upload ID to the appropriate upload array
export async function addUploadToContract(
  contractId: string | ObjectId,
  uploadType: "progressStandard" | "progressMilestone" | "revision" | "final",
  uploadId: string | ObjectId,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const arrayField = {
    progressStandard: "progressUploadsStandard",
    progressMilestone: "progressUploadsMilestone",
    revision: "revisionUploads",
    final: "finalUploads",
  }[uploadType];

  const update = {
    $push: { [arrayField]: toObjectId(uploadId) },
  };

  return Contract.findByIdAndUpdate(toObjectId(contractId), update, {
    new: true,
    session,
  });
}

// Update milestone status
export async function updateMilestoneStatus(
  contractId: string | ObjectId,
  milestoneIdx: number,
  status: "pending" | "inProgress" | "submitted" | "accepted" | "rejected",
  uploadId?: string | ObjectId,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const contract = await Contract.findById(toObjectId(contractId)).session(
    session || null
  );
  if (!contract || !contract.milestones || !contract.milestones[milestoneIdx]) {
    return null;
  }

  const milestone = contract.milestones[milestoneIdx];
  milestone.status = status;

  // Update timestamps based on status
  if (status === "inProgress" && !milestone.startedAt) {
    milestone.startedAt = new Date();
  } else if (status === "submitted") {
    milestone.submittedAt = new Date();
  } else if (status === "accepted") {
    milestone.completedAt = new Date();

    // Update work percentage based on completed milestones
    let completedPercentage = 0;
    for (const m of contract.milestones) {
      if (m.status === "accepted") {
        completedPercentage += m.percent;
      }
    }
    contract.workPercentage = completedPercentage;

    // If milestone has an upload ID, set it
    if (uploadId) {
      milestone.acceptedUploadId = toObjectId(uploadId);
    }

    // If this isn't the last milestone, set the next one to inProgress
    if (milestoneIdx < contract.milestones.length - 1) {
      contract.milestones[milestoneIdx + 1].status = "inProgress";
      contract.milestones[milestoneIdx + 1].startedAt = new Date();
      contract.currentMilestoneIndex = milestoneIdx + 1;
    }
  }

  return contract.save({ session });
}

// Increment revision counter
export async function incrementRevisionCounter(
  contractId: string | ObjectId,
  milestoneIdx?: number,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const contract = await Contract.findById(toObjectId(contractId)).session(
    session || null
  );
  if (!contract) return null;

  // For milestone revisions
  if (
    milestoneIdx !== undefined &&
    contract.milestones &&
    contract.milestones[milestoneIdx]
  ) {
    if (contract.milestones[milestoneIdx].revisionDone === undefined) {
      contract.milestones[milestoneIdx].revisionDone = 1;
    } else {
      contract.milestones[milestoneIdx].revisionDone += 1;
    }
  }
  // For standard revisions
  else if (contract.revisionDone !== undefined) {
    contract.revisionDone += 1;
  } else {
    contract.revisionDone = 1;
  }

  return contract.save({ session });
}

// Increment revision counter
export async function decrementRevisionCounter(
  contractId: string | ObjectId,
  milestoneIdx?: number,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const contract = await Contract.findById(toObjectId(contractId)).session(
    session || null
  );
  if (!contract) return null;

  // For milestone revisions
  if (
    milestoneIdx !== undefined &&
    contract.milestones &&
    contract.milestones[milestoneIdx] &&
    contract.milestones[milestoneIdx].revisionDone !== 0
  ) {
    if (contract.milestones[milestoneIdx].revisionDone === undefined) {
      contract.milestones[milestoneIdx].revisionDone = 0;
    } else {
      contract.milestones[milestoneIdx].revisionDone -= 1;
    }
  }
  // For standard revisions
  else if (contract.revisionDone !== undefined && contract.revisionDone !== 0) {
    contract.revisionDone -= 1;
  } else {
    contract.revisionDone = 0;
  }

  return contract.save({ session });
}

// Update finance details (for runtime fees)
export async function updateContractFinance(
  contractId: string | ObjectId,
  runtimeFees: number,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const update = {
    $inc: { "finance.runtimeFees": runtimeFees, "finance.total": runtimeFees },
  };

  return Contract.findByIdAndUpdate(toObjectId(contractId), update, {
    new: true,
    session,
  });
}

// Set contract completion details
export async function setContractCompletion(
  contractId: string | ObjectId,
  percentComplete: number,
  clientRating?: number,
  reviewId?: string | ObjectId,
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const update: any = {
    "completion.percentComplete": percentComplete,
  };

  if (clientRating) {
    update["completion.clientRating"] = clientRating;
  }

  if (reviewId) {
    update["completion.reviewId"] = toObjectId(reviewId);
  }

  return Contract.findByIdAndUpdate(
    toObjectId(contractId),
    { $set: update },
    { new: true, session }
  );
}

// Set contract cancellation summary
export async function setContractCancellation(
  contractId: string | ObjectId,
  cancelSummary: {
    by: "client" | "artist";
    at: ISODate;
    isLate: boolean;
    workPercentage: number;
    artistPayout: number;
    clientPayout: number;
    escrowTxnIds: Array<string | ObjectId>;
  },
  session?: ClientSession
): Promise<IContract | null> {
  await connectDB();

  const formattedSummary = {
    ...cancelSummary,
    escrowTxnIds: cancelSummary.escrowTxnIds.map((id) => toObjectId(id)),
  };

  return Contract.findByIdAndUpdate(
    toObjectId(contractId),
    { $set: { cancelSummary: formattedSummary } },
    { new: true, session }
  );
}

// Calculate the appropriate payouts based on contract status and work progress
export async function calculateContractPayouts(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<{
  artistPayout: number;
  clientPayout: number;
}> {
  await connectDB();

  const contract = await Contract.findById(toObjectId(contractId)).session(
    session || null
  );
  if (!contract) {
    throw new Error("Contract not found");
  }

  const { status, workPercentage, finance, cancelSummary } = contract;

  // If cancellation has already been calculated, return those values
  if (cancelSummary) {
    return {
      artistPayout: cancelSummary.artistPayout,
      clientPayout: cancelSummary.clientPayout,
    };
  }

  const totalAmount = finance.total;
  let artistPayout = 0;
  let clientPayout = 0;

  // Calculate based on status
  switch (status) {
    case "completed":
      // Full payment to artist
      artistPayout = totalAmount;
      break;

    case "completedLate":
      // Artist gets total minus late penalty
      const latePenalty =
        (totalAmount * (contract.latePenaltyPercent || 10)) / 100;
      artistPayout = totalAmount - latePenalty;
      clientPayout = latePenalty;
      break;

    case "cancelledClient":
      // Calculate based on work percentage plus cancellation fee
      const cancellationFee =
        contract.cancelationFee?.kind === "flat"
          ? contract.cancelationFee.amount
          : (totalAmount * contract.cancelationFee?.amount) / 100;

      artistPayout = (totalAmount * workPercentage) / 100 + cancellationFee;
      clientPayout = totalAmount - artistPayout;

      // Ensure no negative payouts
      artistPayout = Math.max(0, artistPayout);
      clientPayout = Math.max(0, clientPayout);
      break;

    case "cancelledClientLate":
      // Calculate based on work percentage and late penalty (no cancellation fee)
      const clientLatePenalty =
        (totalAmount * (contract.latePenaltyPercent || 10)) / 100;

      artistPayout = (totalAmount * workPercentage) / 100 - clientLatePenalty;
      clientPayout =
        totalAmount - (totalAmount * workPercentage) / 100 + clientLatePenalty;

      // Ensure no negative payouts
      artistPayout = Math.max(0, artistPayout);
      clientPayout = Math.max(0, clientPayout);
      break;

    case "cancelledArtist":
      // Calculate based on work percentage minus cancellation fee
      const artistCancellationFee =
        contract.cancelationFee?.kind === "flat"
          ? contract.cancelationFee.amount
          : (totalAmount * contract.cancelationFee?.amount) / 100;

      artistPayout =
        (totalAmount * workPercentage) / 100 - artistCancellationFee;
      clientPayout =
        totalAmount -
        (totalAmount * workPercentage) / 100 +
        artistCancellationFee;

      // Ensure no negative payouts
      artistPayout = Math.max(0, artistPayout);
      clientPayout = Math.max(0, clientPayout);
      break;

    case "cancelledArtistLate":
      // Calculate based on work percentage, late penalty, and cancellation fee
      const artistLatePenalty =
        (totalAmount * (contract.latePenaltyPercent || 10)) / 100;
      const artistLateCancellationFee =
        contract.cancelationFee?.kind === "flat"
          ? contract.cancelationFee.amount
          : (totalAmount * contract.cancelationFee?.amount) / 100;

      artistPayout =
        (totalAmount * workPercentage) / 100 -
        artistLatePenalty -
        artistLateCancellationFee;
      clientPayout =
        totalAmount -
        (totalAmount * workPercentage) / 100 +
        artistLatePenalty +
        artistLateCancellationFee;

      // Ensure no negative payouts
      artistPayout = Math.max(0, artistPayout);
      clientPayout = Math.max(0, clientPayout);
      break;

    case "notCompleted":
      // Full refund to client
      clientPayout = totalAmount;
      break;

    default:
      // For active contracts, no payout yet
      break;
  }

  return { artistPayout, clientPayout };
}

// src/lib/db/repositories/contract.repository.ts (add this function)

/**
 * Get the latest active contract deadline for an artist
 * This is used to calculate availability windows when creating new proposals
 */
export async function getLatestActiveContractDeadline(
  artistId: string | ObjectId
): Promise<Date | null> {
  await connectDB();

  try {
    // Find all active contracts for the artist
    const activeContracts = await Contract.find({
      artistId: toObjectId(artistId),
      status: "active",
      deadlineAt: { $exists: true },
    })
      .sort({ deadlineAt: -1 }) // Sort by deadline in descending order (latest first)
      .limit(1);

    // Return the deadline of the latest contract, or null if none exists
    return activeContracts.length > 0 ? activeContracts[0].deadlineAt : null;
  } catch (error) {
    // Handle case where the contracts collection might not exist yet
    if (
      error instanceof Error &&
      (error.message.includes("Collection doesn't exist") ||
        error.name === "MongoServerError")
    ) {
      return null;
    }

    // Re-throw any other errors
    throw error;
  }
}

/**
 * Find active contracts that have passed their grace period for a specific user
 *
 * @param userId - ID of the user (artist or client)
 * @param role - Role of the user ("artist", "client", or "both")
 * @param session - Optional MongoDB session for transaction
 * @returns Array of contracts that have passed their grace period for the user
 */
export async function findContractsPastGracePeriodByUser(
  userId: string | ObjectId,
  role: "artist" | "client" | "both" = "both",
  session?: ClientSession
): Promise<IContract[]> {
  await connectDB();

  const currentTime = new Date();
  const userObjectId = toObjectId(userId);

  let userFilter: any = {};
  if (role === "artist") {
    userFilter.artistId = userObjectId;
  } else if (role === "client") {
    userFilter.clientId = userObjectId;
  } else {
    userFilter.$or = [{ artistId: userObjectId }, { clientId: userObjectId }];
  }

  return Contract.find({
    ...userFilter,
    status: "active",
    graceEndsAt: { $lt: currentTime },
  }).session(session || null);
}

/**
 * Check if a specific contract has passed its grace period
 *
 * @param contractId - ID of the contract to check
 * @param session - Optional MongoDB session for transaction
 * @returns Boolean indicating if the contract has passed its grace period
 */
export async function isContractPastGracePeriod(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const currentTime = new Date();

  const contract = await Contract.findOne({
    _id: toObjectId(contractId),
    status: "active",
    graceEndsAt: { $lt: currentTime },
  }).session(session || null);

  return !!contract;
}

