// src/lib/db/models/__mocks__/gallery.mock.ts
import mongoose from "mongoose";
import { IGallery } from "../gallery.model";
import { mockUserId } from "./user.mock";

export const mockGalleryId = new mongoose.Types.ObjectId();

export const mockGallery: Partial<IGallery> = {
  _id: mockGalleryId,
  userId: mockUserId,
  name: "Test Gallery",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockGeneralGallery: Partial<IGallery> = {
  ...mockGallery,
  _id: new mongoose.Types.ObjectId(),
  name: "General",
};

export const mockCommissionsGallery: Partial<IGallery> = {
  ...mockGallery,
  _id: new mongoose.Types.ObjectId(),
  name: "Commissions",
};

export function createMockGallery(
  userId = mockUserId,
  overrides = {}
): Partial<IGallery> {
  return {
    ...mockGallery,
    _id: new mongoose.Types.ObjectId(),
    userId,
    name: `Gallery ${Date.now()}`,
    ...overrides,
  };
}
