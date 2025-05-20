// src/lib/services/escrowTransaction.service.ts

import { ClientSession, startSession } from "mongoose";
import type { ObjectId, Cents } from "@/types/common";
import { connectDB } from "../db/connection";
import * as escrowTransactionRepo from "@/lib/db/repositories/escrowTransaction.repository";
import * as walletRepo from "@/lib/db/repositories/wallet.repository";

/* ======================================================================
 * Transaction Creation Functions
 * ====================================================================== */

/**
 * Create a Hold transaction (client funds to escrow)
 * This is used when a contract is created or a fee is paid
 *
 * @param contractId The ID of the contract associated with this transaction
 * @param clientId The ID of the client making the payment
 * @param amount Amount in cents to be held in escrow
 * @param note Optional note describing the transaction purpose
 * @param session Optional Mongoose session for transaction management
 * @returns The created escrow transaction record
 * @throws Error if client has insufficient funds
 */
export async function createHoldTransaction(
  contractId: string | ObjectId,
  clientId: string | ObjectId,
  amount: Cents,
  note?: string,
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

    // 1. Check if client has sufficient funds
    const hasFunds = await walletRepo.hasSufficientFunds(
      clientId,
      amount,
      session
    );
    if (!hasFunds) {
      throw new Error("Insufficient funds");
    }

    // 2. Move funds from client available balance to escrow
    await walletRepo.moveToEscrow(clientId, amount, session);

    // 3. Create escrow transaction record
    const transaction = await escrowTransactionRepo.createHoldTransaction(
      contractId,
      amount,
      note,
      session
    );

    if (localSession) {
      await localSession.commitTransaction();
    }
    return transaction;
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
 * Create a Release transaction (escrow funds to artist)
 * This is used when a contract is completed or cancelled with partial payment
 *
 * @param contractId The ID of the contract associated with this transaction
 * @param clientId The ID of the client whose escrow balance will be reduced
 * @param artistId The ID of the artist who will receive the funds
 * @param amount Amount in cents to be released from escrow
 * @param note Optional note describing the transaction purpose
 * @param session Optional Mongoose session for transaction management
 * @returns The created release transaction record
 * @throws Error if the transaction cannot be completed
 */
export async function createReleaseTransaction(
  contractId: string | ObjectId,
  clientId: string | ObjectId,
  artistId: string | ObjectId,
  amount: Cents,
  note?: string,
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

    // 1. Reduce escrow balance for client
    await walletRepo.reduceEscrowBalance(clientId, amount, session);

    // 2. Add funds to artist available balance
    await walletRepo.releaseFromEscrowToArtist(artistId, amount, session);

    // 3. Create escrow transaction record
    const transaction = await escrowTransactionRepo.createReleaseTransaction(
      contractId,
      amount,
      note,
      session
    );

    if (localSession) {
      await localSession.commitTransaction();
    }
    return transaction;
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
 * Create a Refund transaction (escrow funds to client)
 * This is used when a contract is cancelled with refund
 *
 * @param contractId The ID of the contract associated with this transaction
 * @param clientId The ID of the client receiving the refund
 * @param amount Amount in cents to be refunded from escrow
 * @param note Optional note describing the transaction purpose
 * @param session Optional Mongoose session for transaction management
 * @returns The created refund transaction record
 * @throws Error if the transaction cannot be completed
 */
export async function createRefundTransaction(
  contractId: string | ObjectId,
  clientId: string | ObjectId,
  amount: Cents,
  note?: string,
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

    // 1. Reduce escrow balance for client
    await walletRepo.reduceEscrowBalance(clientId, amount, session);

    // 2. Add funds to client available balance
    await walletRepo.refundFromEscrowToClient(clientId, amount, session);

    // 3. Create escrow transaction record
    const transaction = await escrowTransactionRepo.createRefundTransaction(
      contractId,
      amount,
      note,
      session
    );

    if (localSession) {
      await localSession.commitTransaction();
    }
    return transaction;
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
 * Create a Revision Fee transaction (client funds to escrow)
 * This is used when a paid revision is requested
 *
 * @param contractId The ID of the contract associated with this transaction
 * @param clientId The ID of the client making the payment
 * @param amount Amount in cents to be held in escrow for the revision
 * @param note Optional note describing the revision details
 * @param session Optional Mongoose session for transaction management
 * @returns The created revision fee transaction record
 * @throws Error if client has insufficient funds
 */
export async function createRevisionFeeTransaction(
  contractId: string | ObjectId,
  clientId: string | ObjectId,
  amount: Cents,
  note?: string,
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

    // 1. Check if client has sufficient funds
    const hasFunds = await walletRepo.hasSufficientFunds(
      clientId,
      amount,
      session
    );
    if (!hasFunds) {
      throw new Error("Insufficient funds");
    }

    // 2. Move funds from client available balance to escrow
    await walletRepo.moveToEscrow(clientId, amount, session);

    // 3. Create escrow transaction record
    const transaction =
      await escrowTransactionRepo.createRevisionFeeTransaction(
        contractId,
        amount,
        note,
        session
      );

    if (localSession) {
      await localSession.commitTransaction();
    }
    return transaction;
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
 * Create a Change Fee transaction (client funds to escrow)
 * This is used when a paid contract change is requested
 *
 * @param contractId The ID of the contract associated with this transaction
 * @param clientId The ID of the client making the payment
 * @param amount Amount in cents to be held in escrow for the contract change
 * @param note Optional note describing the contract change details
 * @param session Optional Mongoose session for transaction management
 * @returns The created change fee transaction record
 * @throws Error if client has insufficient funds
 */
export async function createChangeFeeTransaction(
  contractId: string | ObjectId,
  clientId: string | ObjectId,
  amount: Cents,
  note?: string,
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

    // 1. Check if client has sufficient funds
    const hasFunds = await walletRepo.hasSufficientFunds(
      clientId,
      amount,
      session
    );
    if (!hasFunds) {
      throw new Error("Insufficient funds");
    }

    // 2. Move funds from client available balance to escrow
    await walletRepo.moveToEscrow(clientId, amount, session);

    // 3. Create escrow transaction record
    const transaction = await escrowTransactionRepo.createChangeFeeTransaction(
      contractId,
      amount,
      note,
      session
    );

    if (localSession) {
      await localSession.commitTransaction();
    }
    return transaction;
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

/* ======================================================================
 * Transaction Management Functions
 * ====================================================================== */

/**
 * Update the contract ID associated with a transaction
 *
 * @param txnId The ID of the transaction to update
 * @param contractId The new contract ID to associate with the transaction
 * @param session Optional Mongoose session for transaction management
 * @returns Result of the update operation
 */
export async function updateTransactionContract(
  txnId: string | ObjectId,
  contractId: string | ObjectId,
  session?: ClientSession
) {
  return escrowTransactionRepo.updateTransactionContract(
    txnId,
    contractId,
    session
  );
}

/* ======================================================================
 * Transaction Query Functions
 * ====================================================================== */

/**
 * Get transaction history for a contract
 *
 * @param contractId The ID of the contract to get transactions for
 * @returns Array of transaction records for the specified contract
 */
export async function getTransactionsByContract(
  contractId: string | ObjectId
): Promise<any[]> {
  return escrowTransactionRepo.findEscrowTransactionsByContract(contractId);
}

/**
 * Calculate the current escrow balance for a contract
 *
 * @param contractId The ID of the contract to calculate balance for
 * @returns Current escrow balance in cents
 */
export async function calculateEscrowBalance(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateEscrowBalance(contractId);
}

/**
 * Calculate the total amount paid by client for a contract
 *
 * @param contractId The ID of the contract to calculate payments for
 * @returns Total amount paid by client in cents
 */
export async function getTotalClientPayments(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateClientPayments(contractId);
}

/**
 * Calculate the total amount released to artist for a contract
 *
 * @param contractId The ID of the contract to calculate payments for
 * @returns Total amount paid to artist in cents
 */
export async function getTotalArtistPayments(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateArtistPayments(contractId);
}

/**
 * Calculate the total amount refunded to client for a contract
 *
 * @param contractId The ID of the contract to calculate refunds for
 * @returns Total amount refunded to client in cents
 */
export async function getTotalClientRefunds(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateClientRefunds(contractId);
}
