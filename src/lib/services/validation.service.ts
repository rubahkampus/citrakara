// src/lib/services/validation.service.ts
import { connectDB } from "@/lib/db/connection";
import type { ObjectId } from "@/types/common";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import * as contractRepo from "@/lib/db/repositories/contract.repository";

/**
 * ValidationService - Handles all validation logic for checking active tickets and uploads
 * This helps prevent creating new tickets or uploads when previous ones are still active
 */

/**
 * Check if there are any active tickets of a specific type
 * @param contractId Contract ID to check
 * @param ticketType Type of ticket to check
 * @returns Object with result and message
 */
export async function hasActiveTicket(
  contractId: string | ObjectId,
  ticketType: "change" | "revision" | "resolution" | "cancel"
): Promise<{ hasActive: boolean; message: string }> {
  await connectDB();

  let activeTickets: any[] = [];
  let message = "";

  switch (ticketType) {
    case "change":
      activeTickets = await ticketRepo.findActiveChangeTickets(contractId);
      message =
        "There is already an active change request for this contract. Please wait for it to be resolved before creating a new one.";
      break;

    case "revision":
      activeTickets = await ticketRepo.findActiveRevisionTickets(contractId);
      message =
        "There is already an active revision request for this contract. Please wait for it to be resolved before creating a new one.";
      break;

    case "resolution":
      // For resolution tickets, we check for any that aren't in a terminal state
      const resolutionTickets =
        await ticketRepo.findResolutionTicketsByContract(contractId);
      activeTickets = resolutionTickets.filter(
        (ticket) => !["resolved", "cancelled"].includes(ticket.status)
      );
      message =
        "There is already an active resolution case for this contract. Please wait for it to be resolved before creating a new one.";
      break;

    case "cancel":
      // For cancel tickets, we check for any with pending status
      activeTickets = await ticketRepo.findPendingCancelTickets(contractId);
      message =
        "There is already a pending cancellation request for this contract. Please wait for it to be resolved before creating a new one.";
      break;
  }

  return {
    hasActive: activeTickets.length > 0,
    message,
  };
}

/**
 * Check if there are unfinished uploads for resolved tickets
 * This ensures artists can't leave uploads pending for resolved tickets
 * @param contractId Contract ID to check
 * @returns Object with result, specific ticket types with issues, and message
 */
export async function hasUnfinishedUploadsForResolvedTickets(
  contractId: string | ObjectId
): Promise<{
  hasUnfinished: boolean;
  pendingRevisionUploads: boolean;
  pendingCancellationUploads: boolean;
  message: string;
}> {
  await connectDB();

  // Get the contract with populated tickets
  const contract = await contractRepo.findContractById(contractId, {
    populate: ["revisionTickets", "cancelTickets"],
  });

  if (!contract) {
    return {
      hasUnfinished: false,
      pendingRevisionUploads: false,
      pendingCancellationUploads: false,
      message: "Contract not found",
    };
  }

  // Check for revision tickets that are resolved but don't have accepted uploads
  let pendingRevisionUploads = false;
  let pendingRevisionMessage = "";

  if (contract.revisionTickets && contract.revisionTickets.length > 0) {
    for (const ticket of contract.revisionTickets) {
      const ticketObject = await ticketRepo.findRevisionTicketById(ticket);

      // Only check tickets that are accepted/paid and need uploads
      if (
        ticketObject && ["accepted", "paid", "forcedAcceptedArtist"].includes(ticketObject.status) &&
        ticketObject.resolved
      ) {
        // Find uploads for this ticket
        const uploads = await uploadRepo.findRevisionUploadsByTicket(
          ticket._id
        );

        // If no uploads or none are accepted, this is pending
        const hasAcceptedUpload = uploads.some(
          (upload) =>
            upload.status === "accepted" || upload.status === "forcedAccepted"
        );

        if (!hasAcceptedUpload) {
          pendingRevisionUploads = true;
          pendingRevisionMessage =
            "You have revision tickets that require uploads. Please complete these revisions before proceeding.";
          break;
        }
      }
    }
  }

  // Check for cancellation uploads needed
  let pendingCancellationUploads = false;
  let pendingCancellationMessage = "";

  if (contract.cancelTickets && contract.cancelTickets.length > 0) {
    // Get active cancel tickets (accepted or forced)
    const activeTickets = contract.cancelTickets.filter(
      (ticket) =>
        ticket.status === "accepted" || ticket.status === "forcedAccepted"
    );

    if (activeTickets.length > 0) {
      // Check if there's a final upload that addresses the cancellation
      const finalUploads = await uploadRepo.findFinalUploadsByContract(
        contractId
      );

      // Look for final uploads that are linked to the cancel ticket and are accepted
      const hasCancellationUpload = finalUploads.some(
        (upload) =>
          activeTickets.some(
            (ticket) =>
              upload.cancelTicketId &&
              upload.cancelTicketId.toString() === ticket._id.toString()
          ) &&
          (upload.status === "accepted" || upload.status === "forcedAccepted")
      );

      if (!hasCancellationUpload) {
        pendingCancellationUploads = true;
        pendingCancellationMessage =
          "You have an accepted cancellation request that needs a final proof of work upload.";
      }
    }
  }

  // Combine results
  const hasUnfinished = pendingRevisionUploads || pendingCancellationUploads;
  let message = "";

  if (pendingRevisionUploads) {
    message = pendingRevisionMessage;
  } else if (pendingCancellationUploads) {
    message = pendingCancellationMessage;
  }

  return {
    hasUnfinished,
    pendingRevisionUploads,
    pendingCancellationUploads,
    message,
  };
}

