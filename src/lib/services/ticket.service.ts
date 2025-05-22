// src/lib/services/ticket.service.ts
import type { ObjectId, Cents } from "@/types/common";
import * as ticketRepo from "@/lib/db/repositories/ticket.repository";
import * as contractService from "./contract.service";
import * as escrowService from "./escrowTransaction.service";
import * as contractRepo from "@/lib/db/repositories/contract.repository";
import * as uploadRepo from "@/lib/db/repositories/upload.repository";
import { HttpError } from "./commissionListing.service";
import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";
import { ClientSession, startSession } from "mongoose";
import { connectDB } from "../db/connection";
import { isAdminById } from "../db/repositories/user.repository";
import { addFundsToWallet, checkSufficientFunds } from "./wallet.service";
import { IContract } from "../db/models/contract.model";
import { toObjectId } from "@/lib/utils/toObjectId";
import {
  ICancelTicket,
  IChangeTicket,
  IResolutionTicket,
  IRevisionTicket,
} from "../db/models/ticket.model";

//=============================================================================
// CANCEL TICKET OPERATIONS
//=============================================================================

/**
 * Create a cancellation ticket for a contract
 *
 * @param contractId - ID of the contract to be cancelled
 * @param userId - ID of the user creating the ticket (must be client or artist)
 * @param reason - Explanation for cancellation request
 * @returns The created cancel ticket
 * @throws HttpError if contract not found or user doesn't have permission
 */
