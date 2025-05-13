// src/lib/services/ticketValidation.service.ts
import { connectDB } from "@/lib/db/connection";
import type { ObjectId } from "@/types/common";
import { HttpError } from "./commissionListing.service";
import * as validationService from "./validation.service";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import * as contractRepo from "@/lib/db/repositories/contract.repository";

/**
 * Validate before creating a new cancel ticket
 */
export async function validateCancelTicketCreation(
  contractId: string | ObjectId,
  userId: string
): Promise<void> {
  const validation = await validationService.validateBeforeTicketCreation(
    contractId,
    "cancel",
    userId
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }
}

/**
 * Validate before creating a new revision ticket
 */
export async function validateRevisionTicketCreation(
  contractId: string | ObjectId,
  userId: string
): Promise<void> {
  const validation = await validationService.validateBeforeTicketCreation(
    contractId,
    "revision",
    userId
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }
}

/**
 * Validate before creating a new change ticket
 */
export async function validateChangeTicketCreation(
  contractId: string | ObjectId,
  userId: string
): Promise<void> {
  const validation = await validationService.validateBeforeTicketCreation(
    contractId,
    "change",
    userId
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }
}

/**
 * Validate before creating a new resolution ticket
 */
export async function validateResolutionTicketCreation(
  contractId: string | ObjectId,
  userId: string,
  targetType: "cancel" | "revision" | "final" | "milestone",
  targetId: string | ObjectId
): Promise<void> {
  const validation = await validationService.validateBeforeTicketCreation(
    contractId,
    "resolution",
    userId
  );

  if (!validation.isValid) {
    throw new HttpError(validation.message, 400);
  }

  // Check if there's already an active resolution for this target
  const activeResolutions =
    await ticketRepo.findActiveResolutionTicketsForTarget(targetType, targetId);

  if (activeResolutions.length > 0) {
    throw new HttpError(
      "There is already an active resolution case for this item. Please use the existing resolution.",
      400
    );
  }
}

/**
 * Validate before responding to a cancel ticket
 */
export async function validateCancelTicketResponse(
  ticketId: string | ObjectId,
  userId: string,
  response: "accept" | "reject" | "forcedAccept"
): Promise<void> {
  const ticket = await ticketRepo.findCancelTicketById(ticketId);
  if (!ticket) {
    throw new HttpError("Ticket not found", 404);
  }

  if (ticket.status !== "pending") {
    throw new HttpError("This ticket has already been processed", 400);
  }

  // Get the contract
  const contract = await contractRepo.findContractById(ticket.contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is authorized to respond
  const isClient = contract.clientId.toString() === userId;
  const isArtist = contract.artistId.toString() === userId;
  const isAdmin = false; // Replace with actual admin check

  // Only counterparty or admin can respond
  const isCounterparty =
    (ticket.requestedBy === "client" && isArtist) ||
    (ticket.requestedBy === "artist" && isClient);

  if (!isCounterparty && !isAdmin) {
    throw new HttpError("Not authorized to respond to this ticket", 403);
  }

  // Only admin can use forcedAccept
  if (response === "forcedAccept" && !isAdmin) {
    throw new HttpError("Only administrators can force ticket acceptance", 403);
  }
}

/**
 * Validate before responding to a revision ticket
 */
export async function validateRevisionTicketResponse(
  ticketId: string | ObjectId,
  userId: string,
  response: "accept" | "reject" | "forcedAcceptArtist"
): Promise<void> {
  const ticket = await ticketRepo.findRevisionTicketById(ticketId);
  if (!ticket) {
    throw new HttpError("Ticket not found", 404);
  }

  if (ticket.status !== "pending") {
    throw new HttpError("This ticket has already been processed", 400);
  }

  // Get the contract
  const contract = await contractRepo.findContractById(ticket.contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is artist or admin
  const isArtist = contract.artistId.toString() === userId;
  const isAdmin = false; // Replace with actual admin check

  if (!isArtist && !isAdmin) {
    throw new HttpError(
      "Only the artist can respond to revision requests",
      403
    );
  }

  // Only admin can use forcedAcceptArtist
  if (response === "forcedAcceptArtist" && !isAdmin) {
    throw new HttpError("Only administrators can force ticket acceptance", 403);
  }

  // Rejection requires a reason (handled in the service function)
}

/**
 * Validate before responding to a change ticket
 */
// src/lib/services/ticketValidation.service.ts (continued)
export async function validateChangeTicketResponse(
  ticketId: string | ObjectId,
  userId: string,
  response:
    | "accept"
    | "reject"
    | "propose"
    | "forcedAcceptArtist"
    | "forcedAcceptClient"
): Promise<void> {
  const ticket = await ticketRepo.findChangeTicketById(ticketId);
  if (!ticket) {
    throw new HttpError("Ticket not found", 404);
  }

  // Get the contract
  const contract = await contractRepo.findContractById(ticket.contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is artist, client, or admin
  const isArtist = contract.artistId.toString() === userId;
  const isClient = contract.clientId.toString() === userId;
  const isAdmin = false; // Replace with actual admin check

  if (!isArtist && !isClient && !isAdmin) {
    throw new HttpError("Not authorized to respond to this ticket", 403);
  }

  // Validate based on ticket status and user role
  if (ticket.status === "pendingArtist") {
    // Only artist or admin can respond when pendingArtist
    if (!isArtist && !isAdmin) {
      throw new HttpError("Only the artist can respond at this stage", 403);
    }

    // Artist can accept, reject, or propose
    if (isArtist && !["accept", "reject", "propose"].includes(response)) {
      throw new HttpError("Invalid response for artist at this stage", 400);
    }
  } else if (ticket.status === "pendingClient") {
    // Only client or admin can respond when pendingClient
    if (!isClient && !isAdmin) {
      throw new HttpError("Only the client can respond at this stage", 403);
    }

    // Client can accept or reject
    if (isClient && !["accept", "reject"].includes(response)) {
      throw new HttpError("Invalid response for client at this stage", 400);
    }
  } else {
    throw new HttpError(
      "This ticket is not in a state that can be responded to",
      400
    );
  }

  // Only admin can use forced actions
  if (
    (response === "forcedAcceptArtist" || response === "forcedAcceptClient") &&
    !isAdmin
  ) {
    throw new HttpError("Only administrators can force ticket acceptance", 403);
  }
}

/**
 * Validate before submitting counterproof for a resolution ticket
 */
export async function validateResolutionCounterproof(
  ticketId: string | ObjectId,
  userId: string
): Promise<void> {
  const ticket = await ticketRepo.findResolutionTicketById(ticketId);
  if (!ticket) {
    throw new HttpError("Ticket not found", 404);
  }

  if (ticket.status !== "open") {
    throw new HttpError("This ticket is no longer accepting counterproof", 400);
  }

  // Verify counterproof deadline hasn't passed
  if (ticket.counterExpiresAt < new Date()) {
    throw new HttpError(
      "The deadline for submitting counterproof has passed",
      400
    );
  }

  // Get the contract
  const contract = await contractRepo.findContractById(ticket.contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Verify user is the counterparty
  const isClient = contract.clientId.toString() === userId;
  const isArtist = contract.artistId.toString() === userId;

  const expectedCounterparty =
    ticket.submittedBy === "client" ? "artist" : "client";
  const actualRole = isClient ? "client" : isArtist ? "artist" : "unknown";

  if (actualRole !== expectedCounterparty) {
    throw new HttpError("Only the counterparty can submit counterproof", 403);
  }
}