/**
 * Check if there are any active final milestone uploads
 * This prevents artists from submitting multiple final milestone uploads at once
 * @param contractId Contract ID to check
 * @param milestoneIdx Milestone index to check (optional - if not provided, checks all milestones)
 * @returns Object with result and message
 */
export async function hasActiveFinalMilestoneUpload(
  contractId: string | ObjectId,
  milestoneIdx?: number
): Promise<{ hasActive: boolean; message: string }> {
  await connectDB();

  let query: any = {
    contractId,
    isFinal: true,
    status: "submitted", // Only submitted (not yet accepted/rejected) uploads are considered active
  };

  // If milestone index is provided, limit to that milestone
  if (milestoneIdx !== undefined) {
    query.milestoneIdx = milestoneIdx;
  }

  // Find final milestone uploads that are still in submitted status
  const uploads = await uploadRepo.findProgressUploadMilestoneByContract(
    contractId
  );
  const activeUploads = uploads.filter(
    (upload) =>
      upload.isFinal &&
      upload.status === "submitted" &&
      (milestoneIdx === undefined || upload.milestoneIdx === milestoneIdx)
  );

  return {
    hasActive: activeUploads.length > 0,
    message:
      milestoneIdx !== undefined
        ? `There is already an active final upload for milestone #${
            milestoneIdx + 1
          }. Please wait for client review before submitting a new one.`
        : "There is already an active final milestone upload. Please wait for client review before submitting a new one.",
  };
}

/**
 * Comprehensive validation before allowing a new ticket creation
 * @param contractId Contract ID to check
 * @param ticketType Type of ticket to create
 * @param userId User ID (to determine if user is artist or client)
 * @returns Object with validation result and message
 */
