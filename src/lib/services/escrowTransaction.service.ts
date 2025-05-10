// src/lib/services/escrowTransaction.service.ts
import { ClientSession, startSession } from "mongoose";
import type { ObjectId, Cents } from "@/types/common";
import * as escrowTransactionRepo from "@/lib/db/repositories/escrowTransaction.repository";
import * as walletRepo from "@/lib/db/repositories/wallet.repository";
import { connectDB } from "../db/connection";

/**
 * Create a Hold transaction (client funds to escrow)
 * This is used when a contract is created or a fee is paid
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

/**
 * Get transaction history for a contract
 */
export async function getTransactionsByContract(
  contractId: string | ObjectId
): Promise<any[]> {
  return escrowTransactionRepo.findEscrowTransactionsByContract(contractId);
}

/**
 * Calculate the current escrow balance for a contract
 */
export async function calculateEscrowBalance(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateEscrowBalance(contractId);
}

/**
 * Calculate the total amount paid by client for a contract
 */
export async function getTotalClientPayments(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateClientPayments(contractId);
}

/**
 * Calculate the total amount released to artist for a contract
 */
export async function getTotalArtistPayments(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateArtistPayments(contractId);
}

/**
 * Calculate the total amount refunded to client for a contract
 */
export async function getTotalClientRefunds(
  contractId: string | ObjectId
): Promise<Cents> {
  return escrowTransactionRepo.calculateClientRefunds(contractId);
}