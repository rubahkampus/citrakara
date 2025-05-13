// src/lib/services/contractValidation.service.ts
import { connectDB } from "@/lib/db/connection";
import type { ObjectId } from "@/types/common";
import { HttpError } from "./commissionListing.service";
import * as validationService from "./validation.service";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import * as contractRepo from "@/lib/db/repositories/contract.repository";

/**
 * Comprehensive validation of contract state
 * @param contractId Contract ID to check
 * @returns Object with validation details for the contract's state
 */
export async function validateContractState(
  contractId: string | ObjectId
): Promise<{
  activeTickets: {
    cancel: boolean;
    revision: boolean;
    change: boolean;
    resolution: boolean;
  };
  pendingUploads: {
    revision: boolean;
    cancellation: boolean;
    finalMilestone: boolean;
    final: boolean;
  };
  messages: string[];
}> {
  await connectDB();

  const result = {
    activeTickets: {
      cancel: false,
      revision: false,
      change: false,
      resolution: false,
    },
    pendingUploads: {
      revision: false,
      cancellation: false,
      finalMilestone: false,
      final: false,
    },
    messages: [] as string[],
  };

  // Check for active tickets
  result.activeTickets.cancel = await ticketRepo.hasActiveTicketsOfType(
    contractId,
    "cancel"
  );
  result.activeTickets.revision = await ticketRepo.hasActiveTicketsOfType(
    contractId,
    "revision"
  );
  result.activeTickets.change = await ticketRepo.hasActiveTicketsOfType(
    contractId,
    "change"
  );
  result.activeTickets.resolution = await ticketRepo.hasActiveTicketsOfType(
    contractId,
    "resolution"
  );

  // Add messages for active tickets
  if (result.activeTickets.cancel) {
    result.messages.push(
      "There is an active cancellation request for this contract."
    );
  }
  if (result.activeTickets.revision) {
    result.messages.push(
      "There are active revision requests for this contract."
    );
  }
  if (result.activeTickets.change) {
    result.messages.push(
      "There is an active change request for this contract."
    );
  }
  if (result.activeTickets.resolution) {
    result.messages.push(
      "There are active resolution cases for this contract."
    );
  }

  // Check for pending uploads
  const {
    hasUnfinished,
    pendingRevisionUploads,
    pendingCancellationUploads,
    message,
  } = await validationService.hasUnfinishedUploadsForResolvedTickets(
    contractId
  );

  result.pendingUploads.revision = pendingRevisionUploads;
  result.pendingUploads.cancellation = pendingCancellationUploads;

  // Check for pending final milestone uploads
  result.pendingUploads.finalMilestone =
    await uploadRepo.hasActiveFinalMilestoneUploads(contractId);

  // Check for pending final uploads
  result.pendingUploads.final = await uploadRepo.hasActiveContractFinalUploads(
    contractId
  );

  // Add messages for pending uploads
  if (hasUnfinished && message) {
    result.messages.push(message);
  }

  if (result.pendingUploads.finalMilestone) {
    result.messages.push(
      "There are final milestone uploads waiting for client review."
    );
  }

  if (result.pendingUploads.final) {
    result.messages.push("There is a final upload waiting for client review.");
  }

  return result;
}

/**
 * Check if a contract can be completed
 * @param contractId Contract ID to check
 * @returns Object with validation result and message
 */
