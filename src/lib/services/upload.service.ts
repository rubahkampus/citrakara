// src/lib/services/upload.service.ts
import { ClientSession, startSession } from "mongoose";
import type { ObjectId } from "@/types/common";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import * as contractRepo from "@/lib/db/repositories/contract.repository";
import * as contractService from "./contract.service";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import { HttpError } from "./commissionListing.service";
import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";
import {
  IFinalUpload,
  IProgressUploadMilestone,
  IRevisionUpload,
  ProgressUploadMilestone,
} from "../db/models/upload.model";
import { connectDB } from "../db/connection";
import { isUserAdminById } from "./user.service";
import {
  getUnresolvedResolutionTickets,
  getUnfinishedRevisionTickets,
} from "./ticket.service";
import { toObjectId } from "../utils/toObjectId";

//=============================================================================
// CREATE UPLOAD FUNCTIONS WITH BACKEND VALIDATIONS
//=============================================================================

/**
 * Create a standard progress upload using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the upload (must be artist)
 * @param form - FormData containing images, description, etc.
 * @returns The created upload object
 * @throws HttpError if validation fails or user doesn't have permission
 */
export async function createProgressUploadStandard(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify user is the artist
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.artistId.toString() !== userId) {
      throw new HttpError("Only the artist can upload progress", 403);
    }

    // Verify contract is active and has standard flow
    if (contract.status !== "active") {
      throw new HttpError("Contract must be active to upload progress", 400);
    }

    if (contract.proposalSnapshot.listingSnapshot.flow !== "standard") {
      throw new HttpError(
        "This upload type is only for standard flow contracts",
        400
      );
    }

    // Backend validation: Check for blocking conditions
    await validateProgressUploadConditions(contractId, session);

    // Get image blobs from form data
    const imageBlobs = form
      .getAll("images[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Validate images
    if (!imageBlobs || imageBlobs.length === 0) {
      throw new HttpError("At least one image is required", 400);
    }

    // Upload images
    const imageUrls = await uploadGalleryImagesToR2(
      imageBlobs,
      userId,
      contractId.toString()
    );

    // Get description from form data
    const description = form.get("description")?.toString();

    // Create progress upload
    const upload = await uploadRepo.createProgressUploadStandard(
      {
        contractId,
        artistId: userId,
        images: imageUrls,
        description,
      },
      session
    );

    // Link upload to contract
    await contractService.addUploadToContract(
      contractId,
      "progressStandard",
      upload._id,
      session
    );

    await session.commitTransaction();
    return upload;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Create a milestone progress upload using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the upload (must be artist)
 * @param form - FormData containing images, description, milestoneIdx, isFinal
 * @returns The created upload object
 * @throws HttpError if validation fails or user doesn't have permission
 */
export async function createProgressUploadMilestone(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify user is the artist
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.artistId.toString() !== userId) {
      throw new HttpError("Only the artist can upload progress", 403);
    }

    // Verify contract is active and has milestone flow
    if (contract.status !== "active") {
      throw new HttpError("Contract must be active to upload progress", 400);
    }

    if (contract.proposalSnapshot.listingSnapshot.flow !== "milestone") {
      throw new HttpError(
        "This upload type is only for milestone flow contracts",
        400
      );
    }

    // Get milestone index and isFinal from form data
    const milestoneIdx = Number(form.get("milestoneIdx"));
    if (isNaN(milestoneIdx)) {
      throw new HttpError("Valid milestone index is required", 400);
    }

    const isFinal = form.get("isFinal") === "true";

    // Verify milestone exists and is in progress
    if (!contract.milestones || !contract.milestones[milestoneIdx]) {
      throw new HttpError("Milestone not found", 404);
    }

    const milestone = contract.milestones[milestoneIdx];
    if (milestone.status !== "inProgress") {
      throw new HttpError(
        "Can only upload progress for a milestone in progress",
        400
      );
    }

    // Backend validation: Check for blocking conditions specific to milestone uploads
    await validateMilestoneUploadConditions(
      contractId,
      milestoneIdx,
      isFinal,
      session
    );

    // Get image blobs from form data
    const imageBlobs = form
      .getAll("images[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Validate images
    if (!imageBlobs || imageBlobs.length === 0) {
      throw new HttpError("At least one image is required", 400);
    }

    // Upload images
    const imageUrls = await uploadGalleryImagesToR2(
      imageBlobs,
      userId,
      contractId.toString()
    );

    // Get description from form data
    const description = form.get("description")?.toString();

    // Create milestone upload
    const upload = await uploadRepo.createProgressUploadMilestone(
      {
        contractId,
        milestoneIdx,
        artistId: userId,
        isFinal,
        images: imageUrls,
        description,
      },
      session
    );

    // Link upload to contract
    await contractService.addUploadToContract(
      contractId,
      "progressMilestone",
      upload._id,
      session
    );

    // If this is a final milestone upload, update milestone status
    if (isFinal) {
      await contractService.updateMilestoneStatus(
        contractId,
        milestoneIdx,
        "submitted",
        undefined,
        session
      );
    }

    await session.commitTransaction();
    return upload;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Create a revision upload using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the upload (must be artist)
 * @param form - FormData containing images, description, revisionTicketId
 * @returns The created upload object
 * @throws HttpError if validation fails or user doesn't have permission
 */
export async function createRevisionUpload(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify user is the artist
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.artistId.toString() !== userId) {
      throw new HttpError("Only the artist can upload revisions", 403);
    }

    // Get revision ticket ID from form data
    const revisionTicketId = form.get("revisionTicketId")?.toString();
    if (!revisionTicketId) {
      throw new HttpError("Revision ticket ID is required", 400);
    }

    // Verify ticket exists and is in paid or accepted status
    const ticket = await ticketRepo.findRevisionTicketById(
      revisionTicketId,
      session
    );
    if (!ticket) {
      throw new HttpError("Revision ticket not found", 404);
    }

    if (
      ticket.status !== "accepted" &&
      ticket.status !== "paid" &&
      ticket.status !== "forcedAcceptedArtist"
    ) {
      throw new HttpError(
        "Revision ticket must be accepted or paid to upload revision",
        400
      );
    }

    // Backend validation: Check for blocking conditions specific to revision uploads
    await validateRevisionUploadConditions(
      contractId,
      revisionTicketId,
      session
    );

    // Get image blobs from form data
    const imageBlobs = form
      .getAll("images[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Validate images
    if (!imageBlobs || imageBlobs.length === 0) {
      throw new HttpError("At least one image is required", 400);
    }

    // Upload images
    const imageUrls = await uploadGalleryImagesToR2(
      imageBlobs,
      userId,
      contractId.toString()
    );

    // Get description from form data
    const description = form.get("description")?.toString();

    // Create revision upload
    const upload = await uploadRepo.createRevisionUpload(
      {
        contractId,
        revisionTicketId,
        artistId: userId,
        images: imageUrls,
        description,
      },
      session
    );

    // Link upload to contract
    await contractService.addUploadToContract(
      contractId,
      "revision",
      upload._id,
      session
    );

    await session.commitTransaction();
    return upload;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Create a final upload using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the upload (must be artist)
 * @param form - FormData containing images, description, workProgress, optional cancelTicketId
 * @returns The created upload object
 * @throws HttpError if validation fails or user doesn't have permission
 */
export async function createFinalUpload(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify user is the artist
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.artistId.toString() !== userId) {
      throw new HttpError("Only the artist can upload final deliverables", 403);
    }

    // Verify contract is active
    if (contract.status !== "active") {
      throw new HttpError(
        "Contract must be active to upload final deliverable",
        400
      );
    }

    // Get work progress and cancel ticket ID from form data
    const workProgress = Number(form.get("workProgress") ?? 100);
    const cancelTicketId = form.get("cancelTicketId")?.toString();

    // If this is related to a cancel ticket, verify it exists and is accepted
    if (cancelTicketId) {
      const ticket = await ticketRepo.findCancelTicketById(
        cancelTicketId,
        session
      );
      if (!ticket) {
        throw new HttpError("Cancel ticket not found", 404);
      }

      if (ticket.status !== "accepted" && ticket.status !== "forcedAccepted") {
        throw new HttpError(
          "Cancel ticket must be accepted to upload final proof",
          400
        );
      }

      // For cancellations, workProgress must be less than 100
      if (workProgress >= 100) {
        throw new HttpError(
          "Work progress for cancellation must be less than 100%",
          400
        );
      }
    } else {
      // For normal completion, workProgress must be 100
      if (workProgress < 100) {
        throw new HttpError(
          "Work progress for final delivery must be 100%",
          400
        );
      }
    }

    // Backend validation: Check for blocking conditions specific to final uploads
    await validateFinalUploadConditions(contractId, cancelTicketId, session);

    // Get image blobs from form data
    const imageBlobs = form
      .getAll("images[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Validate images
    if (!imageBlobs || imageBlobs.length === 0) {
      throw new HttpError("At least one image is required", 400);
    }

    // Upload images
    const imageUrls = await uploadGalleryImagesToR2(
      imageBlobs,
      userId,
      contractId.toString()
    );

    // Get description from form data
    const description = form.get("description")?.toString();

    // Create final upload
    const upload = await uploadRepo.createFinalUpload(
      {
        contractId,
        images: imageUrls,
        workProgress,
        cancelTicketId,
        description,
      },
      session
    );

    // Link upload to contract
    await contractService.addUploadToContract(
      contractId,
      "final",
      upload._id,
      session
    );

    // Update contract workPercentage
    await contractRepo.updateContractStatus(
      contractId,
      contract.status,
      workProgress,
      session
    );

    await session.commitTransaction();
    return upload;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

//=============================================================================
// BACKEND VALIDATION FUNCTIONS
//=============================================================================

/**
 * Validate conditions for progress uploads (standard flow)
 *
 * @param contractId - ID of the contract
 * @param session - Database session
 * @throws HttpError if validation fails
 */
async function validateProgressUploadConditions(
  contractId: string | ObjectId,
  session: ClientSession
): Promise<void> {
  // Check for unresolved resolution tickets (blocking)
  const unresolvedResolutionTickets = await getUnresolvedResolutionTickets(
    contractId
  );
  if (unresolvedResolutionTickets.length > 0) {
    throw new HttpError(
      "Cannot create progress upload while there are active resolution tickets. Please wait for resolution before uploading.",
      400
    );
  }

  // Note: Progress uploads have minimal restrictions, so no additional blocking validations needed
}

/**
 * Validate conditions for milestone uploads
 *
 * @param contractId - ID of the contract
 * @param milestoneIdx - Index of the milestone
 * @param isFinal - Whether this is a final milestone upload
 * @param session - Database session
 * @throws HttpError if validation fails
 */
async function validateMilestoneUploadConditions(
  contractId: string | ObjectId,
  milestoneIdx: number,
  isFinal: boolean,
  session: ClientSession
): Promise<void> {
  // Check for unresolved resolution tickets (blocking)
  const unresolvedResolutionTickets = await getUnresolvedResolutionTickets(
    contractId
  );
  if (unresolvedResolutionTickets.length > 0) {
    throw new HttpError(
      "Cannot create milestone upload while there are active resolution tickets. Please wait for resolution before uploading.",
      400
    );
  }

  // If this is a final milestone upload, check for existing active final uploads for this milestone
  if (isFinal) {
    const activeMilestoneUploads = await getUnfinishedFinalMilestoneUploads(
      contractId,
      milestoneIdx
    );
    if (activeMilestoneUploads.length > 0) {
      throw new HttpError(
        "There is already an active final milestone upload for this milestone. Please wait for client review before submitting a new one.",
        400
      );
    }

    // Check for unfinished revision tickets that block final submission
    const unfinishedRevisionTickets = await getUnfinishedRevisionTickets(
      contractId
    );
    if (unfinishedRevisionTickets.length > 0) {
      throw new HttpError(
        "You have unfinished revision tickets that require uploads. Please complete all revisions before submitting final milestone work.",
        400
      );
    }
  }
}

/**
 * Validate conditions for revision uploads
 *
 * @param contractId - ID of the contract
 * @param revisionTicketId - ID of the revision ticket
 * @param session - Database session
 * @throws HttpError if validation fails
 */
async function validateRevisionUploadConditions(
  contractId: string | ObjectId,
  revisionTicketId: string,
  session: ClientSession
): Promise<void> {
  // Check for unresolved resolution tickets (blocking)
  const unresolvedResolutionTickets = await getUnresolvedResolutionTickets(
    contractId
  );
  if (unresolvedResolutionTickets.length > 0) {
    throw new HttpError(
      "Cannot create revision upload while there are active resolution tickets. Please wait for resolution before uploading.",
      400
    );
  }

  // Check if there's already an active revision upload for this specific ticket
  const unfinishedRevisionUploads = await getUnfinishedRevisionUploads(
    contractId
  );
  const activeTicketUploads = unfinishedRevisionUploads.filter(
    (upload) => upload.revisionTicketId.toString() === revisionTicketId
  );

  if (activeTicketUploads.length > 0) {
    throw new HttpError(
      "There is already an active revision upload for this ticket. Please wait for client review before submitting a new one.",
      400
    );
  }
}

/**
 * Validate conditions for final uploads
 *
 * @param contractId - ID of the contract
 * @param cancelTicketId - Optional cancel ticket ID (for cancellation uploads)
 * @param session - Database session
 * @throws HttpError if validation fails
 */
async function validateFinalUploadConditions(
  contractId: string | ObjectId,
  cancelTicketId: string | undefined,
  session: ClientSession
): Promise<void> {
  // Check for unresolved resolution tickets (blocking)
  const unresolvedResolutionTickets = await getUnresolvedResolutionTickets(
    contractId
  );
  if (unresolvedResolutionTickets.length > 0) {
    throw new HttpError(
      "Cannot create final upload while there are active resolution tickets. Please wait for resolution before uploading.",
      400
    );
  }

  // Check if there's already an active final upload
  const unfinishedFinalUploads = await getUnfinishedFinalUploads(contractId);
  if (unfinishedFinalUploads.length > 0) {
    throw new HttpError(
      "There is already an active final upload. Please wait for client review before submitting a new one.",
      400
    );
  }

  // Get the contract to check flow and milestones
  const contract = await contractRepo.findContractById(contractId, { session });
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  if (!cancelTicketId) {
    // For regular final delivery (not cancellation)

    // 1. Check if all milestones are completed for milestone contracts
    if (
      contract.proposalSnapshot.listingSnapshot.flow === "milestone" &&
      contract.milestones
    ) {
      const incompleteMilestones = contract.milestones.filter(
        (milestone: any) => milestone.status !== "accepted"
      );

      if (incompleteMilestones.length > 0) {
        throw new HttpError(
          "All milestones must be completed before submitting final delivery.",
          400
        );
      }
    }

    // 2. Check if all revisions are completed
    const unfinishedRevisionTickets = await getUnfinishedRevisionTickets(
      contractId
    );
    if (unfinishedRevisionTickets.length > 0) {
      throw new HttpError(
        "You must complete all revision requests before submitting final delivery.",
        400
      );
    }
  }
  // Note: For cancellation uploads (when cancelTicketId exists), we allow uploads even with pending revisions
  // as mentioned in the frontend logic comments
}

//=============================================================================
// GET UPLOAD FUNCTIONS
//=============================================================================

/**
 * Get an upload based on its type and ID, with permission checks
 *
 * @param uploadType - The type of upload (milestone, revision, or final)
 * @param uploadId - The ID of the upload
 * @param contractId - The ID of the contract the upload should belong to
 * @param userId - The ID of the requesting user
 * @returns The upload if found and user has access
 * @throws HttpError if upload not found or user doesn't have permission
 */
export async function getUpload(
  uploadType: "milestone" | "revision" | "final",
  uploadId: string | ObjectId,
  contractId: string | ObjectId,
  userId: string
): Promise<any> {
  await connectDB();

  try {
    // Verify contract exists and user has access
    const contract = await contractRepo.findContractById(contractId);
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Check if user has permission to view this contract
    const isClient = contract.clientId.toString() === userId;
    const isArtist = contract.artistId.toString() === userId;
    const isAdmin = await isUserAdminById(userId);

    if (!isClient && !isArtist && !isAdmin) {
      throw new HttpError("You don't have permission to view this upload", 403);
    }

    // Get the upload based on type
    let upload;
    switch (uploadType) {
      case "milestone":
        upload = await uploadRepo.findProgressUploadMilestoneById(uploadId);
        break;
      case "revision":
        upload = await uploadRepo.findRevisionUploadById(uploadId);
        break;
      case "final":
        upload = await uploadRepo.findFinalUploadById(uploadId);
        break;
    }

    if (!upload) {
      throw new HttpError("Upload not found", 404);
    }

    // Verify the upload belongs to the specified contract
    const uploadContractId = upload.contractId.toString();
    if (uploadContractId !== contractId.toString()) {
      throw new HttpError(
        "Upload does not belong to the specified contract",
        400
      );
    }

    return upload;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all uploads for a contract (grouped by type)
 *
 * @param contractId - ID of the contract
 * @returns Object containing arrays of different upload types
 */
export async function getContractUploads(
  contractId: string | ObjectId
): Promise<{
  progressStandard: any[];
  progressMilestone: any[];
  revision: any[];
  final: any[];
}> {
  const [progressStandard, progressMilestone, finalUploads] = await Promise.all(
    [
      uploadRepo.findProgressUploadStandardByContract(contractId),
      uploadRepo.findProgressUploadMilestoneByContract(contractId),
      uploadRepo.findFinalUploadsByContract(contractId),
    ]
  );

  // For revision uploads, we need the contract to get the tickets
  const contract = await contractRepo.findContractById(contractId, {
    populate: ["revisionTickets"],
  });

  // Get all revision tickets and their uploads
  const revisionUploads = [];
  if (
    contract &&
    contract.revisionTickets &&
    contract.revisionTickets.length > 0
  ) {
    for (const ticketId of contract.revisionTickets) {
      const uploads = await uploadRepo.findRevisionUploadsByTicket(
        ticketId._id
      );
      revisionUploads.push(...uploads);
    }
  }

  return {
    progressStandard,
    progressMilestone,
    revision: revisionUploads,
    final: finalUploads,
  };
}

/**
 * Get uploads for a specific milestone
 *
 * @param contractId - ID of the contract
 * @param milestoneIdx - Index of the milestone
 * @returns Array of milestone uploads
 */
export async function getMilestoneUploads(
  contractId: string | ObjectId,
  milestoneIdx: number
): Promise<any[]> {
  return uploadRepo.findProgressUploadMilestoneByMilestone(
    contractId,
    milestoneIdx
  );
}

/**
 * Get revision uploads for a specific ticket
 *
 * @param revisionTicketId - ID of the revision ticket
 * @returns Array of revision uploads for the ticket
 */
export async function getRevisionUploads(
  revisionTicketId: string | ObjectId
): Promise<any[]> {
  return uploadRepo.findRevisionUploadsByTicket(revisionTicketId);
}

//=============================================================================
// UPLOAD REVIEW FUNCTIONS
//=============================================================================

/**
 * Review an upload (milestone, revision, or final)
 *
 * @param uploadType - The type of upload (milestone, revision, or final)
 * @param uploadId - The ID of the upload
 * @param contractId - The ID of the contract the upload belongs to
 * @param userId - The ID of the reviewing user (must be client)
 * @param action - Accept or reject the upload
 * @returns Object containing the updated upload and action taken
 * @throws HttpError if upload not found or user doesn't have permission
 */
export async function reviewUpload(
  uploadType: "milestone" | "revision" | "final",
  uploadId: string | ObjectId,
  contractId: string | ObjectId,
  userId: string,
  action: "accept" | "reject"
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify user is the client
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.clientId.toString() !== userId) {
      throw new HttpError("Only the client can review uploads", 403);
    }

    // Get the upload based on type
    let upload;
    switch (uploadType) {
      case "milestone":
        upload = await uploadRepo.findProgressUploadMilestoneById(
          uploadId,
          session
        );
        break;
      case "revision":
        upload = await uploadRepo.findRevisionUploadById(uploadId, session);
        break;
      case "final":
        upload = await uploadRepo.findFinalUploadById(uploadId, session);
        break;
    }

    if (!upload) {
      throw new HttpError("Upload not found", 404);
    }

    // Verify upload is in submitted status
    if (upload.status !== "submitted") {
      throw new HttpError(
        "Upload must be in submitted status to be reviewed",
        400
      );
    }

    // Update status based on action
    const newStatus = action === "accept" ? "accepted" : "rejected";

    switch (uploadType) {
      case "milestone":
        await uploadRepo.updateMilestoneUploadStatus(
          uploadId,
          newStatus,
          session
        );

        // If accepted, update milestone status
        if (action === "accept") {
          await contractService.updateMilestoneStatus(
            contractId,
            (upload as IProgressUploadMilestone).milestoneIdx,
            "accepted",
            uploadId,
            session
          );
        } else {
          await contractService.updateMilestoneStatus(
            contractId,
            (upload as IProgressUploadMilestone).milestoneIdx,
            "inProgress",
            undefined,
            session
          );
        }
        break;

      case "revision":
        await uploadRepo.updateRevisionUploadStatus(
          uploadId,
          newStatus,
          session
        );

        // If accepted, mark the revision ticket as resolved
        if (action === "accept") {
          const ticket = await ticketRepo.findRevisionTicketById(
            (upload as IRevisionUpload).revisionTicketId
          );
          if (ticket && !ticket.resolved) {
            await ticketRepo.updateRevisionTicketStatus(
              (upload as IRevisionUpload).revisionTicketId,
              ticket.status, // Keep current status
              undefined,
              undefined,
              undefined,
              session
            );
          }
        }
        break;

      case "final":
        await uploadRepo.updateFinalUploadStatus(uploadId, newStatus, session);

        // If accepted, process contract completion or cancellation
        if (action === "accept") {
          if ((upload as IFinalUpload).workProgress === 100) {
            // Process completion
            await contractService.processContractCompletion(
              contractId,
              contractService.isContractLate(contract),
              session
            );
          } else if ((upload as IFinalUpload).cancelTicketId) {
            // Process cancellation
            const cancelTicketId = (upload as IFinalUpload).cancelTicketId;
            if (!cancelTicketId) {
              throw new HttpError("Cancel ticket ID is undefined", 400);
            }
            const ticket = await ticketRepo.findCancelTicketById(
              cancelTicketId,
              session
            );
            if (ticket) {
              const by = ticket.requestedBy;
              await contractService.processContractCancellation(
                contractId,
                by,
                (upload as IFinalUpload).workProgress,
                contractService.isContractLate(contract),
                session
              );
            }
          }
        }
        break;
    }

    await session.commitTransaction();
    return { upload, action };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Check if an upload is past its review deadline
 *
 * @param upload - The upload object to check
 * @returns True if the upload is past its review deadline
 */
export function isUploadPastDeadline(upload: any): boolean {
  return upload.expiresAt && new Date(upload.expiresAt) < new Date();
}

/**
 * Auto-accept an upload that is past its review deadline
 *
 * @param uploadType - The type of upload (milestone, revision, or final)
 * @param uploadId - The ID of the upload
 * @param contractId - The ID of the contract the upload belongs to
 * @returns Result of the auto-acceptance process
 * @throws HttpError if upload not found or not eligible for auto-acceptance
 */
export async function autoAcceptExpiredUpload(
  uploadType: "milestone" | "revision" | "final",
  uploadId: string | ObjectId,
  contractId: string | ObjectId
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the upload based on type
    let upload;
    switch (uploadType) {
      case "milestone":
        upload = await uploadRepo.findProgressUploadMilestoneById(
          uploadId,
          session
        );
        break;
      case "revision":
        upload = await uploadRepo.findRevisionUploadById(uploadId, session);
        break;
      case "final":
        upload = await uploadRepo.findFinalUploadById(uploadId, session);
        break;
    }

    if (!upload) {
      throw new HttpError("Upload not found", 404);
    }

    // Verify upload is in submitted status and past deadline
    if (upload.status !== "submitted") {
      throw new HttpError(
        "Upload must be in submitted status to be auto-accepted",
        400
      );
    }

    if (!isUploadPastDeadline(upload)) {
      throw new HttpError("Upload is not past its review deadline", 400);
    }

    // Auto-accept the upload (same logic as reviewUpload with accept action)
    return reviewUpload(
      uploadType,
      uploadId,
      contractId,
      "auto-accept", // Special user ID for system
      "accept"
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

//=============================================================================
// UNFINISHED UPLOAD UTILITY FUNCTIONS
//=============================================================================

/**
 * Find unfinished revision uploads
 *
 * @param contractId - Contract ID to check
 * @returns Array of unfinished revision uploads
 */
export async function getUnfinishedRevisionUploads(
  contractId: string | ObjectId
): Promise<IRevisionUpload[]> {
  await connectDB();

  const currentTime = new Date();
  const revisionUploads = await uploadRepo.findRevisionUploadsByContract(
    contractId
  );

  // Filter for uploads in submitted or disputed status that haven't expired
  return revisionUploads.filter(
    (upload) =>
      (upload.status === "submitted" || upload.status === "disputed") &&
      (!upload.expiresAt || upload.expiresAt > currentTime)
  );
}

/**
 * Find unfinished final uploads
 *
 * @param contractId - Contract ID to check
 * @returns Array of unfinished final uploads
 */
export async function getUnfinishedFinalUploads(
  contractId: string | ObjectId
): Promise<IFinalUpload[]> {
  await connectDB();

  const currentTime = new Date();
  const finalUploads = await uploadRepo.findFinalUploadsByContract(contractId);

  // Filter for uploads in submitted or disputed status that haven't expired
  return finalUploads.filter(
    (upload) =>
      (upload.status === "submitted" || upload.status === "disputed") &&
      (!upload.expiresAt || upload.expiresAt > currentTime)
  );
}

/**
 * Find unfinished final milestone uploads
 *
 * @param contractId - Contract ID to check
 * @param milestoneIdx - Optional milestone index to check specifically
 * @returns Array of unfinished final milestone uploads
 */
export async function getUnfinishedFinalMilestoneUploads(
  contractId: string | ObjectId,
  milestoneIdx?: number
): Promise<IProgressUploadMilestone[]> {
  await connectDB();

  const currentTime = new Date();
  const uploads = await uploadRepo.findProgressUploadMilestoneByContract(
    contractId
  );

  // Filter for final milestone uploads that are in submitted or disputed status and haven't expired
  return uploads.filter(
    (upload) =>
      upload.isFinal &&
      (upload.status === "submitted" || upload.status === "disputed") &&
      (!upload.expiresAt || upload.expiresAt > currentTime) &&
      (milestoneIdx === undefined || upload.milestoneIdx === milestoneIdx)
  );
}

/**
 * Check if there are unfinished revision uploads
 *
 * @param contractId - Contract ID to check
 * @returns True if there are unfinished revision uploads
 */
export async function hasUnfinishedRevisionUpload(
  contractId: string | ObjectId
): Promise<boolean> {
  const uploads = await getUnfinishedRevisionUploads(contractId);
  return uploads.length > 0;
}

/**
 * Check if there are unfinished final uploads
 *
 * @param contractId - Contract ID to check
 * @returns True if there are unfinished final uploads
 */
export async function hasUnfinishedFinalUpload(
  contractId: string | ObjectId
): Promise<boolean> {
  const uploads = await getUnfinishedFinalUploads(contractId);
  return uploads.length > 0;
}

/**
 * Check if there are unfinished final milestone uploads
 *
 * @param contractId - Contract ID to check
 * @param milestoneIdx - Optional milestone index to check specifically
 * @returns True if there are unfinished final milestone uploads
 */
export async function hasUnfinishedFinalMilestoneUpload(
  contractId: string | ObjectId,
  milestoneIdx?: number
): Promise<boolean> {
  const uploads = await getUnfinishedFinalMilestoneUploads(
    contractId,
    milestoneIdx
  );
  return uploads.length > 0;
}

//=============================================================================
// HAS FINISHED UTILITY FUNCTIONS
//=============================================================================

/**
 * Check if a contract has a finished final upload (accepted or forcedAccepted)
 *
 * @param contractId - Contract ID to check
 * @param session - Optional MongoDB session for transaction
 * @returns True if there's an accepted final upload for the contract
 */
export async function hasFinishedContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const finalUploads = await uploadRepo.findFinalUploadsByContract(
    contractId,
    session
  );

  // Check if any final upload is accepted or forcedAccepted
  return finalUploads.some(
    (upload) =>
      upload.status === "accepted" || upload.status === "forcedAccepted"
  );
}

/**
 * Check if a milestone has a finished final milestone upload (accepted or forcedAccepted)
 *
 * @param contractId - Contract ID to check
 * @param milestoneIdx - Index of the milestone to check
 * @param session - Optional MongoDB session for transaction
 * @returns True if there's an accepted final milestone upload for the specified milestone
 */
export async function hasFinishedMilestone(
  contractId: string | ObjectId,
  milestoneIdx: number,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const milestoneUploads =
    await uploadRepo.findProgressUploadMilestoneByMilestone(
      contractId,
      milestoneIdx,
      session
    );

  // Check if any final milestone upload is accepted or forcedAccepted
  return milestoneUploads.some(
    (upload) =>
      upload.isFinal &&
      (upload.status === "accepted" || upload.status === "forcedAccepted")
  );
}

/**
 * Check if a cancellation has a finished final upload (accepted or forcedAccepted)
 *
 * @param contractId - Contract ID to check
 * @param cancelTicketId - ID of the cancel ticket to check
 * @param session - Optional MongoDB session for transaction
 * @returns True if there's an accepted final upload associated with the cancel ticket
 */
export async function hasFinishedCancellation(
  contractId: string | ObjectId,
  cancelTicketId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const finalUploads = await uploadRepo.findFinalUploadsByContract(
    contractId,
    session
  );

  // Check if any final upload is linked to the cancel ticket and is accepted/forcedAccepted
  return finalUploads.some(
    (upload) =>
      upload.cancelTicketId &&
      upload.cancelTicketId.toString() === cancelTicketId.toString() &&
      (upload.status === "accepted" || upload.status === "forcedAccepted")
  );
}

/**
 * Check if a revision has a finished revision upload (accepted or forcedAccepted)
 *
 * @param contractId - Contract ID to check
 * @param revisionTicketId - ID of the revision ticket to check
 * @param session - Optional MongoDB session for transaction
 * @returns True if there's an accepted revision upload for the specified revision ticket
 */
export async function hasFinishedRevision(
  contractId: string | ObjectId,
  revisionTicketId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const revisionUploads = await uploadRepo.findRevisionUploadsByTicket(
    revisionTicketId,
    session
  );

  // Check if any revision upload is accepted or forcedAccepted
  return revisionUploads.some(
    (upload) =>
      upload.status === "accepted" || upload.status === "forcedAccepted"
  );
}

/**
 * Check if all milestones in a contract have finished final milestone uploads
 *
 * @param contractId - Contract ID to check
 * @param session - Optional MongoDB session for transaction
 * @returns True if all milestones have accepted final milestone uploads
 */
export async function hasFinishedAllMilestones(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  // Get the contract to check milestone count
  const contract = await contractRepo.findContractById(contractId, { session });
  if (!contract || !contract.milestones) {
    return false;
  }

  // Check each milestone individually
  for (let i = 0; i < contract.milestones.length; i++) {
    const hasFinished = await hasFinishedMilestone(contractId, i, session);
    if (!hasFinished) {
      return false;
    }
  }

  return true;
}

/**
 * Get finished upload status for a contract (summary of all uploads)
 *
 * @param contractId - Contract ID to check
 * @param session - Optional MongoDB session for transaction
 * @returns Object containing finish status for different upload types
 */
export async function getContractFinishStatus(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<{
  hasFinishedContract: boolean;
  hasFinishedAllMilestones: boolean;
  finishedMilestones: number[];
  finishedRevisions: string[];
  finishedCancellations: string[];
}> {
  await connectDB();

  // Get the contract to check milestones and tickets
  const contract = await contractRepo.findContractById(contractId, { session });
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Check contract-level final upload
  const contractFinished = await hasFinishedContract(contractId, session);

  // Check milestone uploads
  const finishedMilestones: number[] = [];
  let allMilestonesFinished = true;

  if (contract.milestones) {
    for (let i = 0; i < contract.milestones.length; i++) {
      const milestoneFinished = await hasFinishedMilestone(
        contractId,
        i,
        session
      );
      if (milestoneFinished) {
        finishedMilestones.push(i);
      } else {
        allMilestonesFinished = false;
      }
    }
  } else {
    allMilestonesFinished = false;
  }

  // Check revision uploads
  const finishedRevisions: string[] = [];
  if (contract.revisionTickets && contract.revisionTickets.length > 0) {
    for (const ticketId of contract.revisionTickets) {
      const revisionFinished = await hasFinishedRevision(
        contractId,
        ticketId,
        session
      );
      if (revisionFinished) {
        finishedRevisions.push(ticketId.toString());
      }
    }
  }

  // Check cancellation uploads
  const finishedCancellations: string[] = [];
  if (contract.cancelTickets && contract.cancelTickets.length > 0) {
    for (const ticketId of contract.cancelTickets) {
      const cancellationFinished = await hasFinishedCancellation(
        contractId,
        ticketId,
        session
      );
      if (cancellationFinished) {
        finishedCancellations.push(ticketId.toString());
      }
    }
  }

  return {
    hasFinishedContract: contractFinished,
    hasFinishedAllMilestones: allMilestonesFinished,
    finishedMilestones,
    finishedRevisions,
    finishedCancellations,
  };
}