export async function createCancelTicket(
  contractId: string | ObjectId,
  userId: string,
  reason: string
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract to verify user is part of it
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Determine if user is client or artist
    const isClient = contract.clientId.toString() === userId;
    const isArtist = contract.artistId.toString() === userId;

    if (!isClient && !isArtist) {
      throw new HttpError(
        "Not authorized to create cancellation for this contract",
        403
      );
    }

    // BLOCKING VALIDATION: Check for existing unresolved cancel tickets
    const existingCancelTickets = await getUnresolvedCancelTickets(contractId);
    if (existingCancelTickets.length > 0) {
      throw new HttpError(
        "There is already an active cancellation request for this contract. Please wait until it is resolved before creating a new one.",
        409 // Conflict status code
      );
    }

    // BLOCKING VALIDATION: Check for unresolved resolution tickets
    const existingResolutionTickets = await getUnresolvedResolutionTickets(
      contractId
    );
    if (existingResolutionTickets.length > 0) {
      throw new HttpError(
        "There are active resolution cases for this contract. Please wait until they are resolved before creating a cancellation request.",
        409
      );
    }

    // Create cancel ticket
    const requestedBy = isClient ? "client" : "artist";
    const ticket = await ticketRepo.createCancelTicket(
      toObjectId(contractId),
      requestedBy,
      reason,
      session
    );

    // Link ticket to contract
    await contractService.addTicketToContract(
      contractId,
      "cancel",
      ticket._id,
      session
    );

    await session.commitTransaction();
    return ticket;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Respond to a cancellation ticket with accept, reject, or forcedAccept
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the cancel ticket
 * @param userId - ID of the user responding (must be counterparty or admin)
 * @param response - Type of response (accept, reject, or forcedAccept)
 * @returns Object containing ticket and action taken
 * @throws HttpError if ticket not found or user doesn't have permission
 */
export async function respondToCancelTicket(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  userId: string,
  response: "accept" | "reject" | "forcedAccept"
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract and ticket
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    const ticket = await ticketRepo.findCancelTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Verify user is part of the contract
    const isClient = contract.clientId.toString() === userId;
    const isArtist = contract.artistId.toString() === userId;
    const isAdmin = await isAdminById(userId);

    if (!isClient && !isArtist && !isAdmin) {
      throw new HttpError("Not authorized to respond to this ticket", 403);
    }

    // Verify user is the counterparty (not the one who created the ticket)
    const isCounterparty =
      (ticket.requestedBy === "client" && isArtist) ||
      (ticket.requestedBy === "artist" && isClient);

    if (!isCounterparty && !isAdmin) {
      throw new HttpError(
        "Only the counterparty can respond to this ticket",
        403
      );
    }

    // Update ticket status
    let newStatus: any;
    if (response === "accept") {
      newStatus = "accepted";
    } else if (response === "forcedAccept" && isAdmin) {
      newStatus = "forcedAccepted";
    } else if (response === "reject") {
      newStatus = "rejected";
    } else {
      throw new HttpError("Invalid response", 400);
    }

    await ticketRepo.updateCancelTicketStatus(ticketId, newStatus, session);

    // If accepted or forced accepted, we need an upload with work progress
    // This will be handled separately in the upload service

    await session.commitTransaction();
    return { ticket, action: response };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

//=============================================================================
// REVISION TICKET OPERATIONS
//=============================================================================

/**
 * Create a revision ticket for a contract using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the ticket (must be client)
 * @param form - FormData containing description, reference images, and optional milestone index
 * @returns The created revision ticket
 * @throws HttpError if contract not found or user doesn't have permission
 */
export async function createRevisionTicket(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract to verify user is the client
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.clientId.toString() !== userId) {
      throw new HttpError("Only clients can create revision requests", 403);
    }

    // ADDITIONAL VALIDATION: Check if revisions are allowed in the contract
    if (contract.proposalSnapshot.listingSnapshot.revisions?.type === "none") {
      throw new HttpError("This contract does not allow revisions", 400);
    }

    // BLOCKING VALIDATION: Check for unresolved resolution tickets
    const existingResolutionTickets = await getUnresolvedResolutionTickets(
      contractId
    );
    if (existingResolutionTickets.length > 0) {
      throw new HttpError(
        "There are active resolution cases for this contract. Please wait until they are resolved before creating a revision request.",
        409
      );
    }

    // Get description and milestone index from form data
    const description = form.get("description")?.toString() || "";

    let milestoneIdx: number | undefined;
    const milestoneIdxStr = form.get("milestoneIdx")?.toString();
    if (milestoneIdxStr) {
      milestoneIdx = Number(milestoneIdxStr);
      if (isNaN(milestoneIdx)) {
        throw new HttpError("Invalid milestone index", 400);
      }
    }

    // Check if revision is allowed based on contract policy
    const revisionAllowed = await checkRevisionAllowed(contract, milestoneIdx);
    if (!revisionAllowed.allowed) {
      throw new HttpError(
        revisionAllowed.message || "Revision not allowed",
        400
      );
    }

    // Get image blobs from form data
    const referenceImageBlobs = form
      .getAll("referenceImages[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Upload reference images
    let imageUrls: string[] = [];
    if (referenceImageBlobs && referenceImageBlobs.length > 0) {
      imageUrls = await uploadGalleryImagesToR2(
        referenceImageBlobs,
        userId,
        contractId.toString()
      );
    }

    const revisionInfo = getRevisionInfo(contract);

    // Create revision ticket
    const ticket = await ticketRepo.createRevisionTicket(
      {
        contractId: toObjectId(contractId),
        description,
        referenceImages: imageUrls,
        milestoneIdx,
        paidFee: revisionInfo.isPaid ? revisionInfo.fee : undefined,
      },
      session
    );

    // Link ticket to contract
    await contractService.addTicketToContract(
      contractId,
      "revision",
      ticket._id,
      session
    );

    // Increment the revisionDone
    await contractService.incrementRevisionCounter(
      contractId,
      session,
      ticket.milestoneIdx
    );

    await session.commitTransaction();
    return ticket;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Respond to a revision ticket with accept, reject, or forcedAcceptArtist
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the revision ticket
 * @param userId - ID of the user responding (must be artist or admin)
 * @param response - Type of response (accept, reject, or forcedAcceptArtist)
 * @param rejectionReason - Required if response is "reject"
 * @returns Object containing the updated ticket and action taken
 * @throws HttpError if ticket not found or user doesn't have permission
 */
export async function respondToRevisionTicket(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  userId: string,
  response: "accept" | "reject" | "forcedAcceptArtist",
  rejectionReason?: string
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract and ticket
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    const ticket = await ticketRepo.findRevisionTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Verify user is the artist or admin
    const isArtist = contract.artistId.toString() === userId;
    const isAdmin = await isAdminById(userId);

    if (!isArtist && !isAdmin) {
      throw new HttpError(
        "Only the artist can respond to revision requests",
        403
      );
    }

    // Update ticket status
    let newStatus: any;
    if (response === "accept") {
      newStatus = "accepted";
    } else if (response === "forcedAcceptArtist" && isAdmin) {
      newStatus = "forcedAcceptedArtist";
    } else if (response === "reject") {
      if (!rejectionReason) {
        throw new HttpError("Rejection reason is required", 400);
      }
      newStatus = "rejected";

      await contractService.decrementRevisionCounter(
        contractId,
        session,
        ticket.milestoneIdx
      );
    } else {
      throw new HttpError("Invalid response", 400);
    }

    const updatedTicket = await ticketRepo.updateRevisionTicketStatus(
      ticketId,
      newStatus,
      rejectionReason,
      undefined,
      undefined,
      session
    );

    // If this is a paid revision and accepted, we'll need to process payment later
    // This will be handled in a separate function

    await session.commitTransaction();
    return { ticket: updatedTicket, action: response };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Pay for a revision ticket that requires payment
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the revision ticket
 * @param userId - ID of the user paying (must be client)
 * @param paymentMethod - Method of payment (wallet, card, or combo)
 * @param walletAmount - Amount to pay from wallet
 * @param paymentAmount - Total payment amount
 * @param secondaryMethod - Secondary payment method for combo
 * @param remainingAmount - Amount to pay with secondary method
 * @returns Object containing ticket and transaction details
 * @throws HttpError if ticket not found or payment invalid
 */
export async function payRevisionFee(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  userId: string,
  paymentMethod: "wallet" | "card" | "combo",
  walletAmount: number,
  paymentAmount: number,
  secondaryMethod?: "card" | undefined,
  remainingAmount?: number
): Promise<any> {
  await connectDB();
  const session = await startSession();
  try {
    session.startTransaction();

    // Get the contract and ticket
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    const ticket = await ticketRepo.findRevisionTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Verify user is the client
    if (contract.clientId.toString() !== userId) {
      throw new HttpError("Only the client can pay for revisions", 403);
    }

    // Verify ticket status is 'accepted'
    if (
      ticket.status !== "accepted" &&
      ticket.status !== "forcedAcceptedArtist"
    ) {
      throw new HttpError("Ticket must be accepted before payment", 400);
    }

    // Get revision fee amount from contract or milestone
    let feeAmount: number;
    if (ticket.milestoneIdx !== undefined && contract.milestones) {
      const milestone = contract.milestones[ticket.milestoneIdx];
      feeAmount = milestone.revisionPolicy?.fee || 0;
    } else {
      feeAmount = contract.revisionPolicy?.fee || 0;
    }

    if (feeAmount <= 0) {
      throw new HttpError("No fee required for this revision", 400);
    }

    if (feeAmount !== paymentAmount) {
      throw new HttpError("Payment does not match fee", 400);
    }

    // Handle payment based on method
    switch (paymentMethod) {
      case "wallet":
        // Check if user has sufficient funds
        const hasFunds = await checkSufficientFunds(userId, paymentAmount);
        if (!hasFunds) {
          throw new HttpError("Insufficient funds in wallet", 400);
        }
        break;

      case "card":
        // For card payments, we'd normally process the payment with a payment gateway
        // Here we'll simulate by adding funds to the wallet first, then proceeding
        await addFundsToWallet(userId, paymentAmount, session);
        break;

      case "combo":
        // Check if user has sufficient funds for wallet portion
        const hasPartialFunds = await checkSufficientFunds(
          userId,
          walletAmount
        );
        if (!hasPartialFunds) {
          throw new HttpError(
            "Insufficient funds in wallet for partial payment",
            400
          );
        }

        // Process secondary payment method for remaining amount
        if (secondaryMethod === "card" && remainingAmount !== undefined) {
          // Simulate card payment by adding the remaining amount to wallet
          await addFundsToWallet(userId, remainingAmount, session);
        } else {
          throw new HttpError("Unsupported secondary payment method", 400);
        }
        break;
    }

    // Create escrow transaction
    const transaction = await escrowService.createRevisionFeeTransaction(
      contractId,
      contract.clientId,
      feeAmount,
      `Revision fee for ticket ${ticketId}`,
      session
    );

    // Update ticket with payment info
    await ticketRepo.updateRevisionTicketStatus(
      ticketId,
      "paid",
      undefined,
      feeAmount,
      transaction._id,
      session
    );

    // Update contract runtime fees
    await contractService.updateContractFinance(contractId, feeAmount, session);

    await session.commitTransaction();
    return { ticket, transaction };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

//=============================================================================
// CHANGE TICKET OPERATIONS
//=============================================================================

/**
 * Create a change ticket for a contract using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the ticket (must be client)
 * @param form - FormData containing reason, deadline, description, options, and reference images
 * @returns The created change ticket
 * @throws HttpError if contract not found or user doesn't have permission
 */
export async function createChangeTicket(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract to verify user is the client
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    if (contract.clientId.toString() !== userId) {
      throw new HttpError("Only clients can create change requests", 403);
    }

    // Verify contract allows changes
    if (!contract.proposalSnapshot.listingSnapshot.allowContractChange) {
      throw new HttpError("This contract does not allow changes", 400);
    }

    // BLOCKING VALIDATION: Check for existing unresolved change tickets
    const existingChangeTickets = await getUnresolvedChangeTickets(contractId);
    if (existingChangeTickets.length > 0) {
      throw new HttpError(
        "There is already an active change request for this contract. Please wait until it is resolved before creating a new one.",
        409 // Conflict status code
      );
    }

    // BLOCKING VALIDATION: Check for unresolved resolution tickets
    const existingResolutionTickets = await getUnresolvedResolutionTickets(
      contractId
    );
    if (existingResolutionTickets.length > 0) {
      throw new HttpError(
        "There are active resolution cases for this contract. Please wait until they are resolved before creating a change request.",
        409
      );
    }

    // WARNING VALIDATION: Check for unresolved cancel tickets (not blocking, but warn in logs)
    const existingCancelTickets = await getUnresolvedCancelTickets(contractId);
    if (existingCancelTickets.length > 0) {
      console.warn(
        `Creating change ticket for contract ${contractId} while there are active cancellation requests. Change may not be processed if cancellation is approved.`
      );
    }

    // Get reason from form data
    const reason = form.get("reason")?.toString() || "";

    // Get change set details from form data
    const deadlineAtStr = form.get("deadlineAt")?.toString();
    const deadlineAt = deadlineAtStr ? new Date(deadlineAtStr) : undefined;

    const generalDescription = form.get("generalDescription")?.toString() || "";

    // Parse JSON options if provided
    let generalOptions: any;
    const generalOptionsStr = form.get("generalOptions")?.toString();
    if (generalOptionsStr) {
      try {
        generalOptions = JSON.parse(generalOptionsStr);
      } catch (err) {
        throw new HttpError("Invalid general options format", 400);
      }
    }

    let subjectOptions: any;
    const subjectOptionsStr = form.get("subjectOptions")?.toString();
    if (subjectOptionsStr) {
      try {
        subjectOptions = JSON.parse(subjectOptionsStr);
      } catch (err) {
        throw new HttpError("Invalid subject options format", 400);
      }
    }

    // Build change set
    const changeSet = {
      deadlineAt,
      generalDescription,
      generalOptions,
      subjectOptions,
      referenceImages: [] as string[], // Will be populated after upload
    };

    // Verify that the requested changes are allowed
    if (
      changeSet.deadlineAt &&
      !contract.proposalSnapshot.listingSnapshot?.changeable?.includes(
        "deadline"
      )
    ) {
      throw new HttpError(
        "Deadline changes are not allowed for this contract",
        400
      );
    }

    if (
      changeSet.generalOptions &&
      !contract.proposalSnapshot.listingSnapshot?.changeable?.includes(
        "generalOptions"
      )
    ) {
      throw new HttpError(
        "General option changes are not allowed for this contract",
        400
      );
    }

    if (
      changeSet.subjectOptions &&
      !contract.proposalSnapshot.listingSnapshot?.changeable?.includes(
        "subjectOptions"
      )
    ) {
      throw new HttpError(
        "Subject option changes are not allowed for this contract",
        400
      );
    }

    // Get image blobs from form data
    const existingReferenceImages = form
      .getAll("existingReferenceImages[]")
      .filter((v) => typeof v === "string") as string[];

    // Get image blobs from form data
    const referenceImageBlobs = form
      .getAll("referenceImages[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Upload reference images
    if (referenceImageBlobs && referenceImageBlobs.length > 0) {
      const uploadedReferenceImages = await uploadGalleryImagesToR2(
        referenceImageBlobs,
        userId,
        contractId.toString()
      );

      changeSet.referenceImages = [
        ...existingReferenceImages,
        ...uploadedReferenceImages,
      ];
    } else {
      changeSet.referenceImages = [...existingReferenceImages];
    }

    // Create change ticket
    const ticket = await ticketRepo.createChangeTicket(
      {
        contractId: toObjectId(contractId),
        reason,
        changeSet,
        isPaidChange: false, // Artist will determine this later
      },
      session
    );

    // Link ticket to contract
    await contractService.addTicketToContract(
      contractId,
      "change",
      ticket._id,
      session
    );

    await session.commitTransaction();
    return ticket;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Respond to a change ticket with various actions (accept, reject, propose, etc.)
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the change ticket
 * @param userId - ID of the user responding
 * @param response - Type of response (accept, reject, propose, forcedAcceptArtist, forcedAcceptClient)
 * @param paidFee - Optional fee amount for paid changes
 * @returns Object containing the updated ticket and action taken
 * @throws HttpError if ticket not found or user doesn't have permission
 */
export async function respondToChangeTicket(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  userId: string,
  response:
    | "accept"
    | "reject"
    | "propose"
    | "forcedAcceptArtist"
    | "forcedAcceptClient",
  paidFee?: number
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract and ticket
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    const ticket = await ticketRepo.findChangeTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Verify user is the artist or admin
    const isArtist = contract.artistId.toString() === userId;
    const isClient = contract.clientId.toString() === userId;
    const isAdmin = await isAdminById(userId);

    if (!isClient && !isArtist && !isAdmin) {
      throw new HttpError(
        "Only the artist or client can respond to change requests",
        403
      );
    }

    // Update ticket status based on response
    let newStatus: any;
    const updates: any = {};

    if (response === "accept" && isArtist) {
      newStatus = "acceptedArtist";
      if (paidFee !== undefined && paidFee > 0) {
        updates.isPaidChange = true;
        updates.paidFee = paidFee;
        newStatus = "pendingClient"; // Client needs to pay
      }
    } else if (response === "reject" && isArtist) {
      newStatus = "rejectedArtist";
    } else if (response === "reject" && isClient) {
      newStatus = "rejectedClient";
    } else if (response === "propose") {
      if (paidFee === undefined || paidFee <= 0) {
        throw new HttpError("Fee amount is required for fee proposal", 400);
      }
      newStatus = "pendingClient";
      updates.isPaidChange = true;
      updates.paidFee = paidFee;
    } else if (response === "forcedAcceptArtist" && isAdmin) {
      newStatus = "forcedAcceptedArtist";
      if (paidFee !== undefined && paidFee > 0) {
        updates.isPaidChange = true;
        updates.paidFee = paidFee;
      }
    } else if (response === "forcedAcceptClient" && isAdmin) {
      newStatus = "forcedAcceptedClient";
      if (paidFee !== undefined && paidFee > 0) {
        updates.isPaidChange = true;
        updates.paidFee = paidFee;
      }
    } else {
      throw new HttpError("Invalid response", 400);
    }

    const updatedTicket = await ticketRepo.updateChangeTicketStatus(
      ticketId,
      newStatus,
      updates,
      session
    );

    // If accepted with no fee, apply changes immediately
    if (newStatus === "acceptedArtist" && !updates.isPaidChange) {
      await applyContractChanges(contractId, ticket.changeSet, session);
    }

    await session.commitTransaction();
    return { ticket: updatedTicket, action: response };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Pay for a change ticket that requires payment
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the change ticket
 * @param userId - ID of the user paying (must be client)
 * @param paymentMethod - Method of payment (wallet, card, or combo)
 * @param walletAmount - Amount to pay from wallet
 * @param paymentAmount - Total payment amount
 * @param secondaryMethod - Secondary payment method for combo
 * @param remainingAmount - Amount to pay with secondary method
 * @returns Object containing ticket and transaction details
 * @throws HttpError if ticket not found or payment invalid
 */
export async function payChangeFee(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  userId: string,
  paymentMethod: "wallet" | "card" | "combo",
  walletAmount: number,
  paymentAmount: number,
  secondaryMethod?: "card" | undefined,
  remainingAmount?: number
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract and ticket
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    const ticket = await ticketRepo.findChangeTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Verify user is the client
    if (contract.clientId.toString() !== userId) {
      throw new HttpError("Only the client can pay for changes", 403);
    }

    // Verify ticket is in pendingClient status and isPaidChange is true
    if (ticket.status !== "pendingClient" || !ticket.isPaidChange) {
      throw new HttpError("Ticket is not awaiting payment", 400);
    }

    if (!ticket.paidFee || ticket.paidFee <= 0) {
      throw new HttpError("No fee amount set for this ticket", 400);
    }

    if (ticket.paidFee !== paymentAmount) {
      throw new HttpError("Payment does not match fee", 400);
    }

    // Handle payment based on method
    switch (paymentMethod) {
      case "wallet":
        // Check if user has sufficient funds
        const hasFunds = await checkSufficientFunds(userId, paymentAmount);
        if (!hasFunds) {
          throw new HttpError("Insufficient funds in wallet", 400);
        }
        break;

      case "card":
        // For card payments, we'd normally process the payment with a payment gateway
        // Here we'll simulate by adding funds to the wallet first, then proceeding
        await addFundsToWallet(userId, paymentAmount, session);
        break;

      case "combo":
        // Check if user has sufficient funds for wallet portion
        const hasPartialFunds = await checkSufficientFunds(
          userId,
          walletAmount
        );
        if (!hasPartialFunds) {
          throw new HttpError(
            "Insufficient funds in wallet for partial payment",
            400
          );
        }

        // Process secondary payment method for remaining amount
        if (secondaryMethod === "card" && remainingAmount !== undefined) {
          // Simulate card payment by adding the remaining amount to wallet
          await addFundsToWallet(userId, remainingAmount, session);
        } else {
          throw new HttpError("Unsupported secondary payment method", 400);
        }
        break;
    }

    // Create escrow transaction
    const transaction = await escrowService.createChangeFeeTransaction(
      contractId,
      contract.clientId,
      ticket.paidFee,
      `Change fee for ticket ${ticketId}`,
      session
    );

    // Update ticket
    const updates = {
      escrowTxnId: transaction._id,
      contractVersionBefore: contract.contractVersion,
    };

    await ticketRepo.updateChangeTicketStatus(
      ticketId,
      "paid",
      updates,
      session
    );

    // Apply contract changes
    const versionAfter = await applyContractChanges(
      contractId,
      ticket.changeSet,
      session
    );

    // Update ticket with version after
    await ticketRepo.updateChangeTicketStatus(
      ticketId,
      "paid",
      {
        contractVersionAfter: versionAfter,
      },
      session
    );

    // Update contract runtime fees
    await contractService.updateContractFinance(
      contractId,
      ticket.paidFee,
      session
    );

    await session.commitTransaction();
    return { ticket, transaction };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Apply contract changes from a change ticket
 *
 * @param contractId - ID of the contract to change
 * @param changeSet - Set of changes to apply to the contract
 * @param session - Optional MongoDB session for transaction
 * @returns The new contract version number after changes
 * @throws Error if contract not found
 */
async function applyContractChanges(
  contractId: string | ObjectId,
  changeSet: any,
  session?: ClientSession
): Promise<number> {
  // Get the contract
  const contract = await contractRepo.findContractById(contractId, { session });
  if (!contract) {
    throw new Error("Contract not found");
  }

  // Create the new terms object
  const newTerms = {
    generalDescription: changeSet.generalDescription,
    referenceImages: changeSet.referenceImages,
    generalOptions: changeSet.generalOptions,
    subjectOptions: changeSet.subjectOptions,
  };

  // If deadline change is included, update it
  if (changeSet.deadlineAt) {
    // Calculate new grace period
    const newGraceEndsAt = new Date(changeSet.deadlineAt);
    newGraceEndsAt.setDate(
      newGraceEndsAt.getDate() +
        (contract.proposalSnapshot.listingSnapshot.graceDays || 7)
    );

    await contractRepo.updateContractDeadline(
      contractId,
      changeSet.deadlineAt,
      newGraceEndsAt,
      session
    );
  }

  // Update contract terms
  const updatedContract = await contractRepo.updateContractTerms(
    contractId,
    newTerms,
    session
  );

  return updatedContract!.contractVersion;
}

//=============================================================================
// RESOLUTION-ADJACENT TICKET OPERATIONS
//=============================================================================

/**
 * Apply resolution to a cancel ticket
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the cancel ticket
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if ticket not found
 */
async function applyCancelResolution(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  const ticket = await ticketRepo.findCancelTicketById(ticketId, session);
  if (!ticket) {
    throw new Error("Cancel ticket not found");
  }

  if (decision === "favorClient") {
    // Force acceptance of cancellation
    await ticketRepo.updateCancelTicketStatus(
      ticketId,
      "forcedAccepted",
      session
    );
  } else {
    // Reject cancellation in favor of artist
    await ticketRepo.updateCancelTicketStatus(ticketId, "rejected", session);
  }
}

/**
 * Apply resolution to a revision ticket
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the revision ticket
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if ticket not found
 */
async function applyRevisionResolution(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  const ticket = await ticketRepo.findRevisionTicketById(ticketId, session);
  if (!ticket) {
    throw new Error("Revision ticket not found");
  }

  if (decision === "favorClient") {
    // Force artist to accept revision
    await ticketRepo.updateRevisionTicketStatus(
      ticketId,
      "forcedAcceptedArtist",
      undefined,
      undefined,
      undefined,
      session
    );
  } else {
    // Reject revision in favor of artist
    await ticketRepo.updateRevisionTicketStatus(
      ticketId,
      "rejected",
      "Rejected through admin resolution in favor of artist",
      undefined,
      undefined,
      session
    );
  }
}

/**
 * Apply resolution to a change ticket
 *
 * @param contractId - ID of the contract
 * @param ticketId - ID of the change ticket
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if ticket not found
 */
async function applyChangeResolution(
  contractId: string | ObjectId,
  ticketId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  const ticket = await ticketRepo.findChangeTicketById(ticketId, session);
  if (!ticket) {
    throw new Error("Change ticket not found");
  }

  if (decision === "favorClient") {
    // Force artist to accept change
    if (ticket.status === "pendingArtist") {
      await ticketRepo.updateChangeTicketStatus(
        ticketId,
        "forcedAcceptedArtist",
        { isPaidChange: false }, // No fee for forced acceptance
        session
      );

      // Apply contract changes
      await applyContractChanges(contractId, ticket.changeSet, session);
    } else if (ticket.status === "pendingClient") {
      // If artist proposed a fee but admin favors client, force client acceptance but without fee
      await ticketRepo.updateChangeTicketStatus(
        ticketId,
        "forcedAcceptedClient",
        { isPaidChange: false }, // Remove fee
        session
      );

      // Apply contract changes
      await applyContractChanges(contractId, ticket.changeSet, session);
    }
  } else {
    // Favor artist - reject the change or enforce fee
    if (ticket.status === "pendingArtist") {
      await ticketRepo.updateChangeTicketStatus(
        ticketId,
        "rejectedArtist",
        {},
        session
      );
    } else if (ticket.status === "pendingClient" && ticket.isPaidChange) {
      // If artist proposed a fee, enforce it
      await ticketRepo.updateChangeTicketStatus(
        ticketId,
        "forcedAcceptedClient",
        {},
        session
      );
    }
  }
}

/**
 * Apply resolution to a final upload
 *
 * @param contractId - ID of the contract
 * @param uploadId - ID of the final upload
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if upload not found
 */
async function applyFinalUploadResolution(
  contractId: string | ObjectId,
  uploadId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  const upload = await uploadRepo.findFinalUploadById(uploadId);
  if (!upload) {
    throw new Error("Final upload not found");
  }

  if (decision === "favorClient") {
    // Reject upload in favor of client
    await uploadRepo.updateFinalUploadStatus(uploadId, "rejected", session);
  } else {
    // Force acceptance in favor of artist
    await uploadRepo.updateFinalUploadStatus(
      uploadId,
      "forcedAccepted",
      session
    );

    // If this was a completion upload, process contract completion
    if (upload.workProgress === 100) {
      // Get the contract to check if it's late
      const contract = await contractRepo.findContractById(contractId, {
        session,
      });
      if (!contract) {
        throw new Error("Contract not found");
      }

      await contractService.processContractCompletion(
        contractId,
        contractService.isContractLate(contract)
      );
    }
    // If this was a cancellation upload, process cancellation
    else {
      // Get the contract and relevant information for cancellation
      const contract = await contractRepo.findContractById(contractId, {
        session,
      });
      if (!contract) {
        throw new Error("Contract not found");
      }

      // Check if this is related to a cancel ticket
      if (upload.cancelTicketId) {
        // Get the cancel ticket to determine who initiated the cancellation
        const cancelTicket = await ticketRepo.findCancelTicketById(
          upload.cancelTicketId
        );
        if (cancelTicket) {
          // Process the cancellation based on who requested it and if it's late
          await contractService.processContractCancellation(
            contractId,
            cancelTicket.requestedBy, // "client" or "artist"
            upload.workProgress,
            contractService.isContractLate(contract)
          );
        } else {
          // If ticket not found for some reason, default to artist-initiated cancellation
          // since the artist is the one who uploaded the partial work
          await contractService.processContractCancellation(
            contractId,
            "artist",
            upload.workProgress,
            contractService.isContractLate(contract)
          );
        }
      } else {
        // If no cancel ticket is associated (unusual case),
        // treat as artist-initiated cancellation
        await contractService.processContractCancellation(
          contractId,
          "artist",
          upload.workProgress,
          contractService.isContractLate(contract)
        );
      }
    }
  }
}

/**
 * Apply resolution to a progress milestone upload
 *
 * @param contractId - ID of the contract
 * @param uploadId - ID of the progress milestone upload
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if upload not found
 */
async function applyProgressMilestoneResolution(
  contractId: string | ObjectId,
  uploadId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  const upload = await uploadRepo.findProgressUploadMilestoneById(
    uploadId,
    session
  );
  if (!upload) {
    throw new Error("Progress milestone upload not found");
  }

  if (!upload.isFinal) {
    throw new Error("Only final milestone uploads can have resolutions");
  }

  if (decision === "favorClient") {
    // Reject upload in favor of client
    await uploadRepo.updateMilestoneUploadStatus(uploadId, "rejected", session);
  } else {
    // Force acceptance in favor of artist
    await uploadRepo.updateMilestoneUploadStatus(
      uploadId,
      "forcedAccepted",
      session
    );

    // Update milestone status
    await contractService.updateMilestoneStatus(
      contractId,
      upload.milestoneIdx,
      "accepted",
      uploadId,
      session
    );
  }
}

/**
 * Apply resolution to a revision upload
 *
 * @param contractId - ID of the contract
 * @param uploadId - ID of the revision upload
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if upload not found
 */
async function applyRevisionUploadResolution(
  contractId: string | ObjectId,
  uploadId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  const upload = await uploadRepo.findRevisionUploadById(uploadId, session);
  if (!upload) {
    throw new Error("Revision upload not found");
  }

  if (decision === "favorClient") {
    // Reject upload in favor of client
    await uploadRepo.updateRevisionUploadStatus(uploadId, "rejected", session);
  } else {
    // Force acceptance in favor of artist
    await uploadRepo.updateRevisionUploadStatus(
      uploadId,
      "forcedAccepted",
      session
    );

    // Mark the revision ticket as resolved
    const ticket = await ticketRepo.findRevisionTicketById(
      upload.revisionTicketId,
      session
    );
    if (ticket && !ticket.resolved) {
      await ticketRepo.updateRevisionTicketStatus(
        upload.revisionTicketId,
        ticket.status, // Keep current status
        undefined,
        undefined,
        undefined,
        session
      );
    }
  }
}

/**
 * Apply resolution decision to the target object
 *
 * @param contractId - ID of the contract
 * @param targetType - Type of the target (cancelTicket, revisionTicket, etc.)
 * @param targetId - ID of the target object
 * @param decision - Decision to favor client or artist
 * @param session - Optional MongoDB session for transaction
 * @throws Error if target type is unknown
 */
async function applyResolutionDecision(
  contractId: string | ObjectId,
  targetType: string,
  targetId: string | ObjectId,
  decision: "favorClient" | "favorArtist",
  session?: ClientSession
): Promise<void> {
  switch (targetType) {
    case "cancelTicket":
      await applyCancelResolution(contractId, targetId, decision, session);
      break;
    case "revisionTicket":
      await applyRevisionResolution(contractId, targetId, decision, session);
      break;
    case "changeTicket":
      await applyChangeResolution(contractId, targetId, decision, session);
      break;
    case "finalUpload":
      await applyFinalUploadResolution(contractId, targetId, decision, session);
      break;
    case "progressMilestoneUpload":
      await applyProgressMilestoneResolution(
        contractId,
        targetId,
        decision,
        session
      );
      break;
    case "revisionUpload":
      await applyRevisionUploadResolution(
        contractId,
        targetId,
        decision,
        session
      );
      break;
    default:
      throw new Error(`Unknown target type: ${targetType}`);
  }
}

/**
 * Validate that the target exists and the user can create a resolution for it
 *
 * @param contract - The contract object
 * @param targetType - Type of the target (cancel, revision, final, etc.)
 * @param targetId - ID of the target object
 * @param submittedBy - Role of the user submitting (client or artist)
 * @param session - Optional MongoDB session for transaction
 * @returns Object indicating if the request is valid with optional error message
 */
async function validateResolutionTicketRequest(
  contract: IContract,
  targetType: string,
  targetId: string | ObjectId,
  submittedBy: "client" | "artist",
  session?: ClientSession
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check that the target exists based on type
    switch (targetType) {
      case "cancelTicket":
        const cancelTicket = await ticketRepo.findCancelTicketById(
          targetId,
          session
        );
        if (!cancelTicket)
          return { valid: false, error: "Cancel ticket not found" };
        break;

      case "revisionTicket":
        const revisionTicket = await ticketRepo.findRevisionTicketById(
          targetId,
          session
        );
        if (!revisionTicket)
          return { valid: false, error: "Revision ticket not found" };
        break;

      case "changeTicket":
        const changeTicket = await ticketRepo.findChangeTicketById(
          targetId,
          session
        );
        if (!changeTicket)
          return { valid: false, error: "Change ticket not found" };
        break;

      case "finalUpload":
        const finalUpload = await uploadRepo.findFinalUploadById(
          targetId,
          session
        );
        if (!finalUpload)
          return { valid: false, error: "Final upload not found" };
        break;

      case "progressMilestoneUpload":
        const progressUpload = await uploadRepo.findProgressUploadMilestoneById(
          targetId,
          session
        );
        if (!progressUpload)
          return { valid: false, error: "Progress milestone upload not found" };
        break;

      case "revisionUpload":
        const revisionUpload = await uploadRepo.findRevisionUploadById(
          targetId,
          session
        );
        if (!revisionUpload)
          return { valid: false, error: "Revision upload not found" };
        break;

      default:
        return { valid: false, error: "Invalid target type" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error` };
  }
}

//=============================================================================
// RESOLUTION TICKET OPERATIONS
//=============================================================================

/**
 * Create a resolution ticket for resolving disputes using FormData
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user creating the ticket (must be client or artist)
 * @param form - FormData containing targetType, targetId, description, and proof images
 * @returns The created resolution ticket with message
 * @throws HttpError if contract not found or validation fails
 */
export async function createResolutionTicket(
  contractId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the contract to verify user is part of it
    const contract = await contractRepo.findContractById(contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Determine if user is client or artist
    const isClient = contract.clientId.toString() === userId;
    const isArtist = contract.artistId.toString() === userId;

    if (!isClient && !isArtist) {
      throw new HttpError(
        "Not authorized to create resolution for this contract",
        403
      );
    }

    // Get target info from form data
    const targetType = form.get("targetType")?.toString() as
      | "cancelTicket" // CancelTicket
      | "revisionTicket" // RevisionTicket
      | "changeTicket" // ChangeTicket
      | "finalUpload" // FinalUpload
      | "progressMilestoneUpload" // ProgressUploadMilestone
      | "revisionUpload"; // RevisionUpload

    if (
      !targetType ||
      ![
        "cancelTicket",
        "revisionTicket",
        "changeTicket",
        "finalUpload",
        "progressMilestoneUpload",
        "revisionUpload",
      ].includes(targetType)
    ) {
      throw new HttpError("Valid target type is required", 400);
    }

    const targetId = form.get("targetId")?.toString();
    if (!targetId) {
      throw new HttpError("Target ID is required", 400);
    }

    const description = form.get("description")?.toString() || "";
    if (!description || description.trim().length < 10) {
      throw new HttpError(
        "A detailed description (at least 10 characters) is required",
        400
      );
    }

    // Determine if user is client or artist
    const submittedBy = isClient ? "client" : "artist";

    // Validate the resolution ticket request
    const validation = await validateResolutionTicketRequest(
      contract,
      targetType,
      targetId,
      submittedBy,
      session
    );

    if (!validation.valid) {
      throw new HttpError(
        validation.error || "Invalid resolution ticket request",
        400
      );
    }

    // Check for existing open resolutions for this target
    const hasExistingResolution = await hasUnresolvedResolutionTicket(
      contractId
    );

    if (hasExistingResolution) {
      throw new HttpError(
        "A resolution ticket already exists for this item. Please use the existing resolution.",
        400
      );
    }

    // Get image blobs from form data
    const proofImageBlobs = form
      .getAll("proofImages[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Require at least one proof image for evidence
    if (!proofImageBlobs.length) {
      throw new HttpError(
        "At least one proof image is required to support your resolution request",
        400
      );
    }

    // Upload proof images
    let proofImageUrls: string[] = [];
    if (proofImageBlobs && proofImageBlobs.length > 0) {
      proofImageUrls = await uploadGalleryImagesToR2(
        proofImageBlobs,
        userId,
        contractId.toString()
      );
    }

    // Create resolution ticket
    const ticket = await ticketRepo.createResolutionTicket(
      {
        contractId,
        submittedBy,
        submittedById: userId,
        targetType,
        targetId,
        description,
        proofImages: proofImageUrls,
      },
      session
    );

    // Link ticket to contract
    await contractService.addTicketToContract(
      contractId,
      "resolution",
      ticket._id,
      session
    );

    await session.commitTransaction();

    // Include additional context in response
    return {
      ...ticket.toObject(),
      message:
        "Resolution ticket created successfully. The other party has 24 hours to respond.",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Submit counterproof for a resolution ticket using FormData
 *
 * @param ticketId - ID of the resolution ticket
 * @param userId - ID of the user submitting counterproof (must be counterparty)
 * @param form - FormData containing counterDescription and counterProofImages
 * @returns The updated resolution ticket
 * @throws HttpError if ticket not found or user doesn't have permission
 */
export async function submitCounterproof(
  ticketId: string | ObjectId,
  userId: string,
  form: FormData
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the ticket
    const ticket = await ticketRepo.findResolutionTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Get the contract to verify user is the counterparty
    const contract = await contractRepo.findContractById(ticket.contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    const isClient = contract.clientId.toString() === userId;
    const isArtist = contract.artistId.toString() === userId;

    if (!isClient && !isArtist) {
      throw new HttpError("Not authorized to submit counterproof", 403);
    }

    // Verify user is the counterparty
    const expectedCounterparty =
      ticket.submittedBy === "client" ? "artist" : "client";
    const actualRole = isClient ? "client" : "artist";

    if (actualRole !== expectedCounterparty) {
      throw new HttpError("Only the counterparty can submit counterproof", 403);
    }

    // Verify ticket is still open and not past counter deadline
    if (ticket.status !== "open") {
      throw new HttpError(
        "This ticket is no longer accepting counterproof",
        400
      );
    }

    if (new Date(ticket.counterExpiresAt) < new Date()) {
      throw new HttpError(
        "The deadline for submitting counterproof has passed",
        400
      );
    }

    // Get counter description from form data
    const counterDescription = form.get("counterDescription")?.toString() || "";

    // Get image blobs from form data
    const counterProofImageBlobs = form
      .getAll("counterProofImages[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Upload counterproof images
    let counterProofImageUrls: string[] = [];
    if (counterProofImageBlobs && counterProofImageBlobs.length > 0) {
      counterProofImageUrls = await uploadGalleryImagesToR2(
        counterProofImageBlobs,
        userId,
        ticket.contractId.toString()
      );
    }

    // Submit counterproof
    const updatedTicket = await ticketRepo.submitCounterproof(
      ticketId,
      counterDescription,
      counterProofImageUrls,
      session
    );

    await session.commitTransaction();
    return updatedTicket;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Resolve a dispute (admin only)
 *
 * @param ticketId - ID of the resolution ticket
 * @param adminId - ID of the admin resolving the dispute
 * @param decision - Decision to favor client or artist
 * @param resolutionNote - Admin note explaining the resolution
 * @returns The resolved ticket
 * @throws HttpError if ticket not found or user is not admin
 */
export async function resolveDispute(
  ticketId: string | ObjectId,
  adminId: string,
  decision: "favorClient" | "favorArtist",
  resolutionNote: string
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify user is admin
    const isAdmin = await isAdminById(adminId);
    if (!isAdmin) {
      throw new HttpError("Only administrators can resolve disputes", 403);
    }

    // Get the ticket
    const ticket = await ticketRepo.findResolutionTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Ticket not found", 404);
    }

    // Verify ticket is in awaiting review status
    if (ticket.status !== "awaitingReview") {
      throw new HttpError("This ticket is not ready for resolution", 400);
    }

    // Resolve the ticket
    const resolvedTicket = await ticketRepo.resolveTicket(
      ticketId,
      decision,
      resolutionNote,
      adminId,
      session
    );

    // Apply the decision to the target object based on the target type
    await applyResolutionDecision(
      ticket.contractId,
      ticket.targetType,
      ticket.targetId,
      decision,
      session
    );

    await session.commitTransaction();
    return resolvedTicket;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Cancel a resolution ticket if the underlying issue is resolved
 *
 * @param ticketId - ID of the resolution ticket
 * @param userId - ID of the user cancelling (must be submitter)
 * @returns The cancelled ticket
 * @throws HttpError if ticket not found or user doesn't have permission
 */
export async function cancelResolutionTicket(
  ticketId: string | ObjectId,
  userId: string
): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Get the ticket
    const ticket = await ticketRepo.findResolutionTicketById(ticketId, session);
    if (!ticket) {
      throw new HttpError("Resolution ticket not found", 404);
    }

    // Get the contract
    const contract = await contractRepo.findContractById(ticket.contractId, {
      session,
    });
    if (!contract) {
      throw new HttpError("Contract not found", 404);
    }

    // Check if the user is either the submitter or the counterparty
    const isSubmitter = ticket.submittedById.toString() === userId;
    const isClient = contract.clientId.toString() === userId;
    const isArtist = contract.artistId.toString() === userId;
    const isCounterparty =
      (ticket.submittedBy === "client" && isArtist) ||
      (ticket.submittedBy === "artist" && isClient);

    if (!isSubmitter) {
      throw new HttpError("Not authorized to cancel this resolution", 403);
    }

    if (isCounterparty) {
      throw new HttpError("Only submitter can cancel this ticket", 403);
    }

    // Verify ticket is still open or in awaiting review
    if (ticket.status !== "open" && ticket.status !== "awaitingReview") {
      throw new HttpError(
        "This resolution ticket cannot be cancelled because it's already resolved",
        400
      );
    }

    // Cancel the ticket
    const cancelledTicket = await ticketRepo.cancelResolutionTicket(
      ticketId,
      session
    );

    await session.commitTransaction();
    return cancelledTicket;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

//=============================================================================
// TICKET RETRIEVAL FUNCTIONS
//=============================================================================

/**
 * Get all resolution tickets (admin view)
 *
 * @param filters - Optional filters for status and targetType
 * @returns Array of resolution tickets
 */
export async function getAllResolutionTickets(filters?: {
  status?: string[];
  targetType?: string[];
}): Promise<any[]> {
  return ticketRepo.findAllResolutionTickets(filters);
}

/**
 * Get resolution tickets for a contract
 *
 * @param contractId - ID of the contract
 * @returns Array of resolution tickets
 */
export async function getResolutionTicketsByContract(
  contractId: string | ObjectId
): Promise<any[]> {
  return ticketRepo.findResolutionTicketsByContract(contractId);
}

/**
 * Get resolution tickets for a user
 *
 * @param userId - ID of the user
 * @param role - Filter by role (submitter, counterparty, or both)
 * @returns Array of resolution tickets
 */
export async function getResolutionTicketsByUser(
  userId: string | ObjectId,
  role: "submitter" | "counterparty" | "both" = "both"
): Promise<any[]> {
  return ticketRepo.findResolutionTicketsByUser(userId, role);
}

/**
 * Find active cancellation tickets for a contract
 *
 * @param contractId - ID of the contract
 * @param userId - ID of the user (must be client or artist of the contract)
 * @returns Array of active cancel tickets
 * @throws HttpError if contract not found or user doesn't have permission
 */
export async function findActiveCancelTickets(
  contractId: string | ObjectId,
  userId: string
): Promise<ICancelTicket[]> {
  await connectDB();

  // Verify user has access to the contract
  const contract = await contractRepo.findContractById(contractId);
  if (!contract) {
    throw new HttpError("Contract not found", 404);
  }

  // Check if user is artist or client of the contract
  if (
    contract.artistId.toString() !== userId &&
    contract.clientId.toString() !== userId
  ) {
    throw new HttpError("Unauthorized access to contract", 403);
  }

  // Call repository function to find active tickets
  return ticketRepo.findActiveCancelTickets(contractId);
}

/**
 * Get a revision ticket by ID
 *
 * @param id - ID of the revision ticket
 * @returns The revision ticket or null if not found
 */
export async function getRevisionTicketById(
  id: string
): Promise<IRevisionTicket | null> {
  return ticketRepo.findRevisionTicketById(id);
}

/**
 * Get a cancel ticket by ID
 *
 * @param id - ID of the cancel ticket
 * @returns The cancel ticket or null if not found
 */
export async function getCancelTicketById(
  id: string
): Promise<ICancelTicket | null> {
  return ticketRepo.findCancelTicketById(id);
}

/**
 * Get a change ticket by ID
 *
 * @param id - ID of the change ticket
 * @returns The change ticket or null if not found
 */
export async function getChangeTicketById(
  id: string
): Promise<IChangeTicket | null> {
  return ticketRepo.findChangeTicketById(id);
}

//=============================================================================
// UNRESOLVED TICKET FUNCTIONS
//=============================================================================

/**
 * Find unresolved cancel tickets
 *
 * @param contractId - Contract ID to check
 * @returns Array of unresolved cancel tickets
 */
export async function getUnresolvedCancelTickets(
  contractId: string | ObjectId
): Promise<ICancelTicket[]> {
  await connectDB();

  const currentTime = new Date();

  const tickets = await ticketRepo.findCancelTicketsByContract(contractId);
  return tickets
    .filter(
      (ticket) =>
        ticket.expiresAt !== undefined && ticket.expiresAt > currentTime // Compare expiration date with current time
    )
    .filter(
      (ticket) => ticket.status === "pending" || ticket.status === "disputed"
    );
}

/**
 * Find unresolved change tickets
 *
 * @param contractId - Contract ID to check
 * @returns Array of unresolved change tickets
 */
export async function getUnresolvedChangeTickets(
  contractId: string | ObjectId
): Promise<IChangeTicket[]> {
  await connectDB();

  const currentTime = new Date();

  const tickets = await ticketRepo.findChangeTicketsByContract(contractId);
  return tickets
    .filter(
      (ticket) => ticket.expiresAt > currentTime // Compare expiration date with current time
    )
    .filter(
      (ticket) =>
        ticket.status === "pendingArtist" ||
        ticket.status === "pendingClient" ||
        (ticket.status === "acceptedArtist" && ticket.isPaidChange) ||
        (ticket.status === "forcedAcceptedArtist" && ticket.isPaidChange) ||
        ticket.status === "rejectedClient"
    );
}

/**
 * Find unresolved resolution tickets
 *
 * @param contractId - Contract ID to check
 * @returns Array of unresolved resolution tickets
 */
export async function getUnresolvedResolutionTickets(
  contractId: string | ObjectId
): Promise<IResolutionTicket[]> {
  await connectDB();

  const tickets = await ticketRepo.findResolutionTicketsByContract(contractId);
  return tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "awaitingReview"
  );
}

/**
 * Find unresolved revision tickets
 *
 * @param contractId - Contract ID to check
 * @returns Array of unresolved revision tickets
 */
export async function getUnresolvedRevisionTickets(
  contractId: string | ObjectId
): Promise<IRevisionTicket[]> {
  await connectDB();

  const currentTime = new Date();

  const tickets = await ticketRepo.findRevisionTicketsByContract(contractId);
  return tickets
    .filter(
      (ticket) => ticket.expiresAt > currentTime // Compare expiration date with current time
    )
    .filter(
      (ticket) =>
        ticket.status === "disputed" ||
        (ticket.status === "forcedAcceptedArtist" && ticket.paidFee) ||
        (ticket.status === "accepted" && ticket.paidFee) ||
        ticket.status === "pending"
    );
}

/**
 * Find revision tickets that need an upload
 *
 * @param contractId - Contract ID to check
 * @returns Array of revision tickets that need uploads
 */
export async function getUnfinishedRevisionTickets(
  contractId: string | ObjectId
): Promise<IRevisionTicket[]> {
  await connectDB();

  const currentTime = new Date();
  const tickets = await ticketRepo.findRevisionTicketsByContract(contractId);
  const result: IRevisionTicket[] = [];

  for (const ticket of tickets) {
    // Check if ticket is in a state requiring upload
    if (
      ticket.status === "paid" ||
      (ticket.status === "forcedAcceptedArtist" &&
        ticket.paidFee === undefined) ||
      (ticket.status === "accepted" && ticket.paidFee === undefined)
    ) {
      // Look for an accepted upload for this ticket
      const uploads = await uploadRepo.findRevisionUploadsByTicket(ticket._id);
      const hasAcceptedUpload = uploads.some(
        (upload) =>
          upload.status === "accepted" || upload.status === "forcedAccepted"
      );

      // Check if any uploads are expired but not accepted/forcedAccepted
      const hasExpiredUpload = uploads.some(
        (upload) =>
          upload.expiresAt <= currentTime &&
          upload.status !== "accepted" &&
          upload.status !== "forcedAccepted"
      );

      // If no accepted upload found and no expired uploads, this is unfinished
      if (!hasAcceptedUpload && !hasExpiredUpload) {
        result.push(ticket);
      }
    }
  }

  return result;
}

/**
 * Find cancel tickets that need a final upload
 *
 * @param contractId - Contract ID to check
 * @returns Array of cancel tickets that need final uploads
 */
export async function getUnfinishedCancelTickets(
  contractId: string | ObjectId
): Promise<ICancelTicket[]> {
  await connectDB();

  const currentTime = new Date();
  const tickets = await ticketRepo.findCancelTicketsByContract(contractId);
  const result: ICancelTicket[] = [];

  for (const ticket of tickets) {
    // Check if ticket is in a state requiring upload
    if (ticket.status === "accepted" || ticket.status === "forcedAccepted") {
      // Look for an accepted final upload that references this ticket
      const uploads = await uploadRepo.findFinalUploadsByContract(contractId);

      // Check for accepted uploads or expired uploads
      const validUpload = uploads.some(
        (upload) =>
          // Either accepted/forcedAccepted uploads
          (upload.status === "accepted" ||
            upload.status === "forcedAccepted" ||
            // Or uploads that have passed their expiry date (considered valid)
            (upload.expiresAt && upload.expiresAt <= currentTime)) &&
          upload.cancelTicketId &&
          upload.cancelTicketId.toString() === ticket._id.toString()
      );

      // If no valid upload found, this is unfinished
      if (!validUpload) {
        result.push(ticket);
      }
    }
  }

  return result;
}

//=============================================================================
// HELPER FUNCTIONS
//=============================================================================

/**
 * Check if there are unresolved cancel tickets
 *
 * @param contractId - Contract ID to check
 * @returns True if there are unresolved cancel tickets
 */
export async function hasUnresolvedCancelTicket(
  contractId: string | ObjectId
): Promise<boolean> {
  const tickets = await getUnresolvedCancelTickets(contractId);
  return tickets.length > 0;
}

/**
 * Check if there are unresolved change tickets
 *
 * @param contractId - Contract ID to check
 * @returns True if there are unresolved change tickets
 */
export async function hasUnresolvedChangeTicket(
  contractId: string | ObjectId
): Promise<boolean> {
  const tickets = await getUnresolvedChangeTickets(contractId);
  return tickets.length > 0;
}

/**
 * Check if there are unresolved resolution tickets
 *
 * @param contractId - Contract ID to check
 * @returns True if there are unresolved resolution tickets
 */
export async function hasUnresolvedResolutionTicket(
  contractId: string | ObjectId
): Promise<boolean> {
  const tickets = await getUnresolvedResolutionTickets(contractId);
  return tickets.length > 0;
}

/**
 * Check if there are unresolved revision tickets
 *
 * @param contractId - Contract ID to check
 * @returns True if there are unresolved revision tickets
 */
export async function hasUnresolvedRevisionTicket(
  contractId: string | ObjectId
): Promise<boolean> {
  const tickets = await getUnresolvedRevisionTickets(contractId);
  return tickets.length > 0;
}

/**
 * Check if there are revision tickets that need uploads
 *
 * @param contractId - Contract ID to check
 * @returns True if there are revision tickets that need uploads
 */
export async function hasUnfinishedRevisionTicket(
  contractId: string | ObjectId
): Promise<boolean> {
  const tickets = await getUnfinishedRevisionTickets(contractId);
  return tickets.length > 0;
}

/**
 * Check if there are cancel tickets that need final uploads
 *
 * @param contractId - Contract ID to check
 * @returns True if there are cancel tickets that need uploads
 */
export async function hasUnfinishedCancelTicket(
  contractId: string | ObjectId
): Promise<boolean> {
  const tickets = await getUnfinishedCancelTickets(contractId);
  return tickets.length > 0;
}

/**
 * Check if revision is allowed based on contract policy
 *
 * @param contract - The contract to check
 * @param milestoneIdx - Optional milestone index for milestone-based revisions
 * @returns Object with allowance info, message, and fee details
 */
async function checkRevisionAllowed(
  contract: IContract,
  milestoneIdx?: number
): Promise<{
  allowed: boolean;
  message?: string;
  isPaid?: boolean;
  fee?: number;
}> {
  // Check revision type
  if (contract.proposalSnapshot.listingSnapshot.revisions?.type === "none") {
    return {
      allowed: false,
      message: "This contract does not allow revisions",
    };
  }

  if (
    contract.proposalSnapshot.listingSnapshot.revisions?.type === "milestone" &&
    milestoneIdx !== undefined
  ) {
    if (!contract.milestones || !contract.milestones[milestoneIdx]) {
      return { allowed: false, message: "Milestone not found" };
    }

    const milestone = contract.milestones[milestoneIdx];
    const policy = milestone.revisionPolicy;

    if (!policy) {
      return { allowed: false, message: "Milestone policy not found" };
    }

    // Count revisions done for this milestone
    const revisionsDone = milestone.revisionDone || 0;

    // Check if limit reached
    if (policy.limit && revisionsDone >= policy.free) {
      // Check if extra is allowed
      if (!policy.extraAllowed) {
        return {
          allowed: false,
          message: `Revision limit reached (${policy.free}) for this milestone`,
        };
      }

      // Extra is allowed, but needs payment
      return {
        allowed: true,
        isPaid: true,
        fee: policy.fee,
      };
    }

    // Within free revision limit
    return { allowed: true, isPaid: false };
  }

  // For standard revisions
  if (
    contract.proposalSnapshot.listingSnapshot.revisions?.type === "standard"
  ) {
    const policy = contract.revisionPolicy;
    const revisionsDone = contract.revisionDone || 0;

    if (!policy) {
      return { allowed: false, message: "Global policy not found" };
    }

    // Check if limit reached
    if (policy.limit && revisionsDone >= policy.free) {
      // Check if extra is allowed
      if (!policy.extraAllowed) {
        return {
          allowed: false,
          message: `Revision limit reached (${policy.free})`,
        };
      }

      // Extra is allowed, but needs payment
      return {
        allowed: true,
        isPaid: true,
        fee: policy.fee,
      };
    }

    // Within free revision limit
    return { allowed: true, isPaid: false };
  }

  return { allowed: false, message: "Revision policy not configured properly" };
}

/**
 * Get revision info for a contract
 *
 * @param contract - The contract to get revision info for
 * @returns Object with revision type, allowance, remaining free revisions, and fee info
 */
const getRevisionInfo = (contract: IContract) => {
  const revisionType =
    contract.proposalSnapshot.listingSnapshot.revisions?.type || "none";

  // If no revisions allowed
  if (revisionType === "none") {
    return {
      type: "none",
      isRevisionAllowed: false,
      isFree: false,
      remainingFree: 0,
      isPaid: false,
      fee: 0,
    };
  }

  // Standard flow (applies to both standard and milestone flow with standard revisions)
  if (
    (revisionType === "standard" ||
      (revisionType === "milestone" && contract.revisionPolicy)) &&
    contract.revisionPolicy
  ) {
    const policy = contract.revisionPolicy;
    const revisionsDone = contract.revisionDone || 0;
    const remainingFree = Math.max(0, policy.free - revisionsDone);

    return {
      type: "standard",
      isRevisionAllowed: !(policy.free === 0 && !policy.extraAllowed),
      isFree: remainingFree > 0,
      remainingFree,
      isPaid: remainingFree === 0 && policy.extraAllowed,
      fee: policy.fee || 0,
    };
  }

  // Milestone-based revisions
  if (revisionType === "milestone" && contract.currentMilestoneIndex !== null) {
    const milestone =
      contract.milestones?.[
        parseInt(String(contract.currentMilestoneIndex) || "0")
      ];

    if (!milestone || !milestone.revisionPolicy) {
      return {
        type: "milestone",
        isRevisionAllowed: false,
        isFree: false,
        remainingFree: 0,
        isPaid: false,
        fee: 0,
      };
    }

    const policy = milestone.revisionPolicy;
    const revisionsDone = milestone.revisionDone || 0;
    const remainingFree = Math.max(0, policy.free - revisionsDone);

    // Calculate this as a plain boolean
    const shouldBePaid = remainingFree === 0 && policy.extraAllowed;

    return {
      type: "milestone",
      isRevisionAllowed: !(policy.free === 0 && !policy.extraAllowed),
      isFree: remainingFree > 0,
      remainingFree,
      isPaid: shouldBePaid,
      fee: policy.fee || 0,
    };
  }

  return {
    type: revisionType,
    isRevisionAllowed: false,
    isFree: false,
    remainingFree: 0,
    isPaid: false,
    fee: 0,
  };
};
