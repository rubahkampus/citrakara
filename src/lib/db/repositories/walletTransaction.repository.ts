// src/lib/db/repositories/walletTransaction.repository.ts
import WalletTransaction from "@/lib/db/models/walletTransaction.model";
import { connectDB } from "@/lib/db/connection";
import { ObjectId } from "mongoose";
import { updateWalletBalance, findWalletByUserId } from "./wallet.repository";

/**
 * Create a transaction and update wallet balance
 */
export async function createTransaction({
  walletId,
  type,
  amount,
  target,
  source,
  note,
}: {
  walletId: string | ObjectId;
  type: "credit" | "debit";
  amount: number;
  target: "available" | "escrowed";
  source: "commission" | "refund" | "payment" | "manual" | "release";
  note?: string;
}) {
  await connectDB();

  // Start a session for transaction
  const session = await WalletTransaction.startSession();

  try {
    session.startTransaction();

    // Create the transaction record
    const transaction = new WalletTransaction({
      wallet: walletId,
      type,
      amount,
      target,
      source,
      note,
    });

    await transaction.save({ session });

    // Update the wallet balance
    const updateField =
      target === "available" ? "saldoAvailable" : "saldoEscrowed";
    const updateAmount = type === "credit" ? amount : -amount;

    // Get current wallet balance
    const wallet = await findWalletByUserId(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const currentBalance =
      target === "available" ? wallet.saldoAvailable : wallet.saldoEscrowed;
    const newBalance = currentBalance + updateAmount;

    // Make sure we don't go negative
    if (newBalance < 0) {
      throw new Error(`Insufficient ${target} balance`);
    }

    // Update wallet
    await updateWalletBalance(walletId, { [updateField]: newBalance });

    await session.commitTransaction();
    return transaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get transaction history for a wallet
 */
export async function getTransactionHistory(
  walletId: string | ObjectId,
  limit = 50,
  skip = 0
) {
  await connectDB();
  return WalletTransaction.find({ wallet: walletId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistoryByUserId(
  userId: string | ObjectId,
  limit = 50,
  skip = 0
) {
  await connectDB();

  // First find the user's wallet
  const wallet = await findWalletByUserId(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return getTransactionHistory(wallet._id, limit, skip);
}
