// src/lib/db/models/__mocks__/user.mock.ts
import mongoose from "mongoose";
import { IUser } from "../user.model";

export const mockUserId = new mongoose.Types.ObjectId();
export const mockWalletId = new mongoose.Types.ObjectId();

export const mockUser: Partial<IUser> = {
  _id: mockUserId,
  email: "test@example.com",
  username: "testuser",
  password: "hashedpassword123",
  roles: ["user"],
  displayName: "Test User",
  bio: "This is a test user",
  profilePicture: "https://example.com/profile.jpg",
  banner: "https://example.com/banner.jpg",
  tags: ["art", "digital", "illustration"],
  socials: [
    { label: "Twitter", url: "https://twitter.com/testuser" },
    { label: "Instagram", url: "https://instagram.com/testuser" },
  ],
  galleries: [],
  openForCommissions: true,
  defaultCurrency: "USD",
  tosEntries: [],
  wallet: mockWalletId,
  rating: { avg: 4.5, count: 10 },
  completedOrders: 5,
  isDeleted: false,
  isSuspended: false,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdminUser: Partial<IUser> = {
  ...mockUser,
  _id: new mongoose.Types.ObjectId(),
  username: "adminuser",
  email: "admin@example.com",
  roles: ["user", "admin"],
};

export function createMockUser(overrides = {}): Partial<IUser> {
  return {
    ...mockUser,
    _id: new mongoose.Types.ObjectId(),
    email: `user${Date.now()}@example.com`,
    username: `user${Date.now()}`,
    ...overrides,
  };
}
