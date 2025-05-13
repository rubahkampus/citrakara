// src/lib/db/repositories/upload.repository.ts
import { connectDB } from "@/lib/db/connection";
import {
  ProgressUploadStandard,
  ProgressUploadMilestone,
  RevisionUpload,
  FinalUpload,
  IProgressUploadStandard,
  IProgressUploadMilestone,
  IRevisionUpload,
  IFinalUpload,
} from "@/lib/db/models/upload.model";
import { ClientSession } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";
import { toObjectId } from "@/lib/utils/toObjectId";

// PROGRESS UPLOAD STANDARD OPERATIONS
// ----------------------------------

// Input for creating a standard progress upload
export interface CreateProgressUploadStandardInput {
  contractId: string | ObjectId;
  artistId: string | ObjectId;
  images: string[];
  description?: string;
}

// Create a standard progress upload
export async function createProgressUploadStandard(
  input: CreateProgressUploadStandardInput,
  session?: ClientSession
): Promise<IProgressUploadStandard> {
  await connectDB();

  const upload = new ProgressUploadStandard({
    kind: "progressStandard",
    contractId: toObjectId(input.contractId),
    artistId: toObjectId(input.artistId),
    images: input.images,
    description: input.description || "",
  });

  return upload.save({ session });
}

// Find a standard progress upload by ID
export async function findProgressUploadStandardById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IProgressUploadStandard | null> {
  await connectDB();
  return ProgressUploadStandard.findById(toObjectId(id)).session(
    session || null
  );
}

// Find all standard progress uploads for a contract
export async function findProgressUploadStandardByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IProgressUploadStandard[]> {
  await connectDB();

  return ProgressUploadStandard.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// PROGRESS UPLOAD MILESTONE OPERATIONS
// -----------------------------------

// Input for creating a milestone progress upload
export interface CreateProgressUploadMilestoneInput {
  contractId: string | ObjectId;
  milestoneIdx: number;
  artistId: string | ObjectId;
  isFinal: boolean;
  images: string[];
  description?: string;
}

// Create a milestone progress upload
export async function createProgressUploadMilestone(
  input: CreateProgressUploadMilestoneInput,
  session?: ClientSession
): Promise<IProgressUploadMilestone> {
  await connectDB();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (input.isFinal ? 24 : 999));

  const upload = new ProgressUploadMilestone({
    kind: "progressMilestone",
    contractId: toObjectId(input.contractId),
    milestoneIdx: input.milestoneIdx,
    artistId: toObjectId(input.artistId),
    isFinal: input.isFinal,
    images: input.images,
    description: input.description || "",
    expiresAt,
  });

  // If it's a final milestone upload, add status and expiration
  if (input.isFinal) {
    upload.status = "submitted";

    // Set expiration date to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    upload.expiresAt = expiresAt;
  }

  return upload.save({ session });
}

// Find a milestone progress upload by ID
export async function findProgressUploadMilestoneById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IProgressUploadMilestone | null> {
  await connectDB();
  return ProgressUploadMilestone.findById(toObjectId(id)).session(
    session || null
  );
}

