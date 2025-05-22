// src/lib/db/repositories/wallet.repository.ts
import { connectDB } from "@/lib/db/connection";
import Wallet, { IWallet } from "@/lib/db/models/wallet.model";
import { ClientSession } from "mongoose";
import type { ObjectId, Cents } from "@/types/common";
import { toObjectId } from "@/lib/utils/toObjectId";

/**
 * Create a new wallet for a user
 * @param userId ID of the user to create a wallet for
 * @param session Optional MongoDB session for transactions
 * @returns The newly created wallet
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
 * Find a wallet by the associated user ID
 * @param userId ID of the user whose wallet to find
 * @param session Optional MongoDB session for transactions
 * @returns The user's wallet or null if not found
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

/**
 * Add funds to a user's available balance
 * @param userId ID of the user to add funds for
 * @param amount Amount in cents to add to available balance
 * @param session Optional MongoDB session for transactions
 * @returns The updated wallet or null if not found
 */
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

/**
 * Move funds from available balance to escrow balance
 * @param userId ID of the user to move funds for
 * @param amount Amount in cents to move from available to escrow
 * @param session Optional MongoDB session for transactions
 * @returns The updated wallet or null if not found
 * @throws Error if insufficient funds available
 */
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

/**
 * Move funds from escrow to an artist's available balance
 * @param userId ID of the artist to release funds to
 * @param amount Amount in cents to add to available balance
 * @param session Optional MongoDB session for transactions
 * @returns The updated wallet or null if not found
 */
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

/**
 * Return funds from escrow back to client's available balance
 * @param userId ID of the client to refund funds to
 * @param amount Amount in cents to refund to available balance
 * @param session Optional MongoDB session for transactions
 * @returns The updated wallet or null if not found
 */
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

/**
 * Reduce a user's escrow balance after payment or refund
 * @param userId ID of the user to reduce escrow balance for
 * @param amount Amount in cents to reduce from escrow balance
 * @param session Optional MongoDB session for transactions
 * @returns The updated wallet or null if not found
 */
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

/**
 * Get a summary of a user's wallet balances
 * @param userId ID of the user to get wallet summary for
 * @param session Optional MongoDB session for transactions
 * @returns Object containing available, escrowed, and total balances, or null if wallet not found
 */
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

/**
 * Transfer funds between two users (for admin resolution)
 * @param fromUserId ID of the user to transfer funds from
 * @param toUserId ID of the user to transfer funds to
 * @param amount Amount in cents to transfer between users
 * @param session Optional MongoDB session for transactions
 * @returns Promise that resolves when the transfer is complete
 */
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

/**
 * Check if a user has sufficient available funds for a transaction
 * @param userId ID of the user to check funds for
 * @param amount Amount in cents to check against available balance
 * @param session Optional MongoDB session for transactions
 * @returns Boolean indicating whether user has sufficient funds
 */
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
