// src/lib/services/wallet.service.ts
import { ClientSession, startSession } from "mongoose";
import type { ObjectId, Cents } from "@/types/common";
import * as walletRepo from "@/lib/db/repositories/wallet.repository";
import * as escrowTransactionRepo from "@/lib/db/repositories/escrowTransaction.repository";
import { connectDB } from "@/lib/db/connection";
import { HttpError } from "./commissionListing.service";
import { getUserContracts } from "./contract.service";
import { isAdminById } from "../db/repositories/user.repository";

/**
 * Get a user's wallet
 */
export async function getUserWallet(userId: string): Promise<any> {
  const wallet = await walletRepo.findWalletByUserId(userId);
  if (!wallet) {
    throw new HttpError("Wallet not found", 404);
  }
  return wallet;
}

/**
 * Get wallet summary (available, escrowed, total)
 */
export async function getWalletSummary(userId: string): Promise<{
  available: Cents;
  escrowed: Cents;
  total: Cents;
}> {
  const summary = await walletRepo.getWalletSummary(userId);
  if (!summary) {
    throw new HttpError("Wallet not found", 404);
  }
  return summary;
}

/**
 * Add funds to a user's wallet
 * This might be connected to a payment gateway in a real implementation
 */
export async function addFundsToWallet(
  userId: string,
  amount: Cents,
  clientSession?: ClientSession
): Promise<any> {
  await connectDB();
  const session = clientSession ? clientSession : await startSession();

  try {
    if (!clientSession) {
      session.startTransaction();
    }

    // Verify amount is positive
    if (amount <= 0) {
      throw new HttpError("Amount must be positive", 400);
    }

    // Add funds to wallet
    const wallet = await walletRepo.addFundsToWallet(userId, amount, session);
    if (!wallet) {
      throw new HttpError("Wallet not found", 404);
    }

    // In a real implementation, you would process payment here
    if (!clientSession) {
      await session.commitTransaction();
    }

    return wallet;
  } catch (error) {
    if (!clientSession) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    if (!clientSession) {
      session.endSession();
    }
  }
}

/**
 * Check if a user has sufficient funds
 */
export async function checkSufficientFunds(
  userId: string,
  amount: Cents
): Promise<boolean> {
  return walletRepo.hasSufficientFunds(userId, amount);
}

/**
 * Get all transactions for a user
 */
export async function getTransactions(userId: string): Promise<any[]> {
  // Find all contracts associated with this user
  // This would need to be implemented based on your data structure
  const contracts = await getUserContracts(userId); // This would be populated from contract repository
  const mergedContracts = [...contracts.asArtist, ...contracts.asClient];

  // Get transactions from all contracts
  const transactions = [];
  for (const contract of mergedContracts) {
    const contractTransactions =
      await escrowTransactionRepo.findEscrowTransactionsByContract(
        contract._id
      );

    // Filter transactions relevant to this user
    for (const tx of contractTransactions) {
      const isRelevant =
        (tx.from === "client" && contract.clientId.toString() === userId) ||
        (tx.to === "artist" && contract.artistId.toString() === userId) ||
        (tx.to === "client" && contract.clientId.toString() === userId);

      if (isRelevant) {
        transactions.push({
          ...tx.toObject(),
          contractId: contract.id,
        });
      }
    }
  }

  return transactions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
/**
 * Create or update a wallet for a user
 * Typically called during user registration
 */
export async function ensureWalletExists(userId: string): Promise<any> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Check if wallet already exists
    let wallet = await walletRepo.findWalletByUserId(userId, session);

    // If not, create it
    if (!wallet) {
      wallet = await walletRepo.createWallet(userId, session);
    }

    await session.commitTransaction();
    return wallet;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Move funds between users (admin only)
 */
export async function transferBetweenUsers(
  fromUserId: string,
  toUserId: string,
  amount: Cents,
  adminId: string,
  reason: string
): Promise<void> {
  await connectDB();
  const session = await startSession();

  try {
    session.startTransaction();

    // Verify admin permissions (to be implemented)
    const isAdmin = isAdminById(adminId);
    if (!isAdmin) {
      throw new HttpError(
        "Only administrators can transfer funds between users",
        403
      );
    }

    // Verify amount is positive
    if (amount <= 0) {
      throw new HttpError("Amount must be positive", 400);
    }

    // Check if source user has sufficient funds
    const hasFunds = await walletRepo.hasSufficientFunds(
      fromUserId,
      amount,
      session
    );
    if (!hasFunds) {
      throw new HttpError("Source user has insufficient funds", 400);
    }

    // Transfer funds
    await walletRepo.transferBetweenUsers(
      fromUserId,
      toUserId,
      amount,
      session
    );

    // In a real implementation, you would log this transfer
    // and possibly create a special transaction record

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