export async function validateBeforeTicketCreation(
  contractId: string | ObjectId,
  ticketType: "change" | "revision" | "resolution" | "cancel",
  userId: string
): Promise<{ isValid: boolean; message: string }> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { isValid: false, message: "Contract not found" };
  }

  // Check contract status - only active contracts can have new tickets
  if (contract.status !== "active") {
    return {
      isValid: false,
      message: "New tickets can only be created for active contracts",
    };
  }

  // Determine if user is artist or client
  const isArtist = contract.artistId.toString() === userId;
  const isClient = contract.clientId.toString() === userId;

  if (!isArtist && !isClient) {
    return {
      isValid: false,
      message: "Not authorized to create tickets for this contract",
    };
  }

  // Check for existing active tickets of same type
  const { hasActive, message } = await hasActiveTicket(contractId, ticketType);
  if (hasActive) {
    return { isValid: false, message };
  }

  // For artists, check if they have pending uploads for resolved tickets
  if (isArtist) {
    const { hasUnfinished, message: unfinishedMessage } =
      await hasUnfinishedUploadsForResolvedTickets(contractId);

    if (hasUnfinished) {
      return { isValid: false, message: unfinishedMessage };
    }
  }

  // Ticket-specific validations
  switch (ticketType) {
    case "change":
      // Only clients can create change tickets
      if (!isClient) {
        return {
          isValid: false,
          message: "Only clients can create change requests",
        };
      }

      // Check if changes are allowed for this contract
      if (!contract.proposalSnapshot.listingSnapshot.allowContractChange) {
        return {
          isValid: false,
          message: "This contract does not allow changes",
        };
      }
      break;

    case "revision":
      // Only clients can create revision tickets
      if (!isClient) {
        return {
          isValid: false,
          message: "Only clients can create revision requests",
        };
      }

      // Check if revisions are allowed for this contract
      if (
        contract.proposalSnapshot.listingSnapshot.revisions?.type === "none"
      ) {
        return {
          isValid: false,
          message: "This contract does not allow revisions",
        };
      }
      break;

    case "cancel":
      // Both artists and clients can create cancel tickets
      // No specific validation needed
      break;

    case "resolution":
      // Both artists and clients can create resolution tickets
      // Check if there's a dispute-eligible entity to target
      // This would need custom implementation based on your rules
      break;
  }

  // All validations passed
  return { isValid: true, message: "Validation successful" };
}

/**
 * Comprehensive validation before allowing a new upload
 * @param contractId Contract ID to check
 * @param uploadType Type of upload to create
 * @param userId User ID (should be the artist)
 * @param milestoneIdx Optional milestone index for milestone uploads
 * @param revisionTicketId Optional revision ticket ID for revision uploads
 * @param cancelTicketId Optional cancel ticket ID for final uploads in cancellation
 * @returns Object with validation result and message
 */
