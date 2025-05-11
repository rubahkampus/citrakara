// src/lib/db/repositories/wallet.repository.ts
import { connectDB } from "@/lib/db/connection";
import Wallet, { IWallet } from "@/lib/db/models/wallet.model";
import { ClientSession } from "mongoose";
import type { ObjectId, Cents } from "@/types/common";
import { toObjectId } from "@/lib/utils/toObjectId";

/**
 * Create a new wallet for a user
 */
export async function createWallet(
  userId: string | ObjectId,
  session?: ClientSession
) {
  await connectDB();

  const wallet = new Wallet({
    user: userId,
    saldoAvailable: 0,
    saldoEscrowed: 0,
  });

  if (session) {
    return wallet.save({ session });
  } else {
    return wallet.save();
  }
}

/**
 * Find wallet by user ID
 */
export async function findWalletByUserId(
  userId: string | ObjectId,
  session?: ClientSession
) {
  await connectDB();

  if (session) {
    return Wallet.findOne({ user: userId }).session(session);
  } else {
    return Wallet.findOne({ user: userId });
  }
}

// Add funds to available balance
export async function addFundsToWallet(
  userId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<IWallet | null> {
  await connectDB();

  return Wallet.findOneAndUpdate(
    { user: toObjectId(userId) },
    { $inc: { saldoAvailable: amount } },
    { new: true, session }
  );
}

// Move funds from available to escrow (for contract creation)
export async function moveToEscrow(
  userId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<IWallet | null> {
  await connectDB();

  // Find the wallet first to check if it has enough funds
  const wallet = await Wallet.findOne({ user: toObjectId(userId) }).session(
    session || null
  );

  if (!wallet || wallet.saldoAvailable < amount) {
    throw new Error("Insufficient funds");
  }

  return Wallet.findOneAndUpdate(
    { user: toObjectId(userId) },
    {
      $inc: {
        saldoAvailable: -amount,
        saldoEscrowed: amount,
      },
    },
    { new: true, session }
  );
}

// Move funds from escrow to available (for artist payment)
export async function releaseFromEscrowToArtist(
  userId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<IWallet | null> {
  await connectDB();

  return Wallet.findOneAndUpdate(
    { user: toObjectId(userId) },
    { $inc: { saldoAvailable: amount } },
    { new: true, session }
  );
}

// Move funds from escrow back to client (for refund)
export async function refundFromEscrowToClient(
  userId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<IWallet | null> {
  await connectDB();

  return Wallet.findOneAndUpdate(
    { user: toObjectId(userId) },
    { $inc: { saldoAvailable: amount } },
    { new: true, session }
  );
}

// Reduce escrow balance (after payments or refunds)
export async function reduceEscrowBalance(
  userId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<IWallet | null> {
  await connectDB();

  return Wallet.findOneAndUpdate(
    { user: toObjectId(userId) },
    { $inc: { saldoEscrowed: -amount } },
    { new: true, session }
  );
}

// Get wallet summary (for displaying in UI)
export async function getWalletSummary(
  userId: string | ObjectId,
  session?: ClientSession
): Promise<{
  available: Cents;
  escrowed: Cents;
  total: Cents;
} | null> {
  await connectDB();

  const wallet = await Wallet.findOne({ user: toObjectId(userId) }).session(
    session || null
  );

  if (!wallet) {
    return null;
  }

  return {
    available: wallet.saldoAvailable,
    escrowed: wallet.saldoEscrowed,
    total: wallet.saldoAvailable + wallet.saldoEscrowed,
  };
}

// Transfer funds between users (used in admin resolution)
export async function transferBetweenUsers(
  fromUserId: string | ObjectId,
  toUserId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<void> {
  await connectDB();

  // Deduct from source user
  await Wallet.findOneAndUpdate(
    { user: toObjectId(fromUserId) },
    { $inc: { saldoAvailable: -amount } },
    { session }
  );

  // Add to target user
  await Wallet.findOneAndUpdate(
    { user: toObjectId(toUserId) },
    { $inc: { saldoAvailable: amount } },
    { session }
  );
}

// Check if a user has sufficient available funds
export async function hasSufficientFunds(
  userId: string | ObjectId,
  amount: Cents,
  session?: ClientSession
): Promise<boolean> {
  await connectDB();

  const wallet = await Wallet.findOne({ user: toObjectId(userId) }).session(
    session || null
  );

  return wallet ? wallet.saldoAvailable >= amount : false;
}
