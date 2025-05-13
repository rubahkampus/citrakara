// src/lib/services/__tests__/gallery.service.test.ts
import mongoose from "mongoose";
import * as galleryService from "../gallery.service";
import * as galleryRepository from "../../db/repositories/gallery.repository";
import * as galleryPostRepository from "../../db/repositories/galleryPost.repository";
import * as userRepository from "../../db/repositories/user.repository";
import {
  createMockGallery,
  mockGeneralGallery,
  mockCommissionsGallery,
} from "../../db/models/__mocks__/gallery.mock";
import { createMockUser } from "../../db/models/__mocks__/user.mock";

// Mock all repository functions
jest.mock("../../db/repositories/gallery.repository");
jest.mock("../../db/repositories/galleryPost.repository");
jest.mock("../../db/repositories/user.repository");
jest.mock("mongoose");

describe("Gallery Service", () => {
  const testUserId = new mongoose.Types.ObjectId().toString();
  const username = "testuser";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserGalleries", () => {
    it("should return all galleries for a user", async () => {
      const mockGalleries = [
        createMockGallery(new mongoose.Types.ObjectId(testUserId), {
          name: "General",
        }),
        createMockGallery(new mongoose.Types.ObjectId(testUserId), {
          name: "Commissions",
        }),
      ];
      jest
        .spyOn(galleryRepository, "findGalleriesByUserId")
        .mockResolvedValue(mockGalleries as any);

      const result = await galleryService.getUserGalleries(testUserId);

      expect(result).toEqual(mockGalleries);
      expect(galleryRepository.findGalleriesByUserId).toHaveBeenCalledWith(
        testUserId
      );
    });
  });

  describe("createUserGallery", () => {
    it("should create a new gallery with a valid name", async () => {
      const galleryName = "New Gallery";
      const mockGallery = createMockGallery(
        new mongoose.Types.ObjectId(testUserId),
        { name: galleryName }
      );
      jest
        .spyOn(galleryRepository, "createGallery")
        .mockResolvedValue(mockGallery as any);

      const result = await galleryService.createUserGallery(
        testUserId,
        galleryName
      );

      expect(result).toEqual(mockGallery);
      expect(galleryRepository.createGallery).toHaveBeenCalledWith(
        testUserId,
        galleryName
      );
    });

    it("should trim gallery name before creating", async () => {
      const galleryName = "  New Gallery  ";
      const trimmedName = "New Gallery";
      const mockGallery = createMockGallery(
        new mongoose.Types.ObjectId(testUserId),
        { name: trimmedName }
      );
      jest
        .spyOn(galleryRepository, "createGallery")
        .mockResolvedValue(mockGallery as any);

      const result = await galleryService.createUserGallery(
        testUserId,
        galleryName
      );

      expect(result).toEqual(mockGallery);
      expect(galleryRepository.createGallery).toHaveBeenCalledWith(
        testUserId,
        trimmedName
      );
    });

    it("should throw an error if gallery name is empty", async () => {
      await expect(
        galleryService.createUserGallery(testUserId, "  ")
      ).rejects.toThrow("Gallery name must be between 1 and 50 characters");
    });

    it("should throw an error if gallery name is too long", async () => {
      const tooLongName = "A".repeat(51);
      await expect(
        galleryService.createUserGallery(testUserId, tooLongName)
      ).rejects.toThrow("Gallery name must be between 1 and 50 characters");
    });
  });

  describe("renameGallery", () => {
    const galleryId = new mongoose.Types.ObjectId().toString();

    it("should rename a gallery that user owns", async () => {
      const existingGallery = createMockGallery(
        new mongoose.Types.ObjectId(testUserId),
        {
          _id: new mongoose.Types.ObjectId(galleryId),
          name: "Original Name",
        }
      );
      const newName = "New Name";
      const updatedGallery = { ...existingGallery, name: newName };

      jest
        .spyOn(galleryRepository, "findGalleryById")
        .mockResolvedValue(existingGallery as any);
      jest
        .spyOn(galleryRepository, "updateGallery")
        .mockResolvedValue(updatedGallery as any);

      const result = await galleryService.renameGallery(
        testUserId,
        galleryId,
        newName
      );

      expect(result).toEqual(updatedGallery);
      expect(galleryRepository.findGalleryById).toHaveBeenCalledWith(galleryId);
      expect(galleryRepository.updateGallery).toHaveBeenCalledWith(galleryId, {
        name: newName,
      });
    });

    it("should throw an error if gallery not found", async () => {
      jest.spyOn(galleryRepository, "findGalleryById").mockResolvedValue(null);

      await expect(
        galleryService.renameGallery(testUserId, galleryId, "New Name")
      ).rejects.toThrow("Gallery not found");
    });

    it("should throw an error if user does not own gallery", async () => {
      const differentUserId = new mongoose.Types.ObjectId().toString();
      const existingGallery = createMockGallery(
        new mongoose.Types.ObjectId(differentUserId),
        {
          _id: new mongoose.Types.ObjectId(galleryId),
          name: "Original Name",
        }
      );

      jest
        .spyOn(galleryRepository, "findGalleryById")
        .mockResolvedValue(existingGallery as any);

      await expect(
        galleryService.renameGallery(testUserId, galleryId, "New Name")
      ).rejects.toThrow("Gallery not found");
    });

    it("should throw an error if trying to rename a default gallery", async () => {
      const generalGallery = {
        ...mockGeneralGallery,
        _id: new mongoose.Types.ObjectId(galleryId),
        userId: new mongoose.Types.ObjectId(testUserId),
      };

      jest
        .spyOn(galleryRepository, "findGalleryById")
        .mockResolvedValue(generalGallery as any);

      await expect(
        galleryService.renameGallery(testUserId, galleryId, "New Name")
      ).rejects.toThrow("Default galleries cannot be renamed");
    });
  });

  describe("deleteGallery", () => {
    const galleryId = new mongoose.Types.ObjectId().toString();
    const mockSession = {} as mongoose.ClientSession;

    beforeEach(() => {
      mockSession.withTransaction = jest
        .fn()
        .mockImplementation((callback) => callback());
      jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    });

    it("should delete a gallery that user owns", async () => {
      const existingGallery = createMockGallery(
        new mongoose.Types.ObjectId(testUserId),
        {
          _id: new mongoose.Types.ObjectId(galleryId),
          name: "Custom Gallery",
        }
      );

      jest
        .spyOn(galleryRepository, "findGalleryById")
        .mockResolvedValue(existingGallery as any);
      jest.spyOn(galleryRepository, "softDeleteGallery").mockResolvedValue();
      jest
        .spyOn(galleryPostRepository, "softDeletePostsByGallery")
        // .mockResolvedValue();

      await galleryService.deleteGallery(testUserId, galleryId);

      expect(galleryRepository.findGalleryById).toHaveBeenCalledWith(galleryId);
      expect(galleryRepository.softDeleteGallery).toHaveBeenCalledWith(
        testUserId,
        galleryId
      );
      expect(
        galleryPostRepository.softDeletePostsByGallery
      ).toHaveBeenCalledWith(galleryId, mockSession);
    });

    it("should throw an error if gallery not found", async () => {
      jest.spyOn(galleryRepository, "findGalleryById").mockResolvedValue(null);

      await expect(
        galleryService.deleteGallery(testUserId, galleryId)
      ).rejects.toThrow("Gallery not found");
    });

    it("should throw an error if user does not own gallery", async () => {
      const differentUserId = new mongoose.Types.ObjectId().toString();
      const existingGallery = createMockGallery(
        new mongoose.Types.ObjectId(differentUserId),
        {
          _id: new mongoose.Types.ObjectId(galleryId),
          name: "Custom Gallery",
        }
      );

      jest
        .spyOn(galleryRepository, "findGalleryById")
        .mockResolvedValue(existingGallery as any);

      await expect(
        galleryService.deleteGallery(testUserId, galleryId)
      ).rejects.toThrow("Gallery not found");
    });

    it("should throw an error if trying to delete a default gallery", async () => {
      const generalGallery = {
        ...mockGeneralGallery,
        _id: new mongoose.Types.ObjectId(galleryId),
        userId: new mongoose.Types.ObjectId(testUserId),
      };

      jest
        .spyOn(galleryRepository, "findGalleryById")
        .mockResolvedValue(generalGallery as any);

      await expect(
        galleryService.deleteGallery(testUserId, galleryId)
      ).rejects.toThrow("Default galleries cannot be deleted");
    });
  });

  describe("getGalleriesByUsername", () => {
    it("should return galleries for a valid username", async () => {
      const mockUser = createMockUser({ username });
      const mockGalleries = [
        createMockGallery(mockUser._id, { name: "General" }),
        createMockGallery(mockUser._id, { name: "Commissions" }),
      ];

      jest
        .spyOn(userRepository, "findUserByUsername")
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(galleryRepository, "findGalleriesByUserId")
        .mockResolvedValue(mockGalleries as any);

      const result = await galleryService.getGalleriesByUsername(username);

      expect(result).toEqual(mockGalleries);
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(username);
      expect(galleryRepository.findGalleriesByUserId).toHaveBeenCalledWith(
        mockUser._id
      );
    });

    it("should throw an error if user not found", async () => {
      jest.spyOn(userRepository, "findUserByUsername").mockResolvedValue(null);

      await expect(
        galleryService.getGalleriesByUsername(username)
      ).rejects.toThrow("User not found");
    });
  });
});
