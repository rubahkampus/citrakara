// src/lib/services/galleryPost.service.ts
import { Types } from "mongoose";                  // ⬅︎ add this
import {
  createGalleryPost,
  updateGalleryPost,
  softDeleteGalleryPost,
  findPostById,
  findPostsByGallery,
} from "@/lib/db/repositories/galleryPost.repository";
import { findGalleryById } from "@/lib/db/repositories/gallery.repository";
import { uploadGalleryImagesToR2 } from "../utils/cloudflare";
import { toObjectId } from "../utils/toObjectId";

export async function listGalleryPosts(
  galleryId: string,
  { includeDeleted = false } = {}
) {
  return findPostsByGallery(galleryId, { includeDeleted });
}

export async function addGalleryPostFromForm(
    userId: string,
    formData: FormData
  ) {
    const galleryId = formData.get("galleryId");
    if (!galleryId || typeof galleryId !== "string")
      throw new Error("galleryId missing");
  
    const gallery = await findGalleryById(galleryId);
    if (!gallery || gallery.userId.toString() !== userId)
      throw new Error("Gallery not found");
  
    /* ---- extract blobs ---- */
    const blobs: Blob[] = [];
    formData.forEach((v, k) => {
      if (k === "images[]" && v instanceof Blob) blobs.push(v);
    });
    if (!blobs.length) throw new Error("No images provided");
  
    /* ---- upload to R2 ---- */
    const urls = await uploadGalleryImagesToR2(blobs, userId, galleryId);
  
    /* ---- optional fields ---- */
    const description = formData.get("description");
    const commissionListingId = formData.get("commissionListingId");
    const orderId = formData.get("orderId");
  
    /* ---- persist ---- */
    return createGalleryPost({
      userId: toObjectId(userId),
      galleryId: toObjectId(galleryId),
      images: urls,
      description: typeof description === "string" ? description : "",
      commissionListingId:
        typeof commissionListingId === "string"
          ? toObjectId(commissionListingId)
          : undefined,
      orderId:
        typeof orderId === "string" ? toObjectId(orderId) : undefined,
    });
  }

export async function editGalleryPost(
  userId: string,
  postId: string,
  updates: { images?: string[]; description?: string }
) {
  const post = await findPostById(postId);
  if (!post || post.userId.toString() !== userId) throw new Error("Post not found");

  return updateGalleryPost(postId, updates);
}

export async function deleteGalleryPost(userId: string, postId: string) {
  const post = await findPostById(postId);
  if (!post || post.userId.toString() !== userId) throw new Error("Post not found");

  return softDeleteGalleryPost(postId);
}
