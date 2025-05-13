// src/lib/db/repositories/__tests__/wallet.repository.test.ts
import mongoose from "mongoose";
import * as walletRepo from "../wallet.repository";
import Wallet from "../../models/wallet.model";
import { createMockUser } from "../../models/__mocks__/user.mock";
import { createMockWallet } from "../../models/__mocks__/wallet.mock";

describe("Wallet Repository", () => {
  let testUserId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    testUserId = new mongoose.Types.ObjectId();
  });

  describe("createWallet", () => {
    it("should create a new wallet for a user", async () => {
      const wallet = await walletRepo.createWallet(testUserId);

      expect(wallet).toBeDefined();
      expect(wallet.user.toString()).toBe(testUserId.toString());
      expect(wallet.saldoAvailable).toBe(0);
      expect(wallet.saldoEscrowed).toBe(0);

      // Verify it was saved to the database
      const foundWallet = await Wallet.findOne({ user: testUserId });
      expect(foundWallet).toBeDefined();
      expect(foundWallet!.user.toString()).toBe(testUserId.toString());
    });
  });

  describe("findWalletByUserId", () => {
    it("should find a wallet by user ID", async () => {
      // Create a wallet first
      const mockWallet = createMockWallet(testUserId);
      await new Wallet(mockWallet).save();

      // Find the wallet
      const wallet = await walletRepo.findWalletByUserId(testUserId);

      expect(wallet).toBeDefined();
      expect(wallet!.user.toString()).toBe(testUserId.toString());
    });

    it("should return null if wallet not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const wallet = await walletRepo.findWalletByUserId(nonExistentId);

      expect(wallet).toBeNull();
    });
  });

  describe("addFundsToWallet", () => {
    it("should add funds to the wallet", async () => {
      // Create a wallet first
      await new Wallet({
        user: testUserId,
        saldoAvailable: 1000,
        saldoEscrowed: 500,
      }).save();

      // Add funds
      const amount = 500;
      const updatedWallet = await walletRepo.addFundsToWallet(
        testUserId,
        amount
      );

      expect(updatedWallet).toBeDefined();
      expect(updatedWallet!.saldoAvailable).toBe(1500); // 1000 + 500
      expect(updatedWallet!.saldoEscrowed).toBe(500); // unchanged
    });
  });

  describe("moveToEscrow", () => {
    it("should move funds from available to escrow", async () => {
      // Create a wallet with funds
      await new Wallet({
        user: testUserId,
        saldoAvailable: 1000,
        saldoEscrowed: 500,
      }).save();

      // Move funds to escrow
      const amount = 300;
      const updatedWallet = await walletRepo.moveToEscrow(testUserId, amount);

      expect(updatedWallet).toBeDefined();
      expect(updatedWallet!.saldoAvailable).toBe(700); // 1000 - 300
      expect(updatedWallet!.saldoEscrowed).toBe(800); // 500 + 300
    });

    it("should throw an error if insufficient funds", async () => {
      // Create a wallet with insufficient funds
      await new Wallet({
        user: testUserId,
        saldoAvailable: 200,
        saldoEscrowed: 500,
      }).save();

      // Try to move more funds than available
      const amount = 300;

      await expect(walletRepo.moveToEscrow(testUserId, amount)).rejects.toThrow(
        "Insufficient funds"
      );
    });
  });

  describe("getWalletSummary", () => {
    it("should return wallet summary with correct totals", async () => {
      // Create a wallet
      await new Wallet({
        user: testUserId,
        saldoAvailable: 1000,
        saldoEscrowed: 500,
      }).save();

      // Get summary
      const summary = await walletRepo.getWalletSummary(testUserId);

      expect(summary).toBeDefined();
      expect(summary!.available).toBe(1000);
      expect(summary!.escrowed).toBe(500);
      expect(summary!.total).toBe(1500); // 1000 + 500
    });
  });

  describe("hasSufficientFunds", () => {
    it("should return true if user has sufficient funds", async () => {
      // Create a wallet with funds
      await new Wallet({
        user: testUserId,
        saldoAvailable: 1000,
        saldoEscrowed: 500,
      }).save();

      // Check if has sufficient funds
      const result = await walletRepo.hasSufficientFunds(testUserId, 800);

      expect(result).toBe(true);
    });

    it("should return false if user has insufficient funds", async () => {
      // Create a wallet with insufficient funds
      await new Wallet({
        user: testUserId,
        saldoAvailable: 500,
        saldoEscrowed: 500,
      }).save();

      // Check if has sufficient funds
      const result = await walletRepo.hasSufficientFunds(testUserId, 800);

      expect(result).toBe(false);
    });

    it("should return false if wallet not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await walletRepo.hasSufficientFunds(nonExistentId, 100);

      expect(result).toBe(false);
    });
  });

  describe("transferBetweenUsers", () => {
    it("should transfer funds between users", async () => {
      // Create two wallets
      const sourceUserId = new mongoose.Types.ObjectId();
      const targetUserId = new mongoose.Types.ObjectId();

      await new Wallet({
        user: sourceUserId,
        saldoAvailable: 1000,
        saldoEscrowed: 0,
      }).save();

      await new Wallet({
        user: targetUserId,
        saldoAvailable: 500,
        saldoEscrowed: 0,
      }).save();

      // Transfer funds
      await walletRepo.transferBetweenUsers(sourceUserId, targetUserId, 300);

      // Check source wallet
      const sourceWallet = await Wallet.findOne({ user: sourceUserId });
      expect(sourceWallet!.saldoAvailable).toBe(700); // 1000 - 300

      // Check target wallet
      const targetWallet = await Wallet.findOne({ user: targetUserId });
      expect(targetWallet!.saldoAvailable).toBe(800); // 500 + 300
    });
  });
});
