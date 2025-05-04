// src/lib/db/repositories/commissionListing.repository.ts
import { connectDB } from "@/lib/db/connection";
import CommissionListing, {
  ICommissionListing,
} from "@/lib/db/models/commissionListing.model";
import { Types, ClientSession } from "mongoose";

/* ----------------------------- Input DTOs ----------------------------- */

// Pure payload type instead of derived from Mongoose Document
// In src/lib/db/repositories/commissionListing.repository.ts
// Add the price property to the interface

export interface CommissionListingPayload {
  artistId: Types.ObjectId;
  title: string;
  description: { title: string; detail: string }[];
  tags: string[];
  thumbnailIdx: number;
  samples: string[];
  slots: number;
  tos: string;
  type: "template" | "custom";
  flow: "standard" | "milestone";
  deadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number;
    max: number;
    rushFee?: { kind: "flat" | "perDay"; amount: number };
  };
  basePrice: number;
  price: { min: number; max: number }; // Add this property
  cancelationFee: { kind: "flat" | "percentage"; amount: number };
  latePenaltyPercent?: number;
  graceDays?: number;
  currency?: string;
  allowContractChange?: boolean;
  changeable?: string[];
  revisions?: {
    type: "none" | "standard" | "milestone";
    policy?: {
      limit: boolean;
      free: number;
      extraAllowed: boolean;
      fee: number;
    };
  };
  milestones?: Array<{
    title: string;
    percent: number;
    policy?: {
      limit: boolean;
      free: number;
      extraAllowed: boolean;
      fee: number;
    };
  }>;
  generalOptions?: {
    optionGroups?: Array<{
      title: string;
      selections: { label: string; price: number }[];
    }>;
    addons?: { label: string; price: number }[];
    questions?: string[];
  };
  subjectOptions?: Array<{
    title: string;
    limit: number;
    discount?: number;
    optionGroups?: Array<{
      title: string;
      selections: { label: string; price: number }[];
    }>;
    addons?: { label: string; price: number }[];
    questions?: string[];
  }>;
}
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
  payload: CommissionListingPayload,
  session?: ClientSession
) {
  await connectDB();
  console.log("Creating commission listing", payload);
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
  try {
    const q = CommissionListing.findById(id);
    return lean ? q.lean() : q;
  } catch (err) {
    // Handle CastError (invalid ID format)
    if ((err as any).name === "CastError") {
      return null;
    }
    throw err;
  }
}

export async function findActiveListingsByArtist(
  artistId: string | Types.ObjectId
) {
  await connectDB();
  return CommissionListing.find({ artistId, isDeleted: false }).lean();
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

  // Execute queries in parallel for efficiency
  const [items, total] = await Promise.all([
    CommissionListing.find(filter).skip(skip).limit(limit).lean(),
    CommissionListing.countDocuments(filter),
  ]);

  return { items, total };
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
