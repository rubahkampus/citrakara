// src/lib/db/repositories/escrowTransaction.repository.ts
import { connectDB } from "@/lib/db/connection";
import EscrowTransaction, {
  IEscrowTransaction,
} from "@/lib/db/models/escrowTransaction.model";
import { ClientSession, Types } from "mongoose";
import type { ObjectId, Cents } from "@/types/common";
import { toObjectId } from "@/lib/utils/toObjectId";

// Find an escrow transaction by ID
export async function findEscrowTransactionById(
  id: string | ObjectId,
  session?: ClientSession
): Promise<IEscrowTransaction | null> {
  await connectDB();
  return EscrowTransaction.findById(toObjectId(id)).session(session || null);
}

// Find all escrow transactions for a contract
export async function findEscrowTransactionsByContract(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IEscrowTransaction[]> {
  await connectDB();
  return EscrowTransaction.find({ contractId: toObjectId(contractId) })
    .sort({ createdAt: -1 })
    .session(session || null);
}

// Create a "hold" transaction (client funds to escrow)
export async function createHoldTransaction(
  contractId: string | ObjectId,
  amount: Cents,
  note?: string,
  session?: ClientSession
): Promise<IEscrowTransaction> {
  await connectDB();

  const transaction = new EscrowTransaction({
    contractId: toObjectId(contractId),
    type: "hold",
    from: "client",
    to: "escrow",
    amount,
    note,
  });

  return transaction.save({ session });
}

// Create a "release" transaction (escrow funds to artist)
export async function createReleaseTransaction(
  contractId: string | ObjectId,
  amount: Cents,
  note?: string,
  session?: ClientSession
): Promise<IEscrowTransaction> {
  await connectDB();

  const transaction = new EscrowTransaction({
    contractId: toObjectId(contractId),
    type: "release",
    from: "escrow",
    to: "artist",
    amount,
    note,
  });

  return transaction.save({ session });
}

// Create a "refund" transaction (escrow funds to client)
export async function createRefundTransaction(
  contractId: string | ObjectId,
  amount: Cents,
  note?: string,
  session?: ClientSession
): Promise<IEscrowTransaction> {
  await connectDB();

  const transaction = new EscrowTransaction({
    contractId: toObjectId(contractId),
    type: "refund",
    from: "escrow",
    to: "client",
    amount,
    note,
  });

  return transaction.save({ session });
}

// Create a "revision_fee" transaction (client funds to escrow)
export async function createRevisionFeeTransaction(
  contractId: string | ObjectId,
  amount: Cents,
  note?: string,
  session?: ClientSession
): Promise<IEscrowTransaction> {
  await connectDB();

  const transaction = new EscrowTransaction({
    contractId: toObjectId(contractId),
    type: "revision_fee",
    from: "client",
    to: "escrow",
    amount,
    note,
  });

  return transaction.save({ session });
}

// Create a "change_fee" transaction (client funds to escrow)
export async function createChangeFeeTransaction(
  contractId: string | ObjectId,
  amount: Cents,
  note?: string,
  session?: ClientSession
): Promise<IEscrowTransaction> {
  await connectDB();

  const transaction = new EscrowTransaction({
    contractId: toObjectId(contractId),
    type: "change_fee",
    from: "client",
    to: "escrow",
    amount,
    note,
  });

  return transaction.save({ session });
}

// Calculate total amount in escrow for a contract
export async function calculateEscrowBalance(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<Cents> {
  await connectDB();

  const transactions = await EscrowTransaction.find({
    contractId: toObjectId(contractId),
  }).session(session || null);

  let balance = 0;

  for (const tx of transactions) {
    if (tx.to === "escrow") {
      balance += tx.amount;
    } else if (tx.from === "escrow") {
      balance -= tx.amount;
    }
  }

  return balance;
}

// Calculate total amount paid by client for a contract
export async function calculateClientPayments(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<Cents> {
  await connectDB();

  const transactions = await EscrowTransaction.find({
    contractId: toObjectId(contractId),
    from: "client",
  }).session(session || null);

  return transactions.reduce((total, tx) => total + tx.amount, 0);
}

// Calculate total amount released to artist for a contract
export async function calculateArtistPayments(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<Cents> {
  await connectDB();

  const transactions = await EscrowTransaction.find({
    contractId: toObjectId(contractId),
    to: "artist",
  }).session(session || null);

  return transactions.reduce((total, tx) => total + tx.amount, 0);
}

// Calculate total amount refunded to client for a contract
export async function calculateClientRefunds(
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<Cents> {
  await connectDB();

  const transactions = await EscrowTransaction.find({
    contractId: toObjectId(contractId),
    to: "client",
  }).session(session || null);

  return transactions.reduce((total, tx) => total + tx.amount, 0);
}

/**
 * After the real Contract is created, patch the existing
 * escrow‐hold so its `contractId` now points at the Contract.
 */
export async function updateTransactionContract(
  txnId: string | ObjectId,
  contractId: string | ObjectId,
  session?: ClientSession
): Promise<IEscrowTransaction> {
  const oidTxn = toObjectId(txnId);
  const oidCtr = toObjectId(contractId);
  const tx = await EscrowTransaction.findById(oidTxn).session(session || null);

  if (!tx) throw new Error(`Escrow transaction ${txnId} not found`);

  tx.contractId = oidCtr;
  return tx.save({ session });
}
