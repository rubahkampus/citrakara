// src/types/wallet.d.ts

import { ObjectId } from "mongoose";

/**
 * Wallet balance response type for the getUserWalletBalance function
 * Includes both legacy property names (saldoAvailable) and new ones (available)
 * for backward compatibility
 */
export interface WalletBalanceResponse {
  // Legacy property names
  saldoAvailable: number;
  saldoEscrowed: number;
  
  // New property names
  available: number;
  escrowed: number;
  total: number;
}

/**
 * Transaction type for wallet operations
 */
export interface Transaction {
  walletId: string | ObjectId;
  type: "credit" | "debit";
  amount: number;
  target: "available" | "escrowed";
  source: "commission" | "payment" | "refund" | "manual" | "release";
  note?: string;
}