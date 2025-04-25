// src//lib/db/repositories/commissionListing.ts
import { connectDB } from "@/lib/db/connection";
import CommissionListing, {
  ICommissionListing,
} from "@/lib/db/models/commissionListing.model";
import { Types, ClientSession } from "mongoose";

/* ----------------------------- Input DTOs ----------------------------- */

export type CommissionListingCreateInput = Omit<
  ICommissionListing,
  | "_id"
  | "slotsUsed"
  | "isActive"
  | "isDeleted"
  | "reviewsSummary"
  | "createdAt"
  | "updatedAt"
> & { slotsUsed?: number };

export type CommissionListingUpdateInput = Partial<
  Pick<
    ICommissionListing,
    | "isActive"
    | "isDeleted"
    | "slots"
    | "slotsUsed"
    | "latePenaltyPercent"
    | "graceDays"
  >
>;

/* ----------------------------- CRUD helpers --------------------------- */

export async function createCommissionListing(
  payload: CommissionListingCreateInput,
  session?: ClientSession
) {
  await connectDB();
  const doc = new CommissionListing({
    ...payload,
    isActive: true,
    isDeleted: false,
    reviewsSummary: { avg: 0, count: 0 },
  });
  return doc.save({ session });
}

export async function findCommissionListingById(
  id: string | Types.ObjectId,
  { lean = false }: { lean?: boolean } = {}
) {
  await connectDB();
  const q = CommissionListing.findById(id);
  return lean ? q.lean() : q;
}

export async function findActiveListingsByArtist(
  artistId: string | Types.ObjectId
) {
  await connectDB();
  return CommissionListing.find({ artistId, isDeleted: false });
}

/** Public search –  simple tag/keyword filter */
export async function searchListings({
  text,
  tags,
  artistId,
  skip = 0,
  limit = 20,
}: {
  text?: string;
  tags?: string[];
  artistId?: string;
  skip?: number;
  limit?: number;
}) {
  await connectDB();

  const filter: Record<string, any> = {
    isActive: true,
    isDeleted: false,
  };

  if (artistId) filter.artistId = artistId;
  if (tags?.length) filter.tags = { $in: tags };
  if (text) filter.$text = { $search: text };

  return CommissionListing.find(filter).skip(skip).limit(limit);
}

/** Generic atomic update */
export async function updateCommissionListing(
  id: string | Types.ObjectId,
  updates: CommissionListingUpdateInput,
  session?: ClientSession
) {
  await connectDB();
  return CommissionListing.findByIdAndUpdate(id, updates, {
    new: true,
    session,
  });
}

/** Adjust slotsUsed by ±n (for order create/cancel) */
export async function adjustSlotsUsed(
  id: string | Types.ObjectId,
  delta: number,
  session?: ClientSession
) {
  await connectDB();
  return CommissionListing.findByIdAndUpdate(
    id,
    { $inc: { slotsUsed: delta } },
    { new: true, session }
  );
}

/** Soft delete */
export async function softDeleteListing(
  artistId: string | Types.ObjectId,
  listingId: string | Types.ObjectId,
  session?: ClientSession
) {
  await connectDB();
  return CommissionListing.findOneAndUpdate(
    { _id: listingId, artistId },
    { isDeleted: true, isActive: false },
    { new: true, session }
  );
}
