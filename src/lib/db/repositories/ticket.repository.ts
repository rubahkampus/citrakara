// src/lib/db/repositories/ticket.repository.ts
import { connectDB } from "@/lib/db/connection";
import {
  CancelTicket,
  RevisionTicket,
  ChangeTicket,
  ResolutionTicket,
  ICancelTicket,
  IRevisionTicket,
  IChangeTicket,
  IResolutionTicket,
} from "@/lib/db/models/ticket.model";
import { ClientSession } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import { toObjectId } from "@/lib/utils/toObjectId";

// CANCEL TICKET OPERATIONS
// -----------------------

// Create a cancel ticket
export async function createCancelTicket(
  contractId: ObjectId,
  requestedBy: "client" | "artist",
  reason: string,
  session?: ClientSession
): Promise<ICancelTicket> {
  await connectDB();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour expiration

  const ticket = new CancelTicket({
    contractId: contractId,
    requestedBy,
    reason,
    status: "pending",
    expiresAt,
  });

  return ticket.save({ session });
}

// Get a cancel ticket by ID
export async function findCancelTicketById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<ICancelTicket | null> {
  await connectDB();
  return CancelTicket.findById(toObjectId(id)).session(session || null);
}

// Update a cancel ticket status
export async function updateCancelTicketStatus(
  id: string | ObjectId,
  status: ICancelTicket["status"],
  session?: ClientSession
): Promise<ICancelTicket | null> {
  await connectDB();

  const update: any = { status };

  // If accepted or force accepted, set resolvedAt
  if (status === "accepted" || status === "forcedAccepted") {
    update.resolvedAt = new Date();
  }

  return CancelTicket.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

// Find pending cancellation tickets for a contract
export async function findPendingCancelTickets(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<ICancelTicket[]> {
  await connectDB();

  return CancelTicket.find({
    contractId: toObjectId(contractId),
    status: "pending",
  }).session(session || null);
}

// REVISION TICKET OPERATIONS
// --------------------------

// Create a revision ticket
export interface CreateRevisionTicketInput {
  contractId: ObjectId;
  description: string;
  referenceImages?: string[];
  milestoneIdx?: number;
  paidFee?: Cents;
}

export async function createRevisionTicket(
  input: CreateRevisionTicketInput,
  session?: ClientSession
): Promise<IRevisionTicket> {
  await connectDB();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour expiration

  const ticket = new RevisionTicket({
    contractId: input.contractId,
    description: input.description,
    referenceImages: input.referenceImages || [],
    milestoneIdx: input.milestoneIdx,
    paidFee: input.paidFee,
    status: "pending",
    resolved: false,
    expiresAt,
  });

  return ticket.save({ session });
}

// Get a revision ticket by ID
export async function findRevisionTicketById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionTicket | null> {
  await connectDB();
  console.log("id: ", JSON.stringify(id));
  return RevisionTicket.findById(toObjectId(id)).session(session || null);
}

// Update a revision ticket status
export async function updateRevisionTicketStatus(
  id: string | ObjectId,
  status: IRevisionTicket["status"],
  artistRejectionReason?: string,
  paidFee?: number,
  escrowTxnId?: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionTicket | null> {
  await connectDB();

  const update: any = { status };

  // Add rejection reason if provided
  if (status === "rejected" && artistRejectionReason) {
    update.artistRejectionReason = artistRejectionReason;
  }

  // Add paid fee details if provided
  if (paidFee !== undefined) {
    update.paidFee = paidFee;
  }

  // Add escrow transaction ID if provided
  if (escrowTxnId) {
    update.escrowTxnId = toObjectId(escrowTxnId);
  }

  // If status is terminal, set resolved flag and timestamp
  if (
    ["accepted", "forcedAcceptedArtist", "paid", "cancelled"].includes(status)
  ) {
    update.resolved = true;
    update.resolvedAt = new Date();
  }

  return RevisionTicket.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

// Find active revision tickets for a contract
export async function findActiveRevisionTickets(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionTicket[]> {
  await connectDB();

  return RevisionTicket.find({
    contractId: toObjectId(contractId),
    resolved: false,
  }).session(session || null);
}

// CHANGE TICKET OPERATIONS
// -----------------------

// Input interface for creating a change ticket
export interface CreateChangeTicketInput {
  contractId: ObjectId;
  reason: string;
  changeSet: {
    deadlineAt?: ISODate;
    generalDescription: string;
    referenceImages: string[];
    generalOptions?: any;
    subjectOptions?: any;
  };
  isPaidChange: boolean;
}

// src/lib/db/repositories/ticket.repository.ts (continued)
export async function createChangeTicket(
  input: CreateChangeTicketInput,
  session?: ClientSession
): Promise<IChangeTicket> {
  await connectDB();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour expiration

  const ticket = new ChangeTicket({
    contractId: input.contractId,
    reason: input.reason,
    changeSet: input.changeSet,
    status: "pendingArtist",
    isPaidChange: input.isPaidChange,
    expiresAt,
  });

  return ticket.save({ session });
}

// Get a change ticket by ID
export async function findChangeTicketById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IChangeTicket | null> {
  await connectDB();
  return ChangeTicket.findById(toObjectId(id)).session(session || null);
}

// Update a change ticket status
export async function updateChangeTicketStatus(
  id: string | ObjectId,
  status: IChangeTicket["status"],
  updates?: {
    paidFee?: number;
    isPaidChange?: boolean;
    escrowTxnId?: string | ObjectId;
    contractVersionBefore?: number;
    contractVersionAfter?: number;
  },
  session?: ClientSession
): Promise<IChangeTicket | null> {
  await connectDB();

  const update: any = { status };

  // If updates provided, add them to the update object
  if (updates) {
    if (updates.paidFee !== undefined) {
      update.paidFee = updates.paidFee;
    }

    if (updates.isPaidChange !== undefined) {
      update.isPaidChange = updates.isPaidChange;
    }

    if (updates.escrowTxnId) {
      update.escrowTxnId = toObjectId(updates.escrowTxnId);
    }

    if (updates.contractVersionBefore !== undefined) {
      update.contractVersionBefore = updates.contractVersionBefore;
    }

    if (updates.contractVersionAfter !== undefined) {
      update.contractVersionAfter = updates.contractVersionAfter;
    }
  }

  // If status is terminal, set resolved timestamp
  if (["paid", "cancelled", "rejectedArtist"].includes(status)) {
    update.resolvedAt = new Date();
  }

  return ChangeTicket.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

// Find active change tickets for a contract
export async function findActiveChangeTickets(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IChangeTicket[]> {
  await connectDB();

  return ChangeTicket.find({
    contractId: toObjectId(contractId),
    resolvedAt: { $exists: false },
  }).session(session || null);
}

// RESOLUTION TICKET OPERATIONS
// ---------------------------

// Input interface for creating a resolution ticket
export interface CreateResolutionTicketInput {
  contractId: string | ObjectId;
  submittedBy: "client" | "artist";
  submittedById: string | ObjectId;
  targetType:
    | "cancelTicket" // CancelTicket
    | "revisionTicket" // RevisionTicket
    | "changeTicket" // ChangeTicket
    | "finalUpload" // FinalUpload
    | "progressMilestoneUpload" // ProgressUploadMilestone
    | "revisionUpload"; // RevisionUpload
  targetId: string | ObjectId;
  description: string;
  proofImages?: string[];
}

// Create a resolution ticket
export async function createResolutionTicket(
  input: CreateResolutionTicketInput,
  session?: ClientSession
): Promise<IResolutionTicket> {
  await connectDB();

  // Set the counterparty based on who submitted
  const counterparty = input.submittedBy === "client" ? "artist" : "client";

  // Set counter expiration for 24 hours from now
  const counterExpiresAt = new Date();
  counterExpiresAt.setHours(counterExpiresAt.getHours() + 24);

  const ticket = new ResolutionTicket({
    contractId: toObjectId(input.contractId),
    submittedBy: input.submittedBy,
    submittedById: toObjectId(input.submittedById),
    targetType: input.targetType,
    targetId: toObjectId(input.targetId),
    description: input.description,
    proofImages: input.proofImages || [],
    counterparty,
    counterExpiresAt,
    status: "open",
  });

  return ticket.save({ session });
}

// Get a resolution ticket by ID
export async function findResolutionTicketById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IResolutionTicket | null> {
  await connectDB();
  return ResolutionTicket.findById(toObjectId(id)).session(session || null);
}

// Find all resolution tickets (admin view)
export async function findAllResolutionTickets(
  filters?: {
    status?: string[];
    targetType?: string[];
  },
  session?: ClientSession
): Promise<IResolutionTicket[]> {
  await connectDB();

  const query: any = {};

  if (filters?.status && filters.status.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters?.targetType && filters.targetType.length > 0) {
    query.targetType = { $in: filters.targetType };
  }

  return ResolutionTicket.find(query)
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Find resolution tickets for a specific contract
export async function findResolutionTicketsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IResolutionTicket[]> {
  await connectDB();

  return ResolutionTicket.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Find resolution tickets submitted by or against a user
export async function findResolutionTicketsByUser(
  userId: string | ObjectId,
  role: "submitter" | "counterparty" | "both",
  session?: ClientSession
): Promise<IResolutionTicket[]> {
  await connectDB();

  const query: any = {};

  if (role === "submitter") {
    query.submittedById = toObjectId(userId);
  } else if (role === "counterparty") {
    query.counterparty = userId;
  } else if (role === "both") {
    query.$or = [
      { submittedById: toObjectId(userId) },
      { counterparty: userId },
    ];
  }

  return ResolutionTicket.find(query)
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Submit counterproof for a resolution ticket
export async function submitCounterproof(
  id: string | ObjectId,
  counterDescription: string,
  counterProofImages: string[],
  session?: ClientSession
): Promise<IResolutionTicket | null> {
  await connectDB();

  // Verify the ticket exists and is still open
  const ticket = await ResolutionTicket.findById(toObjectId(id)).session(
    session || null
  );
  if (!ticket || ticket.status !== "open") {
    return null;
  }

  // Verify the counterproof deadline hasn't passed
  if (ticket.counterExpiresAt < new Date()) {
    // If expired, update status to awaiting review automatically
    ticket.status = "awaitingReview";
    return ticket.save({ session });
  }

  // Add the counterproof and update status
  ticket.counterDescription = counterDescription;
  ticket.counterProofImages = counterProofImages;
  ticket.status = "awaitingReview";

  return ticket.save({ session });
}

// Resolve a ticket (admin)
export async function resolveTicket(
  id: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  resolutionNote: string,
  resolvedBy: string | ObjectId,
  session?: ClientSession
): Promise<IResolutionTicket | null> {
  await connectDB();

  const updates = {
    status: "resolved",
    decision,
    resolutionNote,
    resolvedBy: toObjectId(resolvedBy),
    resolvedAt: new Date(),
  };

  return ResolutionTicket.findByIdAndUpdate(toObjectId(id), updates, {
    new: true,
    session,
  });
}

// Cancel a resolution ticket if the underlying issue is resolved
export async function cancelResolutionTicket(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IResolutionTicket | null> {
  await connectDB();

  return ResolutionTicket.findByIdAndUpdate(
    toObjectId(id),
    { status: "cancelled" },
    { new: true, session }
  );
}

// Add this function to your existing ticket repository file

/**
 * Find active cancel tickets for a contract
 * Active tickets have status 'accepted' or 'forcedAccepted'
 */
export async function findActiveCancelTickets(
  contractId: string | ObjectId
): Promise<ICancelTicket[]> {
  await connectDB();

  // Find cancel tickets with status accepted or forcedAccepted
  const tickets = await CancelTicket.find({
    contractId: toObjectId(contractId),
    status: { $in: ["accepted", "forcedAccepted"] },
  }).sort({ createdAt: -1 });

  return tickets;
}

/**
 * Find all cancel tickets for a contract
 */
export async function findCancelTicketsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<ICancelTicket[]> {
  await connectDB();

  return CancelTicket.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

/**
 * Find all change tickets for a contract
 */
export async function findChangeTicketsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IChangeTicket[]> {
  await connectDB();

  return ChangeTicket.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

/**
 * Find all revision tickets for a contract
 */
export async function findRevisionTicketsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionTicket[]> {
  await connectDB();

  return RevisionTicket.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}