export async function canCompleteContract(
  contractId: string | ObjectId
): Promise<{ canComplete: boolean; message: string }> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { canComplete: false, message: "Contract not found" };
  }

  // Check contract status - only active contracts can be completed
  if (contract.status !== "active") {
    return {
      canComplete: false,
      message: "Only active contracts can be completed",
    };
  }

  // Check for active tickets
  const result = await validateContractState(contractId);

  // If there are any active tickets or pending uploads, contract cannot be completed
  if (
    result.activeTickets.cancel ||
    result.activeTickets.revision ||
    result.activeTickets.change ||
    result.activeTickets.resolution ||
    result.pendingUploads.revision ||
    result.pendingUploads.cancellation ||
    result.pendingUploads.finalMilestone ||
    result.pendingUploads.final
  ) {
    return {
      canComplete: false,
      message:
        "Contract has pending tickets or uploads that must be resolved first: " +
        result.messages.join(" "),
    };
  }

  // For milestone contracts, all milestones must be completed
  if (contract.proposalSnapshot.listingSnapshot.flow === "milestone") {
    if (!contract.milestones) {
      return { canComplete: false, message: "Contract milestones not found" };
    }

    const hasIncompleteMilestones = contract.milestones.some(
      (milestone) =>
        milestone.status !== "accepted" && milestone.status !== "completed"
    );

    if (hasIncompleteMilestones) {
      return {
        canComplete: false,
        message:
          "All milestones must be completed before finalizing the contract",
      };
    }
  }

  return { canComplete: true, message: "Contract can be completed" };
}

/**
 * Check if a contract can be cancelled
 * @param contractId Contract ID to check
 * @returns Object with validation result and message
 */
export async function canCancelContract(
  contractId: string | ObjectId
): Promise<{ canCancel: boolean; message: string }> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { canCancel: false, message: "Contract not found" };
  }

  // Check contract status - only active contracts can be cancelled
  if (contract.status !== "active") {
    return {
      canCancel: false,
      message: "Only active contracts can be cancelled",
    };
  }

  // Check for active tickets
  const result = await validateContractState(contractId);

  // Contract cannot be cancelled if there are active change or resolution tickets
  if (result.activeTickets.change || result.activeTickets.resolution) {
    return {
      canCancel: false,
      message:
        "Contract has pending change or resolution tickets that must be resolved first",
    };
  }

  // Contract cannot be cancelled if there are active resolution tickets
  if (result.activeTickets.resolution) {
    return {
      canCancel: false,
      message:
        "Contract has pending resolution cases that must be resolved first",
    };
  }

  // There should not be any active cancel tickets
  if (result.activeTickets.cancel) {
    return {
      canCancel: false,
      message:
        "There is already an active cancellation request for this contract",
    };
  }

  return { canCancel: true, message: "Contract can be cancelled" };
}

/**
 * Check if a milestone can be completed
 * @param contractId Contract ID to check
 * @param milestoneIdx Milestone index to check
 * @returns Object with validation result and message
 */
export async function canCompleteMilestone(
  contractId: string | ObjectId,
  milestoneIdx: number
): Promise<{ canComplete: boolean; message: string }> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { canComplete: false, message: "Contract not found" };
  }

  // Check contract status - only active contracts can have milestones completed
  if (contract.status !== "active") {
    return {
      canComplete: false,
      message: "Only active contracts can have milestones completed",
    };
  }

  // Verify milestone exists and is in progress
  if (!contract.milestones || !contract.milestones[milestoneIdx]) {
    return { canComplete: false, message: "Milestone not found" };
  }

  if (contract.milestones[milestoneIdx].status !== "inProgress") {
    return {
      canComplete: false,
      message: "Only milestones in progress can be completed",
    };
  }

  // Check for active tickets that affect the contract globally
  const result = await validateContractState(contractId);

  // Contract milestone cannot be completed if there are active cancel, change, or resolution tickets
  if (
    result.activeTickets.cancel ||
    result.activeTickets.change ||
    result.activeTickets.resolution
  ) {
    return {
      canComplete: false,
      message: "Contract has pending tickets that must be resolved first",
    };
  }

  // Check for active revision tickets for this specific milestone
  const revisionTickets = await ticketRepo.findActiveRevisionTickets(
    contractId
  );
  const milestoneRevisionTickets = revisionTickets.filter(
    (ticket) => ticket.milestoneIdx === milestoneIdx
  );

  if (milestoneRevisionTickets.length > 0) {
    return {
      canComplete: false,
      message:
        "This milestone has pending revision requests that must be resolved first",
    };
  }

  // Check for active final milestone uploads
  const hasPendingUploads = await uploadRepo.hasActiveFinalMilestoneUploads(
    contractId,
    milestoneIdx
  );

  if (hasPendingUploads) {
    return {
      canComplete: false,
      message: "This milestone has pending uploads waiting for client review",
    };
  }

  return { canComplete: true, message: "Milestone can be completed" };
}

