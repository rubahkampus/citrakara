import { connectDB } from "@/lib/db/connection";
import Review, { IReview } from "@/lib/db/models/review.model";
import { Types, ClientSession } from "mongoose";

export interface ReviewCreationPayload {
  uploadId: string | Types.ObjectId;
  contractId: string | Types.ObjectId;
  listingId: string | Types.ObjectId;
  artistId: string | Types.ObjectId;
  clientId: string | Types.ObjectId;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  images?: string[];
}

/**
 * Create a new review
 */
export async function createReview(
  payload: ReviewCreationPayload,
  session?: ClientSession
) {
  await connectDB();

  // Check if a review already exists for this upload
  const existingReview = await Review.findOne({ uploadId: payload.uploadId });
  if (existingReview) {
    throw new Error("A review already exists for this upload");
  }

  const review = new Review(payload);
  return review.save({ session });
}

/**
 * Find a review by its ID
 */
export async function findReviewById(
  id: string | Types.ObjectId,
  { lean = false }: { lean?: boolean } = {}
) {
  await connectDB();
  try {
    const q = Review.findById(id);
    return lean ? q.lean() : q;
  } catch (err) {
    if ((err as any).name === "CastError") {
      return null;
    }
    throw err;
  }
}

/**
 * Find a review by upload ID
 */
export async function findReviewByUploadId(
  uploadId: string | Types.ObjectId,
  { lean = false }: { lean?: boolean } = {}
) {
  await connectDB();
  try {
    const q = Review.findOne({ uploadId });
    return lean ? q.lean() : q;
  } catch (err) {
    if ((err as any).name === "CastError") {
      return null;
    }
    throw err;
  }
}

/**
 * Find all reviews for a contract
 */
export async function findReviewsByContractId(
  contractId: string | Types.ObjectId,
  { lean = true }: { lean?: boolean } = {}
) {
  await connectDB();
  const q = Review.find({ contractId }).sort({ createdAt: -1 });
  return lean ? q.lean() : q;
}

/**
 * Find all reviews for a listing
 */
export async function findReviewsByListingId(
  listingId: string | Types.ObjectId,
  { lean = true }: { lean?: boolean } = {}
) {
  await connectDB();
  const q = Review.find({ listingId }).sort({ createdAt: -1 });
  return lean ? q.lean() : q;
}

/**
 * Find all reviews left by a client
 */
export async function findReviewsByClientId(
  clientId: string | Types.ObjectId,
  { lean = true }: { lean?: boolean } = {}
) {
  await connectDB();
  const q = Review.find({ clientId }).sort({ createdAt: -1 });
  return lean ? q.lean() : q;
}

/**
 * Find all reviews for an artist
 */
export async function findReviewsByArtistId(
  artistId: string | Types.ObjectId,
  { lean = true }: { lean?: boolean } = {}
) {
  await connectDB();
  const q = Review.find({ artistId }).sort({ createdAt: -1 });
  return lean ? q.lean() : q;
}

/**
 * Calculate average rating for an artist
 */
export async function calculateArtistRatingAverage(
  artistId: string | Types.ObjectId
) {
  await connectDB();

  const result = await Review.aggregate([
    { $match: { artistId: new Types.ObjectId(artistId.toString()) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { avg: 0, count: 0 };
  }

  return {
    avg: parseFloat(result[0].averageRating.toFixed(2)),
    count: result[0].count,
  };
}

/**
 * Calculate average rating for a listing
 */
export async function calculateListingRatingAverage(
  listingId: string | Types.ObjectId
) {
  await connectDB();

  const result = await Review.aggregate([
    { $match: { listingId: new Types.ObjectId(listingId.toString()) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { avg: 0, count: 0 };
  }

  return {
    avg: parseFloat(result[0].averageRating.toFixed(2)),
    count: result[0].count,
  };
}
