// src/lib/test/mocks/user.mock.ts
import mongoose from "mongoose";
import User from "@/lib/db/models/user.model";
import Wallet from "@/lib/db/models/wallet.model";
import { defaultUserConfig } from "@/config";

export interface MockUserData {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  displayName: string;
  wallet: mongoose.Types.ObjectId;
}

/**
 * Create a mock user and wallet for testing
 */
export async function createMockUser(
  userData?: Partial<MockUserData>
): Promise<MockUserData> {
  const userId = new mongoose.Types.ObjectId();
  const walletId = new mongoose.Types.ObjectId();

  // Create default mock data
  const mockData: MockUserData = {
    _id: userId,
    email: `test-${Date.now()}@example.com`,
    username: `testuser-${Date.now()}`,
    password: "password123",
    displayName: `Test User ${Date.now()}`,
    wallet: walletId,
    ...userData,
  };

  // Create wallet
  const wallet = new Wallet({
    _id: walletId,
    user: userId,
    saldoAvailable: 0,
    saldoEscrowed: 0,
  });

  // Create user
  const user = new User({
    _id: userId,
    email: mockData.email,
    username: mockData.username,
    password: mockData.password,
    roles: ["user"],
    displayName: mockData.displayName,
    bio: "",
    profilePicture: defaultUserConfig.profilePicture,
    banner: defaultUserConfig.banner,
    tags: [],
    socials: [],
    openForCommissions: false,
    defaultCurrency: "IDR",
    tosEntries: [],
    wallet: walletId,
    rating: { avg: 0, count: 0 },
    completedOrders: 0,
    isDeleted: false,
    isSuspended: false,
    emailVerified: false,
  });

  await wallet.save();
  await user.save();

  return mockData;
}

/**
 * Create a mock admin user for testing
 */
export async function createMockAdmin(): Promise<MockUserData> {
  const userId = new mongoose.Types.ObjectId();
  const walletId = new mongoose.Types.ObjectId();

  // Create default mock data for admin
  const mockData: MockUserData = {
    _id: userId,
    email: `admin-${Date.now()}@example.com`,
    username: `admin-${Date.now()}`,
    password: "adminpass123",
    displayName: `Admin User ${Date.now()}`,
    wallet: walletId,
  };

  // Create wallet
  const wallet = new Wallet({
    _id: walletId,
    user: userId,
    saldoAvailable: 1000, // Give admin some funds
    saldoEscrowed: 0,
  });

  // Create admin user
  const user = new User({
    _id: userId,
    email: mockData.email,
    username: mockData.username,
    password: mockData.password,
    roles: ["user", "admin"], // Admin role
    displayName: mockData.displayName,
    bio: "Admin account",
    profilePicture: defaultUserConfig.profilePicture,
    banner: defaultUserConfig.banner,
    tags: [],
    socials: [],
    openForCommissions: false,
    defaultCurrency: "IDR",
    tosEntries: [],
    wallet: walletId,
    rating: { avg: 0, count: 0 },
    completedOrders: 0,
    isDeleted: false,
    isSuspended: false,
    emailVerified: true,
  });

  await wallet.save();
  await user.save();

  return mockData;
}