/**
 * Integrated helper method to check if user can perform an action on a contract
 * @param contractId Contract ID to check
 * @param userId User ID
 * @param action Action to check permission for
 * @returns Object with permission result and message
 */
export async function canPerformContractAction(
  contractId: string | ObjectId,
  userId: string,
  action:
    | "createCancelTicket"
    | "createRevisionTicket"
    | "createChangeTicket"
    | "createResolutionTicket"
    | "uploadFinal"
    | "completeMilestone"
    | "uploadRevision"
): Promise<{ canPerform: boolean; message: string }> {
  await connectDB();

  // Get the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    return { canPerform: false, message: "Contract not found" };
  }

  // Determine if user is artist or client
  const isArtist = contract.artistId.toString() === userId;
  const isClient = contract.clientId.toString() === userId;

  if (!isArtist && !isClient) {
    return {
      canPerform: false,
      message: "Not authorized to perform actions on this contract",
    };
  }

  // Check action permissions based on role and contract state
  switch (action) {
    case "createCancelTicket":
      // Both artist and client can create cancel tickets
      return await canCancelContract(contractId);

    case "createRevisionTicket":
      // Only clients can create revision tickets
      if (!isClient) {
        return {
          canPerform: false,
          message: "Only clients can create revision requests",
        };
      }

      // Check if the contract allows revisions
      if (
        contract.proposalSnapshot.listingSnapshot.revisions?.type === "none"
      ) {
        return {
          canPerform: false,
          message: "This contract does not allow revisions",
        };
      }

      // Check for active tickets
      const revisionState = await validateContractState(contractId);
      if (revisionState.activeTickets.revision) {
        return {
          canPerform: false,
          message:
            "There are already active revision requests for this contract",
        };
      }

      return { canPerform: true, message: "Revision request can be created" };

    case "createChangeTicket":
      // Only clients can create change tickets
      if (!isClient) {
        return {
          canPerform: false,
          message: "Only clients can create change requests",
        };
      }

      // Check if changes are allowed
      if (!contract.proposalSnapshot.listingSnapshot.allowContractChange) {
        return {
          canPerform: false,
          message: "This contract does not allow changes",
        };
      }

      // Check for active tickets
      const changeState = await validateContractState(contractId);
      if (changeState.activeTickets.change) {
        return {
          canPerform: false,
          message:
            "There is already an active change request for this contract",
        };
      }

      return { canPerform: true, message: "Change request can be created" };

    case "createResolutionTicket":
      // Both artist and client can create resolution tickets
      // Check for active resolution tickets
      const resolutionState = await validateContractState(contractId);
      if (resolutionState.activeTickets.resolution) {
        return {
          canPerform: false,
          message:
            "There is already an active resolution case for this contract",
        };
      }

      return { canPerform: true, message: "Resolution case can be created" };

    case "uploadFinal":
      // Only artists can upload final deliverables
      if (!isArtist) {
        return {
          canPerform: false,
          message: "Only artists can upload final deliverables",
        };
      }

      // Check if the contract can be completed
      return await canCompleteContract(contractId);

    case "completeMilestone":
      // Only artists can submit milestone completion
      if (!isArtist) {
        return {
          canPerform: false,
          message: "Only artists can submit milestone completion",
        };
      }

      // Need milestone index to check - handled in the specific endpoint
      return {
        canPerform: true,
        message:
          "Milestone completion permission will be checked with specific milestone index",
      };

    case "uploadRevision":
      // Only artists can upload revisions
      if (!isArtist) {
        return {
          canPerform: false,
          message: "Only artists can upload revisions",
        };
      }

      // Need revision ticket ID to check - handled in the specific endpoint
      return {
        canPerform: true,
        message:
          "Revision upload permission will be checked with specific revision ticket",
      };

    default:
      return { canPerform: false, message: "Unknown action" };
  }
}
