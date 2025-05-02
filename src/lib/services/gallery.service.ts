// src/lib/services/gallery.service.ts
import mongoose from "mongoose";
import {
  createGallery,
  findGalleriesByUserId,
  findGalleryById,
  updateGallery,
  softDeleteGallery,
} from "@/lib/db/repositories/gallery.repository";
import { softDeletePostsByGallery } from "@/lib/db/repositories/galleryPost.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";

const DEFAULT_GALLERY_NAMES = ["General", "Commissions"] as const;

/**
 * Get all galleries for the specified user
 */
export async function getUserGalleries(userId: string) {
  return findGalleriesByUserId(userId);
}

/**
 * Create a new gallery for the user
 */
export async function createUserGallery(userId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 50) {
    throw new Error("Gallery name must be between 1 and 50 characters");
  }
  return createGallery(userId, trimmedName);
}

/**
 * Rename an existing gallery
 * Validates ownership and prevents renaming default galleries
 */
export async function renameGallery(
  userId: string,
  galleryId: string,
  name: string
) {
  const gallery = await findGalleryById(galleryId);
  if (!gallery || gallery.userId.toString() !== userId) {
    throw new Error("Gallery not found");
  }

  if (DEFAULT_GALLERY_NAMES.includes(gallery.name as any)) {
    throw new Error("Default galleries cannot be renamed");
  }

  return updateGallery(galleryId, { name: name.trim() });
}

/**
 * Delete a gallery and all its posts (soft delete)
 * Validates ownership and prevents deleting default galleries
 */
export async function deleteGallery(userId: string, galleryId: string) {
  const gallery = await findGalleryById(galleryId);
  if (!gallery || gallery.userId.toString() !== userId) {
    throw new Error("Gallery not found");
  }

  if (DEFAULT_GALLERY_NAMES.includes(gallery.name as any)) {
    throw new Error("Default galleries cannot be deleted");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await softDeleteGallery(userId, galleryId);
      await softDeletePostsByGallery(galleryId, session);
    });
  } finally {
    session.endSession();
  }
}

/**
 * Get public galleries for a user by username
 */
export async function getGalleriesByUsername(username: string) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }
  return findGalleriesByUserId(user._id);
}
