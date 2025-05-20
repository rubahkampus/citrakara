// src/lib/services/review.service.ts
import { Types } from "mongoose";
import {
  ReviewCreationPayload,
  createReview,
  findReviewById,
  findReviewByUploadId,
  findReviewsByContractId,
  findReviewsByListingId,
  findReviewsByClientId,
  findReviewsByArtistId,
  calculateArtistRatingAverage,
  calculateListingRatingAverage,
} from "@/lib/db/repositories/review.repository";
import {
  findCommissionListingById,
  updateCommissionListing,
} from "@/lib/db/repositories/commissionListing.repository";
import { findUserById } from "@/lib/db/repositories/user.repository";
import { findFinalUploadById } from "@/lib/db/repositories/upload.repository";
import { findContractById } from "../db/repositories/contract.repository";

// Custom error class for HTTP status mapping
export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

/**
 * Create a new review and update related entities with new rating data
 * @param clientId ID of the client creating the review
 * @param uploadId ID of the final upload being reviewed
 * @param data Review data including rating, comment, and selected images
 * @returns The newly created review
 * @throws HttpError if upload not found, already reviewed, or other validation fails
 */
export async function createClientReview(
  clientId: string,
  uploadId: string,
  data: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    selectedImages: string[];
  }
) {
  // 1. Validate the upload exists and is final
  const upload = await findFinalUploadById(uploadId);
  if (!upload) {
    throw new HttpError("Pengiriman final tidak ditemukan", 404);
  }

  if (upload.kind !== "final" || upload.status !== "accepted") {
    throw new HttpError(
      "Hanya pengiriman final yang diterima yang dapat direview",
      400
    );
  }

  // 2. Check if review already exists
  const existingReview = await findReviewByUploadId(uploadId);
  if (existingReview) {
    throw new HttpError("Ulasan sudah dibuat untuk pengiriman ini", 400);
  }

  // 3. Extract all required IDs from the upload
  const { contractId } = upload;

  const contract = await findContractById(contractId);

  if (!contract) {
    throw new HttpError("Kontrak tidak ditemukan", 400);
  }

  // 4. Find the contract to get the listing ID
  const listing = await findCommissionListingById(contract.listingId);
  if (!listing) {
    throw new HttpError("Listing komisaris tidak ditemukan", 404);
  }

  // 5. Create the review
  const reviewPayload: ReviewCreationPayload = {
    uploadId,
    contractId,
    listingId: listing._id,
    artistId: contract.artistId,
    clientId: new Types.ObjectId(clientId),
    rating: data.rating,
    comment: data.comment,
    images: data.selectedImages,
  };

  const newReview = await createReview(reviewPayload);

  // 7. Update listing rating
  const listingRating = await calculateListingRatingAverage(listing._id);
  await updateCommissionListing(listing._id, {
    reviewsSummary: {
      avg: listingRating.avg,
      count: listingRating.count,
    },
  });

  return newReview;
}

/**
 * Get a review by ID
 * @param reviewId ID of the review to retrieve
 * @returns The requested review
 * @throws HttpError if review not found
 */
export async function getReviewById(reviewId: string) {
  const review = await findReviewById(reviewId, { lean: true });
  if (!review) {
    throw new HttpError("Ulasan tidak ditemukan", 404);
  }
  return review;
}

/**
 * Get a review by upload ID
 * @param uploadId Upload ID to find the review for
 * @returns The review for the specified upload or null if not found
 */
export async function getReviewByUploadId(uploadId: string) {
  return findReviewByUploadId(uploadId, { lean: true });
}

/**
 * Get all reviews for a contract
 * @param contractId Contract ID to get reviews for
 * @returns Array of reviews for the specified contract
 */
export async function getReviewsByContractId(contractId: string) {
  return findReviewsByContractId(contractId);
}

/**
 * Get all reviews for a listing
 * @param listingId Listing ID to get reviews for
 * @returns Array of reviews for the specified listing
 */
export async function getReviewsByListingId(listingId: string) {
  return findReviewsByListingId(listingId);
}

/**
 * Get all reviews left by a client
 * @param clientId Client ID to get reviews for
 * @returns Array of reviews created by the specified client
 */
export async function getReviewsByClientId(clientId: string) {
  return findReviewsByClientId(clientId);
}

/**
 * Get all reviews for an artist
 * @param artistId Artist ID to get reviews for
 * @returns Array of reviews for the specified artist
 */
export async function getReviewsByArtistId(artistId: string) {
  return findReviewsByArtistId(artistId);
}

/**
 * Check if a user can review an upload
 * @param userId User ID checking review permissions
 * @param uploadId Upload ID to check if reviewable
 * @returns Boolean indicating if the user can review the upload
 * @throws HttpError if contract not found
 */
export async function canUserReviewUpload(userId: string, uploadId: string) {
  // 1. Find the upload
  const upload = await findFinalUploadById(uploadId);
  if (!upload || upload.kind !== "final" || upload.status !== "accepted") {
    return false;
  }

  const contract = await findContractById(upload.contractId);

  if (!contract) {
    throw new HttpError("Kontrak tidak ditemukan", 400);
  }

  // 2. Check if the user is the client of the contract
  if (contract.clientId.toString() !== userId) {
    return false;
  }

  // 3. Check if a review already exists
  const existingReview = await findReviewByUploadId(uploadId);
  return !existingReview;
}
