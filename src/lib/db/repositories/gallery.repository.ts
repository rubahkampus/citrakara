// src/lib/db/repositories/gallery.repository.ts
import Gallery from "@/lib/db/models/gallery.model";
import { connectDB } from "@/lib/db/connection";
import { ObjectId } from "mongoose";

/**
 * Create default galleries for a new user
 */
export async function createDefaultGalleries(userId: string | ObjectId) {
  await connectDB();
  
  // Create the two default galleries: "General" and "Commissions"
  const generalGallery = new Gallery({
    userId,
    name: "General",
    isDeleted: false,
  });

  const commissionsGallery = new Gallery({
    userId,
    name: "Commissions",
    isDeleted: false,
  });

  const [general, commissions] = await Promise.all([
    generalGallery.save(),
    commissionsGallery.save(),
  ]);

  return [general, commissions];
}

/**
 * Find all galleries for a user
 */
export async function findGalleriesByUserId(userId: string | ObjectId) {
  await connectDB();
  return Gallery.find({ userId, isDeleted: false });
}

/**
 * Create a new gallery for a user
 */
export async function createGallery(userId: string | ObjectId, name: string) {
  await connectDB();
  
  const gallery = new Gallery({
    userId,
    name,
    isDeleted: false,
  });

  return gallery.save();
}

/**
 * Update a gallery
 */
export async function updateGallery(
  galleryId: string | ObjectId,
  updates: { name?: string; isDeleted?: boolean }
) {
  await connectDB();
  return Gallery.findByIdAndUpdate(galleryId, updates, { new: true });
}