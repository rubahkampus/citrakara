// src/lib/db/repositories/commissionListing.repository.ts
import { connectDB } from "@/lib/db/connection";
import CommissionListing, {
  ICommissionListing,
} from "@/lib/db/models/commissionListing.model";
import { Types, ClientSession } from "mongoose";

/* ----------------------------- Input DTOs ----------------------------- */
// Define ID type to match the model
type ID = number;

// Pure payload type instead of derived from Mongoose Document
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
  price: { min: number; max: number };
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
    id: ID;
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
      id: ID;
      title: string;
      selections: Array<{ id: ID; label: string; price: number }>;
    }>;
    addons?: Array<{ id: ID; label: string; price: number }>;
    questions?: Array<{ id: ID; label: string }>;
  };
  subjectOptions?: Array<{
    id: ID;
    title: string;
    limit: number;
    discount?: number;
    optionGroups?: Array<{
      id: ID;
      title: string;
      selections: Array<{ id: ID; label: string; price: number }>;
    }>;
    addons?: Array<{ id: ID; label: string; price: number }>;
    questions?: Array<{ id: ID; label: string }>;
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
  console.log("Creating commission listing", JSON.stringify(payload));

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
  label,
  tags,
  artistId,
  skip = 0,
  limit = 20,
}: {
  label?: string;
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
  if (label) filter.$label = { $search: label };

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

/** Update specific components with IDs */
export async function updateCommissionListingComponents(
  id: string | Types.ObjectId,
  updates: Partial<CommissionListingPayload>,
  session?: ClientSession
) {
  await connectDB();

  // Process the updates to ensure IDs are properly maintained
  const processedUpdates: Record<string, any> = { ...updates };

  // Handle milestones update if present
  if (updates.milestones) {
    // Fetch current milestones to preserve IDs
    const listing = await CommissionListing.findById(id).lean();
    if (listing && 'milestones' in listing) {
      const currentMilestoneMap = new Map(
        (listing.milestones as { title: string; id: number }[]).map((m) => [m.title, m.id])
      );

      processedUpdates.milestones = updates.milestones.map((m, idx) => ({
        ...m,
        id: m.id ?? currentMilestoneMap.get(m.title) ?? idx + 1,
      }));
    }
  }

  // Similar processing for generalOptions and subjectOptions if needed
  // This would follow the same pattern as above

  return CommissionListing.findByIdAndUpdate(id, processedUpdates, {
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

/**
 * Helper functions for managing components with IDs
 */

/**
 * Adds a question to either generalOptions or a specific subjectOption
 */
export async function addQuestion(
  listingId: string | Types.ObjectId,
  questionlabel: string,
  target: { type: "general" } | { type: "subject"; subjectId: ID },
  session?: ClientSession
) {
  await connectDB();

  const listing = await CommissionListing.findById(listingId);
  if (!listing) return null;

  // Generate a new ID based on existing questions
  let newId = 1;

  if (target.type === "general") {
    // Add to general options questions
    if (!listing.generalOptions) {
      listing.generalOptions = { questions: [] };
    } else if (!listing.generalOptions.questions) {
      listing.generalOptions.questions = [];
    }

    // Find highest ID and increment
    newId =
      Math.max(
        0,
        ...listing.generalOptions.questions.map((q: { id: number } | string) =>
          typeof q === "string" ? 0 : q.id
        )
      ) + 1;

    // Add new question
    listing.generalOptions.questions.push({ id: newId, label: questionlabel });
  } else {
    // Add to subject options questions
    if (!listing.subjectOptions || !listing.subjectOptions.length) {
      return null; // No subjects to add to
    }

    const subjectIndex = listing.subjectOptions.findIndex(
      (s: { id: ID }) => s.id === target.subjectId
    );
    if (subjectIndex === -1) return null;

    if (!listing.subjectOptions[subjectIndex].questions) {
      listing.subjectOptions[subjectIndex].questions = [];
    }

    // Find highest ID and increment
    newId =
      Math.max(
        0,
        ...listing.subjectOptions[subjectIndex].questions.map((q: { id: number } | string) =>
          typeof q === "string" ? 0 : q.id
        )
      ) + 1;

    // Add new question
    listing.subjectOptions[subjectIndex].questions.push({
      id: newId,
      label: questionlabel,
    });
  }

  return listing.save({ session });
}

/**
 * Removes a question by ID
 */
export async function removeQuestion(
  listingId: string | Types.ObjectId,
  target:
    | { type: "general"; questionId: ID }
    | { type: "subject"; subjectId: ID; questionId: ID },
  session?: ClientSession
) {
  await connectDB();

  if (target.type === "general") {
    return CommissionListing.findByIdAndUpdate(
      listingId,
      { $pull: { "generalOptions.questions": { id: target.questionId } } },
      { new: true, session }
    );
  } else {
    // This is more complex - we need to find the specific subject and update its questions
    const listing = await CommissionListing.findById(listingId);
    if (!listing || !listing.subjectOptions) return null;

    const subjectIndex = listing.subjectOptions.findIndex(
      (s: { id: ID }) => s.id === target.subjectId
    );
    if (subjectIndex === -1) return null;

    if (!listing.subjectOptions[subjectIndex].questions) return listing;

    listing.subjectOptions[subjectIndex].questions = listing.subjectOptions[
      subjectIndex
    ].questions.filter(
      (q: { id: number } | string) => typeof q === "string" || q.id !== target.questionId
    );

    return listing.save({ session });
  }
}

// Similar helper functions could be added for managing other components with IDs
// such as optionGroups, selections, addons, etc.