// Find all milestone progress uploads for a contract
export async function findProgressUploadMilestoneByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IProgressUploadMilestone[]> {
  await connectDB();

  return ProgressUploadMilestone.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Find milestone progress uploads for a specific milestone
export async function findProgressUploadMilestoneByMilestone(
  contractId: string | ObjectId,
  milestoneIdx: number,
  session?: ClientSession
): Promise<IProgressUploadMilestone[]> {
  await connectDB();

  return ProgressUploadMilestone.find({
    contractId: toObjectId(contractId),
    milestoneIdx,
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Update milestone upload status
export async function updateMilestoneUploadStatus(
  id: string | ObjectId,
  status: IProgressUploadMilestone["status"],
  session?: ClientSession
): Promise<IProgressUploadMilestone | null> {
  await connectDB();

  const update: any = { status };

  // If accepted, rejected, or forced accepted, set closed timestamp
  if (["accepted", "rejected", "forcedAccepted"].includes(status || "")) {
    update.closedAt = new Date();
  }

  return ProgressUploadMilestone.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

// REVISION UPLOAD OPERATIONS
// -------------------------

// Input for creating a revision upload
export interface CreateRevisionUploadInput {
  revisionTicketId: string | ObjectId;
  contractId: string | ObjectId;
  artistId: string | ObjectId;
  images: string[];
  description?: string;
}

// Create a revision upload
export async function createRevisionUpload(
  input: CreateRevisionUploadInput,
  session?: ClientSession
): Promise<IRevisionUpload> {
  await connectDB();

  // Set expiration date to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const upload = new RevisionUpload({
    contractId: toObjectId(input.contractId),
    revisionTicketId: toObjectId(input.revisionTicketId),
    artistId: toObjectId(input.artistId),
    images: input.images,
    description: input.description || "",
    status: "submitted",
    expiresAt,
  });

  return upload.save({ session });
}

// Find a revision upload by ID
export async function findRevisionUploadById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionUpload | null> {
  await connectDB();
  return RevisionUpload.findById(toObjectId(id)).session(session || null);
}

// Find revision uploads for a specific ticket
export async function findRevisionUploadsByTicket(
  revisionTicketId: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionUpload[]> {
  await connectDB();

  return RevisionUpload.find({
    revisionTicketId: toObjectId(revisionTicketId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Update revision upload status
export async function updateRevisionUploadStatus(
  id: string | ObjectId,
  status: IRevisionUpload["status"],
  session?: ClientSession
): Promise<IRevisionUpload | null> {
  await connectDB();

  const update: any = { status };

  // If accepted, rejected, or forced accepted, set resolved timestamp
  if (["accepted", "rejected", "forcedAccepted"].includes(status)) {
    update.resolvedAt = new Date();
  }

  return RevisionUpload.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

// FINAL UPLOAD OPERATIONS
// ----------------------

// Input for creating a final upload
export interface CreateFinalUploadInput {
  contractId: string | ObjectId;
  images: string[];
  description?: string;
  workProgress: number;
  cancelTicketId?: string | ObjectId;
}

// Create a final upload
export async function createFinalUpload(
  input: CreateFinalUploadInput,
  session?: ClientSession
): Promise<IFinalUpload> {
  await connectDB();

  // Set expiration date to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const upload = new FinalUpload({
    kind: "final",
    contractId: toObjectId(input.contractId),
    images: input.images,
    description: input.description || "",
    status: "submitted",
    workProgress: input.workProgress,
    expiresAt,
  });

  // Add cancel ticket ID if provided
  if (input.cancelTicketId) {
    upload.cancelTicketId = toObjectId(input.cancelTicketId);
  }

  return upload.save({ session });
}

// Find a final upload by ID
export async function findFinalUploadById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IFinalUpload | null> {
  await connectDB();
  return FinalUpload.findById(toObjectId(id)).session(session || null);
}

// Find all final uploads for a contract
export async function findFinalUploadsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IFinalUpload[]> {
  await connectDB();

  return FinalUpload.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Update final upload status
export async function updateFinalUploadStatus(
  id: string | ObjectId,
  status: IFinalUpload["status"],
  session?: ClientSession
): Promise<IFinalUpload | null> {
  await connectDB();

  const update: any = { status };

  // If accepted, rejected, or forced accepted, set closed timestamp
  if (["accepted", "rejected", "forcedAccepted"].includes(status)) {
    update.closedAt = new Date();
  }

  return FinalUpload.findByIdAndUpdate(toObjectId(id), update, {
    new: true,
    session,
  });
}

/**
 * Check if a revision ticket has any accepted uploads
 */
export async function hasAcceptedRevisionUpload(
  revisionTicketId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const count = await RevisionUpload.countDocuments({
    revisionTicketId: toObjectId(revisionTicketId),
    status: { $in: ["accepted", "forcedAccepted"] },
  }).session(session || null);

  return count > 0;
}

/**
 * Check if there are any active final uploads for a contract
 */
export async function hasActiveContractFinalUploads(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const count = await FinalUpload.countDocuments({
    contractId: toObjectId(contractId),
    status: "submitted",
  }).session(session || null);

  return count > 0;
}

/**
 * Check if a cancellation has a corresponding final upload
 */
export async function hasCancellationFinalUpload(
  contractId: string | ObjectId,
  cancelTicketId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const count = await FinalUpload.countDocuments({
    contractId: toObjectId(contractId),
    cancelTicketId: toObjectId(cancelTicketId),
    status: { $in: ["submitted", "accepted", "forcedAccepted"] },
  }).session(session || null);

  return count > 0;
}

/**
 * Check if there are any active final milestone uploads for a contract or specific milestone
 */
export async function hasActiveFinalMilestoneUploads(
  contractId: string | ObjectId,
  milestoneIdx?: number,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const query: any = {
    contractId: toObjectId(contractId),
    isFinal: true,
    status: "submitted",
  };

  if (milestoneIdx !== undefined) {
    query.milestoneIdx = milestoneIdx;
  }

  const count = await ProgressUploadMilestone.countDocuments(query).session(
    session || null
  );

  return count > 0;
}

/**
 * Find all revision uploads for a contract
 */
export async function findRevisionUploadsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IRevisionUpload[]> {
  await connectDB();

  return RevisionUpload.find({
    contractId: toObjectId(contractId),
  })
    .sort({ createdAt: -1 })
    .session(session || null);
}