export async function validateBeforeUploadCreation(
  contractId: string | ObjectId,
  uploadType: "progressStandard" | "progressMilestone" | "revision" | "final",
  userId: string,
  options?: {
    milestoneIdx?: number;
    revisionTicketId?: string | ObjectId;
    cancelTicketId?: string | ObjectId;
    isFinal?: boolean;
  }
): Promise<{ isValid: boolean; message: string }> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { isValid: false, message: "Contract not found" };
  }

  // Check contract status - only active contracts can have new uploads
  if (contract.status !== "active") {
    return {
      isValid: false,
      message: "New uploads can only be created for active contracts",
    };
  }

  // Verify user is the artist
  if (contract.artistId.toString() !== userId) {
    return { isValid: false, message: "Only the artist can create uploads" };
  }

  // Check for unfinished uploads for resolved tickets
  const { hasUnfinished, message: unfinishedMessage } =
    await hasUnfinishedUploadsForResolvedTickets(contractId);

  if (hasUnfinished) {
    return { isValid: false, message: unfinishedMessage };
  }

  // Upload-specific validations
  switch (uploadType) {
    case "progressStandard":
      // Verify contract has standard flow
      if (contract.proposalSnapshot.listingSnapshot.flow !== "standard") {
        return {
          isValid: false,
          message:
            "Standard progress uploads are only allowed for standard flow contracts",
        };
      }
      break;

    case "progressMilestone":
      // Verify contract has milestone flow
      if (contract.proposalSnapshot.listingSnapshot.flow !== "milestone") {
        return {
          isValid: false,
          message:
            "Milestone progress uploads are only allowed for milestone flow contracts",
        };
      }

      const milestoneIdx = options?.milestoneIdx ?? -1;

      // Verify milestone exists and is in progress
      if (!contract.milestones || !contract.milestones[milestoneIdx]) {
        return { isValid: false, message: "Milestone not found" };
      }

      if (contract.milestones[milestoneIdx].status !== "inProgress") {
        return {
          isValid: false,
          message: "Uploads are only allowed for milestones in progress",
        };
      }

      // If this is a final upload, check if there's already an active one
      if (options?.isFinal) {
        const { hasActive, message } = await hasActiveFinalMilestoneUpload(
          contractId,
          milestoneIdx
        );
        if (hasActive) {
          return { isValid: false, message };
        }
      }
      break;

    case "revision":
      // Verify revision ticket exists and is in accepted or paid status
      if (!options?.revisionTicketId) {
        return { isValid: false, message: "Revision ticket ID is required" };
      }

      const revisionTicket = await ticketRepo.findRevisionTicketById(
        options.revisionTicketId
      );
      if (!revisionTicket) {
        return { isValid: false, message: "Revision ticket not found" };
      }

      if (
        revisionTicket.status !== "accepted" &&
        revisionTicket.status !== "paid" &&
        revisionTicket.status !== "forcedAcceptedArtist"
      ) {
        return {
          isValid: false,
          message:
            "Revision uploads are only allowed for accepted or paid revision tickets",
        };
      }
      break;

    case "final":
      // If this is for a cancellation, verify cancel ticket
      if (options?.cancelTicketId) {
        const cancelTicket = await ticketRepo.findCancelTicketById(
          options.cancelTicketId
        );
        if (!cancelTicket) {
          return { isValid: false, message: "Cancel ticket not found" };
        }

        if (
          cancelTicket.status !== "accepted" &&
          cancelTicket.status !== "forcedAccepted"
        ) {
          return {
            isValid: false,
            message:
              "Final uploads for cancellation are only allowed for accepted cancel tickets",
          };
        }
      }

      // Check if there's already an active final upload
      const finalUploads = await uploadRepo.findFinalUploadsByContract(
        contractId
      );
      const activeUploads = finalUploads.filter(
        (upload) => upload.status === "submitted"
      );

      if (activeUploads.length > 0) {
        return {
          isValid: false,
          message:
            "There is already an active final upload. Please wait for client review before submitting a new one.",
        };
      }
      break;
  }

  // All validations passed
  return { isValid: true, message: "Validation successful" };
}

/**
 * Check if a user can respond to a ticket
 * @param ticketId Ticket ID
 * @param ticketType Type of ticket
 * @param userId User ID
 * @param response Response action (accept, reject, etc.)
 * @returns Object with validation result and message
 */
export async function validateTicketResponse(
  ticketId: string | ObjectId,
  ticketType: "change" | "revision" | "resolution" | "cancel",
  userId: string,
  response: string
): Promise<{ isValid: boolean; message: string }> {
  await connectDB();

  let ticket: any;
  let contractId: any;

  // Get the ticket based on type
  switch (ticketType) {
    case "change":
      ticket = await ticketRepo.findChangeTicketById(ticketId);
      break;
    case "revision":
      ticket = await ticketRepo.findRevisionTicketById(ticketId);
      break;
    case "cancel":
      ticket = await ticketRepo.findCancelTicketById(ticketId);
      break;
    case "resolution":
      ticket = await ticketRepo.findResolutionTicketById(ticketId);
      break;
  }

  if (!ticket) {
    return { isValid: false, message: "Ticket not found" };
  }

  contractId = ticket.contractId;

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { isValid: false, message: "Contract not found" };
  }

  // Determine if user is artist, client, or admin
  const isArtist = contract.artistId.toString() === userId;
  const isClient = contract.clientId.toString() === userId;
  // You would need to implement the admin check based on your user system
  const isAdmin = false; // placeholder - replace with actual admin check

  // Check if ticket is in a state that can receive responses
  // This will differ by ticket type
  // You would implement specific validation logic here

  // Return validation result
  return { isValid: true, message: "Validation successful" };
}
