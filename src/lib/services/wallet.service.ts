// src/lib/services/wallet.service.ts
import { findWalletByUserId } from "@/lib/db/repositories/wallet.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";
import { createTransaction, getTransactionHistoryByUserId } from "@/lib/db/repositories/walletTransaction.repository";
import { ObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { WalletBalanceResponse, Transaction } from "@/types/wallet";

/**
 * Get wallet balance for a user by username
 * This function is used in the dashboard and needs to return saldoAvailable
 * for backward compatibility with the dashboard component
 */
export async function getUserWalletBalance(username: string): Promise<WalletBalanceResponse> {
  await connectDB();
  
  // First find the user document to get the userId
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }
  
  // Then find the wallet using the user ID
  const wallet = await findWalletByUserId(user._id);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  // Return with both the original property names and the new format
  // for backward compatibility
  return {
    saldoAvailable: wallet.saldoAvailable,
    saldoEscrowed: wallet.saldoEscrowed,
    available: wallet.saldoAvailable,
    escrowed: wallet.saldoEscrowed,
    total: wallet.saldoAvailable + wallet.saldoEscrowed
  };
}

/**
 * Get wallet balance by user ID
 * This is the internal version used by other services
 */
export async function getWalletBalanceByUserId(userId: string | ObjectId): Promise<Omit<WalletBalanceResponse, 'saldoAvailable' | 'saldoEscrowed'>> {
  const wallet = await findWalletByUserId(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  return {
    available: wallet.saldoAvailable,
    escrowed: wallet.saldoEscrowed,
    total: wallet.saldoAvailable + wallet.saldoEscrowed
  };
}

/**
 * Add funds to a user's available balance
 */
export async function addFundsToUserWallet(
  userId: string | ObjectId, 
  amount: number, 
  source: Transaction['source'],
  note?: string
) {
  const wallet = await findWalletByUserId(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  return createTransaction({
    walletId: wallet._id,
    type: "credit",
    amount,
    target: "available",
    source,
    note
  });
}

/**
 * Move funds from available to escrow
 */
export async function moveToEscrow(
  userId: string | ObjectId, 
  amount: number, 
  source: "commission" | "payment",
  note?: string
) {
  const wallet = await findWalletByUserId(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  if (wallet.saldoAvailable < amount) {
    throw new Error("Insufficient available balance");
  }
  
  // First debit from available
  await createTransaction({
    walletId: wallet._id,
    type: "debit",
    amount,
    target: "available",
    source,
    note: `Move to escrow: ${note || ''}`
  });
  
  // Then credit to escrow
  return createTransaction({
    walletId: wallet._id,
    type: "credit",
    amount,
    target: "escrowed",
    source,
    note: `Moved from available: ${note || ''}`
  });
}

/**
 * Release funds from escrow to available
 */
export async function releaseFromEscrow(
  userId: string | ObjectId, 
  amount: number, 
  source: "commission" | "refund" | "release",
  note?: string
) {
  const wallet = await findWalletByUserId(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  
  if (wallet.saldoEscrowed < amount) {
    throw new Error("Insufficient escrowed balance");
  }
  
  // First debit from escrow
  await createTransaction({
    walletId: wallet._id,
    type: "debit",
    amount,
    target: "escrowed",
    source,
    note: `Release from escrow: ${note || ''}`
  });
  
  // Then credit to available
  return createTransaction({
    walletId: wallet._id,
    type: "credit",
    amount,
    target: "available",
    source,
    note: `Released from escrow: ${note || ''}`
  });
}

/**
 * Get transaction history for a user
 */
export async function getUserTransactionHistory(userId: string | ObjectId, limit = 50, skip = 0) {
  return getTransactionHistoryByUserId(userId, limit, skip);
}