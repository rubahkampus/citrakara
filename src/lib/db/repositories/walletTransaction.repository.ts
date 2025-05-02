// src/lib/db/repositories/walletTransaction.repository.ts

import WalletTransaction from "@/lib/db/models/walletTransaction.model";
import Wallet from "@/lib/db/models/wallet.model";
import { connectDB } from "@/lib/db/connection";
import type { ObjectId } from "mongoose";

type TransactionInput = {
  walletId: string | ObjectId;
  type: "credit" | "debit";
  amount: number;
  target: "available" | "escrowed";
  source: "commission" | "refund" | "payment" | "manual" | "release";
  note?: string;
};

/**
 * Create a transaction and update wallet balance atomically.
 */
export async function createTransaction({
  walletId,
  type,
  amount,
  target,
  source,
  note,
}: TransactionInput) {
  await connectDB();

  // Start a session for transaction
  const session = await WalletTransaction.startSession();
  try {
    session.startTransaction();

    // 1) Record the transaction
    const txn = new WalletTransaction({
      wallet: walletId,
      type,
      amount,
      target,
      source,
      note,
    });
    await txn.save({ session });

    // 2) Read the wallet under the same session
    const wallet = await Wallet.findOne({ _id: walletId }).session(session);
    if (!wallet) throw new Error("Wallet not found");

    // 3) Compute new balance
    const field = target === "available" ? "saldoAvailable" : "saldoEscrowed";
    const delta = type === "credit" ? amount : -amount;
    const current =
      field === "saldoAvailable" ? wallet.saldoAvailable : wallet.saldoEscrowed;
    const updated = current + delta;
    if (updated < 0) throw new Error(`Insufficient ${target} balance`);

    // 4) Persist the new balance in the same session
    await Wallet.updateOne(
      { _id: walletId },
      { $set: { [field]: updated } },
      { session }
    );

    // 5) Commit and return
    await session.commitTransaction();
    return txn;
  } catch (err) {
    await session.abortTransaction();
    throw err;
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
 * Get transaction history for a user (via their wallet)
 */
export async function getTransactionHistoryByUserId(
  userId: string | ObjectId,
  limit = 50,
  skip = 0
) {
  await connectDB();
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) throw new Error("Wallet not found");
  return getTransactionHistory(wallet._id, limit, skip);
}
