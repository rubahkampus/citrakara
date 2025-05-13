// src/lib/db/repositories/__tests__/gallery.repository.test.ts
import mongoose from "mongoose";
import * as galleryRepo from "../gallery.repository";
import Gallery from "../../models/gallery.model";
import User from "../../models/user.model";
import { createMockUser } from "../../models/__mocks__/user.mock";
import {
  createMockGallery,
  mockGeneralGallery,
  mockCommissionsGallery,
} from "../../models/__mocks__/gallery.mock";

jest.mock("../wallet.repository");
jest.mock("../tos.repository");

describe("Gallery Repository", () => {
  let testUserId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    testUserId = new mongoose.Types.ObjectId();

    // Create a test user
    const mockUser = createMockUser({ _id: testUserId });
    await new User({
      ...mockUser,
      galleries: [], // Start with empty galleries
    }).save();
  });

  describe("createDefaultGalleries", () => {
    it("should create default General and Commissions galleries", async () => {
      const galleries = await galleryRepo.createDefaultGalleries(
        testUserId.toString()
      );

      expect(galleries).toHaveLength(2);
      expect(galleries[0].name).toBe("General");
      expect(galleries[1].name).toBe("Commissions");

      // Check they were saved to the database
      const dbGalleries = await Gallery.find({ userId: testUserId });
      expect(dbGalleries).toHaveLength(2);

      // Verify they have the correct names
      const galleryNames = dbGalleries.map((g) => g.name);
      expect(galleryNames).toContain("General");
      expect(galleryNames).toContain("Commissions");
    });
  });

  describe("findGalleriesByUserId", () => {
    it("should find all non-deleted galleries for a user", async () => {
      // Create some galleries
      await new Gallery({ ...mockGeneralGallery, userId: testUserId }).save();
      await new Gallery({
        ...mockCommissionsGallery,
        userId: testUserId,
      }).save();
      await new Gallery({
        ...createMockGallery(testUserId, { name: "Custom Gallery" }),
      }).save();

      // Create a deleted gallery
      await new Gallery({
        ...createMockGallery(testUserId, {
          name: "Deleted Gallery",
          isDeleted: true,
        }),
      }).save();

      // Find galleries
      const galleries = await galleryRepo.findGalleriesByUserId(
        testUserId.toString()
      );

      expect(galleries).toHaveLength(3); // Should not include the deleted one

      // Verify gallery names (non-deleted only)
      const galleryNames = galleries.map((g) => g.name);
      expect(galleryNames).toContain("General");
      expect(galleryNames).toContain("Commissions");
      expect(galleryNames).toContain("Custom Gallery");
      expect(galleryNames).not.toContain("Deleted Gallery");
    });

    it("should return empty array if no galleries found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const galleries = await galleryRepo.findGalleriesByUserId(
        nonExistentId.toString()
      );

      expect(galleries).toHaveLength(0);
    });
  });

  describe("createGallery", () => {
    it("should create a new gallery and add it to user galleries", async () => {
      const galleryName = "New Test Gallery";
      const gallery = await galleryRepo.createGallery(
        testUserId.toString(),
        galleryName
      );

      expect(gallery).toBeDefined();
      expect(gallery.name).toBe(galleryName);
      expect(gallery.userId.toString()).toBe(testUserId.toString());
      expect(gallery.isDeleted).toBe(false);

      // Verify it was saved to the database
      const foundGallery = await Gallery.findById(gallery._id);
      expect(foundGallery).toBeDefined();
      expect(foundGallery!.name).toBe(galleryName);

      // Verify it was added to the user's galleries array
      const user = await User.findById(testUserId);
      expect(user!.galleries).toContainEqual(gallery._id);
    });
  });

  describe("updateGallery", () => {
    it("should update a gallery name", async () => {
      // Create a gallery first
      const gallery = await new Gallery({
        userId: testUserId,
        name: "Original Name",
        isDeleted: false,
      }).save();

      // Update the gallery
      const newName = "Updated Name";
      const updatedGallery = await galleryRepo.updateGallery(gallery._id, {
        name: newName,
      });

      expect(updatedGallery).toBeDefined();
      expect(updatedGallery!.name).toBe(newName);

      // Verify it was updated in the database
      const foundGallery = await Gallery.findById(gallery._id);
      expect(foundGallery!.name).toBe(newName);
    });
  });

  describe("findGalleryById", () => {
    it("should find a gallery by ID", async () => {
      // Create a gallery first
      const gallery = await new Gallery({
        userId: testUserId,
        name: "Test Gallery",
        isDeleted: false,
      }).save();

      // Find the gallery
      const foundGallery = await galleryRepo.findGalleryById(gallery._id);

      expect(foundGallery).toBeDefined();
      expect(foundGallery!._id.toString()).toBe(gallery._id.toString());
      expect(foundGallery!.name).toBe("Test Gallery");
    });

    it("should return null if gallery not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const gallery = await galleryRepo.findGalleryById(
        nonExistentId.toString()
      );

      expect(gallery).toBeNull();
    });
  });

  describe("softDeleteGallery", () => {
    it("should mark a gallery as deleted and remove it from user galleries", async () => {
      // Create a gallery first
      const gallery = await new Gallery({
        userId: testUserId,
        name: "Gallery to Delete",
        isDeleted: false,
      }).save();

      // Add gallery to user
      await User.findByIdAndUpdate(testUserId, {
        $push: { galleries: gallery._id },
      });

      // Soft delete the gallery
      await galleryRepo.softDeleteGallery(testUserId.toString(), gallery._id);

      // Verify it's marked as deleted
      const foundGallery = await Gallery.findById(gallery._id);
      expect(foundGallery!.isDeleted).toBe(true);

      // Verify it's removed from user galleries
      const user = await User.findById(testUserId);
      expect(user!.galleries).not.toContainEqual(gallery._id);
    });
  });
});
