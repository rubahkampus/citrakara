// src/lib/services/__tests__/wallet.service.test.ts
import mongoose from "mongoose";
import * as walletService from "../wallet.service";
import * as walletRepository from "../../db/repositories/wallet.repository";
import * as userRepository from "../../db/repositories/user.repository";
import * as contractService from "../contract.service";
import { createMockWallet } from "../../db/models/__mocks__/wallet.mock";
import { HttpError } from "../commissionListing.service";

// Mock all repository functions
jest.mock("../../db/repositories/wallet.repository");
jest.mock("../../db/repositories/user.repository");
jest.mock("../../db/repositories/escrowTransaction.repository");
jest.mock("../contract.service");
jest.mock("../../db/connection");

describe("Wallet Service", () => {
  const testUserId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserWallet", () => {
    it("should return a user wallet when it exists", async () => {
      const mockWallet = createMockWallet(
        new mongoose.Types.ObjectId(testUserId)
      );
      jest
        .spyOn(walletRepository, "findWalletByUserId")
        .mockResolvedValue(mockWallet as any);

      const result = await walletService.getUserWallet(testUserId);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findWalletByUserId).toHaveBeenCalledWith(
        testUserId
      );
    });

    it("should throw a 404 error when wallet not found", async () => {
      jest
        .spyOn(walletRepository, "findWalletByUserId")
        .mockResolvedValue(null);

      await expect(walletService.getUserWallet(testUserId)).rejects.toThrow(
        new HttpError("Wallet not found", 404)
      );
    });
  });

  describe("getWalletSummary", () => {
    it("should return wallet summary when it exists", async () => {
      const mockSummary = { available: 1000, escrowed: 500, total: 1500 };
      jest
        .spyOn(walletRepository, "getWalletSummary")
        .mockResolvedValue(mockSummary);

      const result = await walletService.getWalletSummary(testUserId);

      expect(result).toEqual(mockSummary);
      expect(walletRepository.getWalletSummary).toHaveBeenCalledWith(
        testUserId
      );
    });

    it("should throw a 404 error when wallet summary not found", async () => {
      jest.spyOn(walletRepository, "getWalletSummary").mockResolvedValue(null);

      await expect(walletService.getWalletSummary(testUserId)).rejects.toThrow(
        new HttpError("Wallet not found", 404)
      );
    });
  });

  describe("addFundsToWallet", () => {
    const mockSession = {} as mongoose.ClientSession;
    mockSession.startTransaction = jest.fn();
    mockSession.commitTransaction = jest.fn();
    mockSession.abortTransaction = jest.fn();
    mockSession.endSession = jest.fn();

    beforeEach(() => {
      jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    });

    it("should add funds to wallet successfully", async () => {
      const amount = 1000;
      const mockWallet = createMockWallet(
        new mongoose.Types.ObjectId(testUserId)
      );
      jest
        .spyOn(walletRepository, "addFundsToWallet")
        .mockResolvedValue(mockWallet as any);

      const result = await walletService.addFundsToWallet(testUserId, amount);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.addFundsToWallet).toHaveBeenCalledWith(
        testUserId,
        amount,
        mockSession
      );
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it("should throw an error if amount is not positive", async () => {
      await expect(
        walletService.addFundsToWallet(testUserId, 0)
      ).rejects.toThrow(new HttpError("Amount must be positive", 400));

      await expect(
        walletService.addFundsToWallet(testUserId, -100)
      ).rejects.toThrow(new HttpError("Amount must be positive", 400));
    });

    it("should throw a 404 error when wallet not found", async () => {
      jest.spyOn(walletRepository, "addFundsToWallet").mockResolvedValue(null);

      await expect(
        walletService.addFundsToWallet(testUserId, 1000)
      ).rejects.toThrow(new HttpError("Wallet not found", 404));
    });

    it("should abort transaction on error", async () => {
      jest
        .spyOn(walletRepository, "addFundsToWallet")
        .mockRejectedValue(new Error("Test error"));

      await expect(
        walletService.addFundsToWallet(testUserId, 1000)
      ).rejects.toThrow("Test error");

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe("checkSufficientFunds", () => {
    it("should return true when user has sufficient funds", async () => {
      jest
        .spyOn(walletRepository, "hasSufficientFunds")
        .mockResolvedValue(true);

      const result = await walletService.checkSufficientFunds(testUserId, 1000);

      expect(result).toBe(true);
      expect(walletRepository.hasSufficientFunds).toHaveBeenCalledWith(
        testUserId,
        1000
      );
    });

    it("should return false when user has insufficient funds", async () => {
      jest
        .spyOn(walletRepository, "hasSufficientFunds")
        .mockResolvedValue(false);

      const result = await walletService.checkSufficientFunds(testUserId, 1000);

      expect(result).toBe(false);
    });
  });

  describe("ensureWalletExists", () => {
    const mockSession = {} as mongoose.ClientSession;
    mockSession.startTransaction = jest.fn();
    mockSession.commitTransaction = jest.fn();
    mockSession.abortTransaction = jest.fn();
    mockSession.endSession = jest.fn();

    beforeEach(() => {
      jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    });

    it("should return existing wallet if it exists", async () => {
      const mockWallet = createMockWallet(
        new mongoose.Types.ObjectId(testUserId)
      );
      jest
        .spyOn(walletRepository, "findWalletByUserId")
        .mockResolvedValue(mockWallet as any);

      const result = await walletService.ensureWalletExists(testUserId);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findWalletByUserId).toHaveBeenCalledWith(
        testUserId,
        mockSession
      );
      expect(walletRepository.createWallet).not.toHaveBeenCalled();
    });

    it("should create a new wallet if it does not exist", async () => {
      const mockWallet = createMockWallet(
        new mongoose.Types.ObjectId(testUserId)
      );
      jest
        .spyOn(walletRepository, "findWalletByUserId")
        .mockResolvedValue(null);
      jest
        .spyOn(walletRepository, "createWallet")
        .mockResolvedValue(mockWallet as any);

      const result = await walletService.ensureWalletExists(testUserId);

      expect(result).toEqual(mockWallet);
      expect(walletRepository.findWalletByUserId).toHaveBeenCalledWith(
        testUserId,
        mockSession
      );
      expect(walletRepository.createWallet).toHaveBeenCalledWith(
        testUserId,
        mockSession
      );
    });

    it("should abort transaction on error", async () => {
      jest
        .spyOn(walletRepository, "findWalletByUserId")
        .mockRejectedValue(new Error("Test error"));

      await expect(
        walletService.ensureWalletExists(testUserId)
      ).rejects.toThrow("Test error");

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe("transferBetweenUsers", () => {
    const mockSession = {} as mongoose.ClientSession;
    mockSession.startTransaction = jest.fn();
    mockSession.commitTransaction = jest.fn();
    mockSession.abortTransaction = jest.fn();
    mockSession.endSession = jest.fn();

    const fromUserId = new mongoose.Types.ObjectId().toString();
    const toUserId = new mongoose.Types.ObjectId().toString();
    const amount = 1000;
    const reason = "Test transfer";

    beforeEach(() => {
      jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    });

    it("should transfer funds between users if admin", async () => {
      jest.spyOn(userRepository, "isAdminById").mockResolvedValue(true);
      jest
        .spyOn(walletRepository, "hasSufficientFunds")
        .mockResolvedValue(true);
      jest.spyOn(walletRepository, "transferBetweenUsers").mockResolvedValue();

      await walletService.transferBetweenUsers(
        fromUserId,
        toUserId,
        amount,
        adminId,
        reason
      );

      expect(userRepository.isAdminById).toHaveBeenCalledWith(adminId);
      expect(walletRepository.hasSufficientFunds).toHaveBeenCalledWith(
        fromUserId,
        amount,
        mockSession
      );
      expect(walletRepository.transferBetweenUsers).toHaveBeenCalledWith(
        fromUserId,
        toUserId,
        amount,
        mockSession
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("should throw an error if not admin", async () => {
      jest.spyOn(userRepository, "isAdminById").mockResolvedValue(false);

      await expect(
        walletService.transferBetweenUsers(
          fromUserId,
          toUserId,
          amount,
          adminId,
          reason
        )
      ).rejects.toThrow(
        new HttpError(
          "Only administrators can transfer funds between users",
          403
        )
      );
    });

    it("should throw an error if amount is not positive", async () => {
      jest.spyOn(userRepository, "isAdminById").mockResolvedValue(true);

      await expect(
        walletService.transferBetweenUsers(
          fromUserId,
          toUserId,
          0,
          adminId,
          reason
        )
      ).rejects.toThrow(new HttpError("Amount must be positive", 400));

      await expect(
        walletService.transferBetweenUsers(
          fromUserId,
          toUserId,
          -100,
          adminId,
          reason
        )
      ).rejects.toThrow(new HttpError("Amount must be positive", 400));
    });

    it("should throw an error if source user has insufficient funds", async () => {
      jest.spyOn(userRepository, "isAdminById").mockResolvedValue(true);
      jest
        .spyOn(walletRepository, "hasSufficientFunds")
        .mockResolvedValue(false);

      await expect(
        walletService.transferBetweenUsers(
          fromUserId,
          toUserId,
          amount,
          adminId,
          reason
        )
      ).rejects.toThrow(
        new HttpError("Source user has insufficient funds", 400)
      );
    });

    it("should abort transaction on error", async () => {
      jest.spyOn(userRepository, "isAdminById").mockResolvedValue(true);
      jest
        .spyOn(walletRepository, "hasSufficientFunds")
        .mockResolvedValue(true);
      jest
        .spyOn(walletRepository, "transferBetweenUsers")
        .mockRejectedValue(new Error("Test error"));

      await expect(
        walletService.transferBetweenUsers(
          fromUserId,
          toUserId,
          amount,
          adminId,
          reason
        )
      ).rejects.toThrow("Test error");

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  // describe("getTransactions", () => {
  //   it("should get all transactions for a user", async () => {
  //     // Mock contract service to return contracts for the user
  //     const mockContracts = {
  //       asArtist: [
  //         {
  //           _id: new mongoose.Types.ObjectId(),
  //           artistId: testUserId,
  //           clientId: new mongoose.Types.ObjectId(),
  //         },
  //       ],
  //       asClient: [
  //         {
  //           _id: new mongoose.Types.ObjectId(),
  //           artistId: new mongoose.Types.ObjectId(),
  //           clientId: testUserId,
  //         },
  //       ],
  //     };
  //     jest
  //       .spyOn(contractService, "getUserContracts")
  //       .mockResolvedValue(mockContracts);

  //     // Mock the escrow transaction repository
  //     const mockTransactions = [
  //       {
  //         _id: new mongoose.Types.ObjectId(),
  //         from: "client",
  //         to: "artist",
  //         amount: 1000,
  //         createdAt: new Date(),
  //         toObject: () => ({
  //           _id: new mongoose.Types.ObjectId(),
  //           from: "client",
  //           to: "artist",
  //           amount: 1000,
  //           createdAt: new Date(),
  //         }),
  //       },
  //     ];
  //     const escrowTransactionRepoMock = require("../../db/repositories/escrowTransaction.repository");
  //     escrowTransactionRepoMock.findEscrowTransactionsByContract.mockResolvedValue(
  //       mockTransactions
  //     );

  //     const result = await walletService.getTransactions(testUserId);

  //     expect(result).toHaveLength(1); // One relevant transaction for this user
  //     expect(contractService.getUserContracts).toHaveBeenCalledWith(testUserId);
  //   });
  // });
});
