// src/lib/services/galleryPost.service.ts
import { Types } from "mongoose";
import {
  createGalleryPost,
  updateGalleryPost,
  softDeleteGalleryPost,
  findPostById,
  findPostsByGallery,
  findPostsByUser,
} from "@/lib/db/repositories/galleryPost.repository";
import { findGalleryById } from "@/lib/db/repositories/gallery.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";
import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";
import { toObjectId } from "@/lib/utils/toObjectId";

/**
 * List all posts in a gallery with optional filter for deleted posts
 * @param galleryId Gallery ID to list posts from
 * @param options Optional parameters including whether to include deleted posts
 * @returns Array of gallery posts for the specified gallery
 */
export async function listGalleryPosts(
  galleryId: string,
  { includeDeleted = false } = {}
) {
  return findPostsByGallery(galleryId, { includeDeleted });
}

/**
 * Get all posts for a specific user by username
 * @param username Username to get posts for
 * @param options Optional parameters including whether to include deleted posts
 * @returns Array of gallery posts created by the user
 * @throws Error if user not found
 */
export async function getUserPosts(
  username: string,
  { includeDeleted = false } = {}
) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  return findPostsByUser(user._id, { includeDeleted });
}

/**
 * Create a new gallery post from form data with image uploads
 * @param userId User ID creating the post
 * @param formData Form data containing gallery ID, images and optional metadata
 * @returns The newly created gallery post
 * @throws Error if gallery not found, access denied, or invalid inputs
 */
export async function addGalleryPostFromForm(
  userId: string,
  formData: FormData
) {
  // Validate gallery ownership
  const galleryId = formData.get("galleryId");
  if (!galleryId || typeof galleryId !== "string") {
    throw new Error("Gallery ID is required");
  }

  const gallery = await findGalleryById(galleryId);
  if (!gallery || gallery.userId.toString() !== userId) {
    throw new Error("Gallery not found or access denied");
  }

  // Extract and validate image blobs
  const blobs: Blob[] = [];
  formData.forEach((value, key) => {
    if (key === "images[]" && value instanceof Blob) {
      blobs.push(value);
    }
  });

  if (blobs.length === 0) {
    throw new Error("At least one image is required");
  }

  // Upload images to Cloudflare R2
  const imageUrls = await uploadGalleryImagesToR2(blobs, userId, galleryId);

  // Extract optional metadata
  const description = formData.get("description");
  const commissionListingId = formData.get("commissionListingId");
  const orderId = formData.get("orderId");

  // Create post record
  return createGalleryPost({
    userId: toObjectId(userId),
    galleryId: toObjectId(galleryId),
    images: imageUrls,
    description: typeof description === "string" ? description : "",
    commissionListingId:
      typeof commissionListingId === "string"
        ? toObjectId(commissionListingId)
        : undefined,
    orderId: typeof orderId === "string" ? toObjectId(orderId) : undefined,
  });
}

/**
 * Update an existing gallery post
 * Validates ownership before allowing edit
 * @param userId User ID attempting to edit the post
 * @param postId ID of the post to update
 * @param updates Object containing fields to update (images and/or description)
 * @returns The updated gallery post
 * @throws Error if post not found or access denied
 */
export async function editGalleryPost(
  userId: string,
  postId: string,
  updates: { images?: string[]; description?: string }
) {
  const post = await findPostById(postId);
  if (!post || post.userId.toString() !== userId) {
    throw new Error("Post not found or access denied");
  }

  return updateGalleryPost(postId, updates);
}

/**
 * Soft delete a gallery post
 * Validates ownership before allowing deletion
 * @param userId User ID attempting to delete the post
 * @param postId ID of the post to delete
 * @returns The deleted gallery post
 * @throws Error if post not found or access denied
 */
export async function deleteGalleryPost(userId: string, postId: string) {
  const post = await findPostById(postId);
  if (!post || post.userId.toString() !== userId) {
    throw new Error("Post not found or access denied");
  }

  return softDeleteGalleryPost(postId);
}

/**
 * Get posts for a public gallery
 * Validates both user and gallery exist and are accessible
 * @param username Username of the gallery owner
 * @param galleryId ID of the gallery to get posts from
 * @returns Array of public gallery posts
 * @throws Error if user or gallery not found or access denied
 */
export async function getGalleryPostsPublic(
  username: string,
  galleryId: string
) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const gallery = await findGalleryById(galleryId);
  if (
    !gallery ||
    gallery.userId.toString() !== user._id.toString() ||
    gallery.isDeleted
  ) {
    throw new Error("Gallery not found");
  }

  return findPostsByGallery(galleryId); // This filters deleted posts by default
}

/**
 * Get a single post by ID for public viewing
 * Validates ownership and accessibility
 * @param username Username of the gallery owner
 * @param galleryId ID of the gallery containing the post
 * @param postId ID of the post to retrieve
 * @returns The requested gallery post
 * @throws Error if gallery or post not found or access denied
 */
export async function getGalleryPostPublic(
  username: string,
  galleryId: string,
  postId: string
) {
  // First validate the gallery is accessible
  await getGalleryPostsPublic(username, galleryId);

  const post = await findPostById(postId);
  if (!post || post.isDeleted || post.galleryId.toString() !== galleryId) {
    throw new Error("Post not found");
  }

  return post;
}

/**
 * Get a single post by ID for public viewing
 * @param postId ID of the post to retrieve
 * @returns The requested gallery post
 * @throws Error if post not found or is deleted
 */
export async function getGalleryPostById(postId: string) {
  const post = await findPostById(postId);
  if (!post || post.isDeleted) {
    throw new Error("Post not found");
  }

  return post;
}
