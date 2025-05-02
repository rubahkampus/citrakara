// src/lib/db/repositories/galleryPost.repository.ts
import GalleryPost, { IGalleryPost } from "@/lib/db/models/galleryPost.model";
import { connectDB } from "@/lib/db/connection";
import { ObjectId, ClientSession, Types } from "mongoose";

/** ↓ this is the only shape callers must satisfy */
export type GalleryPostCreateInput = {
  userId: Types.ObjectId;
  galleryId: Types.ObjectId;
  images: string[];
  description?: string;
  commissionListingId?: Types.ObjectId;
  orderId?: Types.ObjectId;
};

export async function findPostsByGallery(
  galleryId: string | ObjectId,
  { includeDeleted = false } = {}
) {
  await connectDB();
  return GalleryPost.find({
    galleryId,
    ...(includeDeleted ? {} : { isDeleted: false }),
  });
}

export async function findPostsByUser(
  userId: string | ObjectId,
  { includeDeleted = false } = {}
) {
  await connectDB();
  return GalleryPost.find({
    userId,
    ...(includeDeleted ? {} : { isDeleted: false }),
  }).sort({ createdAt: -1 });
}

export async function findPostById(id: string | ObjectId) {
  await connectDB();
  return GalleryPost.findById(id);
}

export async function createGalleryPost(
  payload: GalleryPostCreateInput,
  session?: ClientSession
) {
  await connectDB();
  const post = new GalleryPost({ ...payload, isDeleted: false });
  return post.save({ session });
}

export async function updateGalleryPost(
  postId: string | ObjectId,
  updates: Partial<Pick<IGalleryPost, "images" | "description">>,
  session?: ClientSession
) {
  await connectDB();
  return GalleryPost.findByIdAndUpdate(postId, updates, {
    new: true,
    session,
  });
}

export async function softDeleteGalleryPost(
  postId: string | ObjectId,
  session?: ClientSession
) {
  await connectDB();
  return GalleryPost.findByIdAndUpdate(
    postId,
    { isDeleted: true },
    { session }
  );
}

/* bulk-delete when a gallery is removed */
export async function softDeletePostsByGallery(
  galleryId: string | ObjectId,
  session?: ClientSession
) {
  await connectDB();
  return GalleryPost.updateMany(
    { galleryId },
    { isDeleted: true },
    { session }
  );
}
