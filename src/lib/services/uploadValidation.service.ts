// src/lib/services/uploadValidation.service.ts
import { connectDB } from "@/lib/db/connection";
import type { ObjectId } from "@/types/common";
import { HttpError } from "./commissionListing.service";
import * as validationService from "./validation.service";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import * as contractRepo from "@/lib/db/repositories/contract.repository";

/**
 * Validate before creating a standard progress upload
 */
export async function validateProgressStandardUpload(
  contractId: string | ObjectId,
  userId: string
): Promise<void> {
  const validation = await validationService.validateBeforeUploadCreation(
    contractId,
    "progressStandard",
    userId
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }
}

/**
 * Validate before creating a milestone progress upload
 */
export async function validateProgressMilestoneUpload(
  contractId: string | ObjectId,
  userId: string,
  milestoneIdx: number,
  isFinal: boolean
): Promise<void> {
  const validation = await validationService.validateBeforeUploadCreation(
    contractId,
    "progressMilestone",
    userId,
    { milestoneIdx, isFinal }
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }
}

/**
 * Validate before creating a revision upload
 */
export async function validateRevisionUpload(
  contractId: string | ObjectId,
  userId: string,
  revisionTicketId: string | ObjectId
): Promise<void> {
  const validation = await validationService.validateBeforeUploadCreation(
    contractId,
    "revision",
    userId,
    { revisionTicketId }
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }

  // Additional checks for revision uploads
  const ticket = await ticketRepo.findRevisionTicketById(revisionTicketId);
  if (!ticket) {
    throw new HttpError("Revision ticket not found", 404);
  }

  // Check if there's already a submitted revision upload that hasn't been reviewed
  const uploads = await uploadRepo.findRevisionUploadsByTicket(
    revisionTicketId
  );
  const pendingUploads = uploads.filter(
    (upload) => upload.status === "submitted"
  );

  if (pendingUploads.length > 0) {
    throw new HttpError(
      "There is already a pending revision upload for this ticket. Please wait for client review before submitting a new one.",
      400
    );
  }
}

/**
 * Validate before creating a final upload
 */
export async function validateFinalUpload(
  contractId: string | ObjectId,
  userId: string,
  workProgress: number,
  cancelTicketId?: string | ObjectId
): Promise<void> {
  const validation = await validationService.validateBeforeUploadCreation(
    contractId,
    "final",
    userId,
    { cancelTicketId }
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }

  // Additional checks for final uploads
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // For milestone contracts, all milestones must be completed before final upload
  if (contract.proposalSnapshot.listingSnapshot.flow === "milestone") {
    if (!contract.milestones) {
      throw new HttpError("Contract milestones not found", 500);
    }

    const hasIncompleteMilestones = contract.milestones.some(
      (milestone) =>
        milestone.status !== "accepted" && milestone.status !== "completed"
    );

    if (hasIncompleteMilestones) {
      throw new HttpError(
        "All milestones must be completed before submitting a final delivery",
        400
      );
    }
  }

  // Validate cancellation vs. completion
  if (cancelTicketId) {
    // Check that workProgress is < 100 for cancellations
    if (workProgress >= 100) {
      throw new HttpError(
        "Work progress for cancellation must be less than 100%",
        400
      );
    }

    // Verify cancel ticket exists and is accepted
    const cancelTicket = await ticketRepo.findCancelTicketById(cancelTicketId);
    if (!cancelTicket) {
      throw new HttpError("Cancel ticket not found", 404);
    }

    if (
      cancelTicket.status !== "accepted" &&
      cancelTicket.status !== "forcedAccepted"
    ) {
      throw new HttpError(
        "Cancel ticket must be accepted before uploading final proof",
        400
      );
    }
  } else {
    // For normal completion, check that workProgress is 100
    if (workProgress < 100) {
      throw new HttpError("Work progress for final delivery must be 100%", 400);
    }

    // Check that there are no pending revision tickets
    const pendingRevisions = await ticketRepo.findActiveRevisionTickets(
      contractId
    );
    if (pendingRevisions.length > 0) {
      throw new HttpError(
        "All revision requests must be completed before submitting final delivery",
        400
      );
    }
  }
}

/**
 * Validate before client reviews an upload
 */
export async function validateUploadReview(
  uploadType: "milestone" | "revision" | "final",
  uploadId: string | ObjectId,
  contractId: string | ObjectId,
  userId: string
): Promise<void> {
  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is the client
  if (contract.clientId.toString() !== userId) {
    throw new HttpError("Only the client can review uploads", 403);
  }

  // Get the upload based on type
  let upload: any;
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

  // Verify upload is in submitted status
  if (upload.status !== "submitted") {
    throw new HttpError(
      "Upload must be in submitted status to be reviewed",
      400
    );
  }

  // Verify the upload belongs to the specified contract
  if (upload.contractId.toString() !== contractId.toString()) {
    throw new HttpError(
      "Upload does not belong to the specified contract",
      400
    );
  }
}
