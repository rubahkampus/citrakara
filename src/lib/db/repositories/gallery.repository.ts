// src/lib/db/repositories/gallery.repository.ts
import Gallery, { IGallery } from "@/lib/db/models/gallery.model";
import User              from "@/lib/db/models/user.model";
import { connectDB }     from "@/lib/db/connection";
import { ObjectId }      from "mongoose";

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
/* when a new gallery is created we also push it to user.galleries */
export async function createGallery(userId: string | ObjectId, name: string) {
  await connectDB();

  const gallery = new Gallery({ userId, name, isDeleted: false });
  const session = await Gallery.startSession();
  await session.withTransaction(async () => {
    await gallery.save({ session });
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { galleries: gallery._id } },
      { session }
    );
  });
  session.endSession();
  return gallery;
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

/* NEW helper — single fetch */
export async function findGalleryById(id: string | ObjectId) {
  await connectDB();
  return Gallery.findById(id);
}

/* NEW soft-delete */
export async function softDeleteGallery(
  userId: string | ObjectId,
  galleryId: string | ObjectId
) {
  await connectDB();
  // mark gallery + posts deleted, and pull from user.galleries
  const session = await Gallery.startSession();
  await session.withTransaction(async () => {
    await Gallery.findOneAndUpdate(
      { _id: galleryId, userId },
      { isDeleted: true },
      { session }
    );
    await User.findByIdAndUpdate(
      userId,
      { $pull: { galleries: galleryId } },
      { session }
    );
  });
  session.endSession();
}

