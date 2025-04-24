// src/lib/db/repositories/wallet.repository.ts
import Wallet from "@/lib/db/models/wallet.model";
import { connectDB } from "@/lib/db/connection";
import { ObjectId } from "mongoose";

/**
 * Create a new wallet for a user
 */
export async function createWallet(userId: string | ObjectId) {
  await connectDB();
  
  const wallet = new Wallet({
    user: userId,
    saldoAvailable: 0,
    saldoEscrowed: 0,
  });

  return wallet.save();
}

/**
 * Find wallet by user ID
 */
export async function findWalletByUserId(userId: string | ObjectId) {
  await connectDB();
  return Wallet.findOne({ user: userId });
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  walletId: string | ObjectId,
  update: { saldoAvailable?: number; saldoEscrowed?: number }
) {
  await connectDB();
  return Wallet.findByIdAndUpdate(walletId, update, { new: true });
}