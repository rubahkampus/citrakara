// src/lib/db/models/__mocks__/wallet.mock.ts
import mongoose from "mongoose";
import { IWallet } from "../wallet.model";
import { mockUserId } from "./user.mock";

export const mockWalletId = new mongoose.Types.ObjectId();

export const mockWallet: Partial<IWallet> = {
  _id: mockWalletId,
  user: mockUserId,
  saldoAvailable: 10000, // $100.00 in cents
  saldoEscrowed: 5000, // $50.00 in cents
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function createMockWallet(
  userId = mockUserId,
  overrides = {}
): Partial<IWallet> {
  return {
    ...mockWallet,
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    ...overrides,
  };
}
