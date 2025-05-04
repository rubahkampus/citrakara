// src/lib/services/commissionListing.service.ts
import { toObjectId } from "@/lib/utils/toObjectId";
import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";
import {
  createCommissionListing,
  findCommissionListingById,
  findActiveListingsByArtist,
  updateCommissionListing,
  softDeleteListing,
  searchListings,
  adjustSlotsUsed,
  CommissionListingPayload,
} from "@/lib/db/repositories/commissionListing.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";

// Custom error class for HTTP status mapping
class HttpError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

/**
 * Computes the price range (min/max) for a commission listing
 * based on all options, selections, and addons
 */
function computePriceRange(input: Partial<CommissionListingPayload>) {
  let min = input.basePrice ?? 0;
  let max = input.basePrice ?? 0;

  const addPrices = (items?: { price: number }[]) => {
    if (!items?.length) return;
    const prices = items.map((item) => item.price);
    min += Math.min(...prices);
    max += Math.max(...prices);
  };

  // Add general options
  input.generalOptions?.optionGroups?.forEach((group) =>
    addPrices(group.selections)
  );
  addPrices(input.generalOptions?.addons);

  // Add subject options
  input.subjectOptions?.forEach((subject) => {
    subject.optionGroups?.forEach((group) => addPrices(group.selections));
    addPrices(subject.addons);
  });

  return { min, max };
}

/**
 * Validates a commission listing payload before creation
 */
function validateListingPayload(payload: Partial<CommissionListingPayload>) {
  console.log("Validating payload...");
  // Check required fields
  const requiredFields = [
    "title",
    "tos",
    "type",
    "flow",
    "artistId",
    "thumbnailIdx",
    "samples",
    "deadline",
    "basePrice",
    "cancelationFee",
  ];

  console.log("Validating payload:", payload);

  for (const field of requiredFields) {
    const value = payload[field as keyof CommissionListingPayload];
    console.log("Checking field:", field, value);
    if (value === undefined || value === null) {
      throw new HttpError(`Required field missing: ${field}`);
    }
  }

  // Check milestone requirements for milestone flow
  if (
    payload.flow === "milestone" &&
    (!payload.milestones || !payload.milestones.length)
  ) {
    throw new HttpError("Milestone flow requires milestones array");
  }

  // Validate milestone percentages sum to 100%
  if (payload.milestones && payload.milestones.length > 0) {
    const sum = payload.milestones.reduce(
      (acc, milestone) => acc + milestone.percent,
      0
    );
    if (sum !== 100) {
      throw new HttpError("Milestone percentages must sum to 100%");
    }
  }

  // Enforce correct revision policy based on flow
  if (payload.flow === "standard" && payload.revisions?.type !== "standard") {
    throw new HttpError("Standard flow requires standard revision type");
  }

  if (payload.flow === "milestone" && payload.revisions?.type === "standard") {
    throw new HttpError("Milestone flow cannot use standard revision type");
  }

  // Validate slots
  if (payload.slots === 0) {
    throw new HttpError("Slots cannot be 0");
  }
}

/**
 * Extract only allowed fields from JSON for commission listing
 */
function sanitizePayload(rawPayload: any): Partial<CommissionListingPayload> {
  const allowedFields = [
    "title",
    "description",
    "tags",
    "slots",
    "tos",
    "type",
    "flow",
    "deadline",
    "basePrice",
    "cancelationFee",
    "latePenaltyPercent",
    "graceDays",
    "currency",
    "allowContractChange",
    "changeable",
    "revisions",
    "milestones",
    "generalOptions",
    "subjectOptions",
  ];

  const sanitized: any = {};

  for (const field of allowedFields) {
    if (field in rawPayload) {
      sanitized[field] = rawPayload[field];
    }
  }

  return sanitized;
}

/**
 * Create a commission listing from a JSON payload
 * (Used when frontend has already handled image uploads)
 */
export async function createListing(
  artistId: string,
  payload: Omit<CommissionListingPayload, "artistId" | "price">
) {
  // Prepare the complete listing data
  const listingData = {
    ...payload,
    artistId: toObjectId(artistId),
    description: payload.description ?? [], // Ensure description is an array
  };

  // Validate the listing data
  validateListingPayload(listingData);

  // Calculate price range
  const priceRange = computePriceRange(listingData);

  // Create the listing with price
  return createCommissionListing({
    ...listingData,
    price: priceRange,
  });
}

/**
 * Create a commission listing from form data
 * Handles file uploads to R2 and JSON parsing
 */
export async function createListingFromForm(artistId: string, form: FormData) {
  // 1. Parse & sanitize JSON payload
  let jsonPayload: any;
  try {
    const raw = form.get("payload");
    jsonPayload =
      raw && typeof raw === "string" ? sanitizePayload(JSON.parse(raw)) : {};
  } catch {
    throw new HttpError("Invalid JSON payload", 400);
  }

  // ── NEW: Normalize any question‐objects into simple strings ──
  if (jsonPayload.generalOptions?.questions) {
    jsonPayload.generalOptions.questions = (
      jsonPayload.generalOptions.questions as any[]
    ).map((q) => (typeof q === "string" ? q : q.title ?? ""));
  }
  if (Array.isArray(jsonPayload.subjectOptions)) {
    jsonPayload.subjectOptions = (jsonPayload.subjectOptions as any[]).map(
      (sub) => ({
        ...sub,
        questions: Array.isArray(sub.questions)
          ? sub.questions.map((q: { title: any }) =>
              typeof q === "string" ? q : q.title ?? ""
            )
          : [],
      })
    );
  }
  // ────────────────────────────────────────────────────────────────

  // 2. Ensure essential string fields
  for (const field of ["title", "tos", "type", "flow"] as const) {
    const v = form.get(field);
    if (!v || typeof v !== "string") {
      throw new HttpError(`Required field missing: ${field}`, 400);
    }
  }

  // console.log("Form data:", form.get("payload"));
  console.log("Form data (raw):", form);

  // 3. Build our partial listingData (without thumbnail/samples yet)
  const listingData: Partial<CommissionListingPayload> = {
    ...jsonPayload,
    artistId: toObjectId(artistId),
    title: form.get("title")!.toString(),
    tos: form.get("tos")!.toString(),
    type: form.get("type") as "template" | "custom",
    flow: form.get("flow") as "standard" | "milestone",
    basePrice: Number(form.get("basePrice") ?? 0),
    description: jsonPayload.description ?? [],
  };

  // 4. Allow override of currency if provided
  const currencyVal = form.get("currency");
  if (typeof currencyVal === "string") {
    listingData.currency = currencyVal;
  }

  // 5. Extract thumbnail blob vs URL & collect sample blobs
  const sampleBlobs: Blob[] = [];
  form.forEach((value, key) => {
    if (key === "samples[]" && value instanceof Blob) {
      sampleBlobs.push(value);
    }
  });

  // 6. Upload all blobs in one go
  const toUpload = sampleBlobs;
  const uploadedUrls = await uploadGalleryImagesToR2(
    toUpload,
    artistId,
    "listing"
  );
  listingData.samples = uploadedUrls;

  // 7. Assign samples and calculate thumbnailIdx
  const thumbnailIdx = Number(form.get("thumbnailIdx") ?? 0);

  if (
    typeof thumbnailIdx !== "number" ||
    thumbnailIdx < 0 ||
    thumbnailIdx >= listingData.samples.length
  ) {
    throw new HttpError("Invalid thumbnail index", 400);
  } else {
    listingData.thumbnailIdx = thumbnailIdx;
  }

  console.log("Listing data (after upload):", listingData);

  // 8. Validate *after* thumbnail is set (so no more missing‐thumbnail errors)
  validateListingPayload(listingData);

  console.log("Listing data (validated):", listingData);

  // 9. Compute price range & persist
  const price = computePriceRange(listingData);
  return createCommissionListing({
    ...(listingData as CommissionListingPayload),
    price,
  });
}

/**
 * Update a commission listing from form data
 * Handles file uploads to R2 and JSON parsing
 */
export async function updateListingFromForm(
  artistId: string,
  listingId: string,
  form: FormData
) {
  // 1. Fetch & auth the existing listing
  const existing = await findCommissionListingById(listingId);
  if (!existing) throw new HttpError("Listing not found", 404);
  if (existing.artistId.toString() !== artistId) {
    throw new HttpError("Not authorized to update this listing", 403);
  }

  const existingData = existing.toObject();

  // 2. Parse & sanitize JSON payload
  let jsonPayload: any;
  try {
    const raw = form.get("payload");
    jsonPayload =
      raw && typeof raw === "string" ? sanitizePayload(JSON.parse(raw)) : {};
  } catch {
    throw new HttpError("Invalid JSON payload", 400);
  }

  // 3. Normalize any question-objects into simple strings
  if (jsonPayload.generalOptions?.questions) {
    jsonPayload.generalOptions.questions = (
      jsonPayload.generalOptions.questions as any[]
    ).map((q) => (typeof q === "string" ? q : q.title ?? ""));
  }
  if (Array.isArray(jsonPayload.subjectOptions)) {
    jsonPayload.subjectOptions = (jsonPayload.subjectOptions as any[]).map(
      (sub) => ({
        ...sub,
        questions: Array.isArray(sub.questions)
          ? sub.questions.map((q: { title: any }) =>
              typeof q === "string" ? q : q.title ?? ""
            )
          : [],
      })
    );
  }

  // 4. Build partial listingData from form fields or fall back to existing values
  const listingData: Partial<CommissionListingPayload> = {
    ...jsonPayload,
    artistId: toObjectId(artistId),
    title: (form.get("title") || existingData.title)!.toString(),
    tos: (form.get("tos") || existingData.tos)!.toString(),
    type: (form.get("type") as "template" | "custom") || existingData.type,
    flow: (form.get("flow") as "standard" | "milestone") || existingData.flow,
    basePrice: Number(form.get("basePrice") ?? existingData.basePrice),
    description: jsonPayload.description ?? existingData.description ?? [],
  };

  // 5. Handle currency if provided
  const currencyVal = form.get("currency");
  if (typeof currencyVal === "string") {
    listingData.currency = currencyVal;
  }

  // Step 6: pull existing URLs and new blobs out of FormData
  const existingSamples = form
    .getAll("existingSamples[]")
    .map((v) => v.toString());

  const sampleBlobs = form
    .getAll("samples[]")
    .filter((v) => v instanceof Blob) as Blob[];

  // Step 7: if either URLs or blobs were submitted, rebuild the array
  if (existingSamples.length > 0 || sampleBlobs.length > 0) {
    // upload new files (if any)
    let uploadedUrls: string[] = [];
    if (sampleBlobs.length > 0) {
      uploadedUrls = await uploadGalleryImagesToR2(
        sampleBlobs,
        artistId,
        "listing"
      );
    }

    // combine exactly in the order the client specified:
    listingData.samples = [...existingSamples, ...uploadedUrls];

    // now update thumbnailIdx safely
    const thumbnailIdx = Number(form.get("thumbnailIdx") ?? 0);
    if (thumbnailIdx < 0 || thumbnailIdx >= listingData.samples.length) {
      throw new HttpError("Invalid thumbnail index", 400);
    }
    listingData.thumbnailIdx = thumbnailIdx;
  } else {
    // no change → keep everything as-is
    listingData.samples = existingData.samples;
    listingData.thumbnailIdx = existingData.thumbnailIdx;
  }

  console.log("Update listing data:", listingData);

  // 8. Merge with existing data for validation
  const merged: Partial<CommissionListingPayload> = {
    ...existingData,
    ...listingData,
  };

  // 9. Validate the merged data
  validateListingPayload(merged);

  // 10. Compute price range
  const price = computePriceRange(merged);
  listingData.price = price;

  // 11. Update listing with all processed fields
  return updateCommissionListing(listingId, listingData);
}

/**
 * Get all active listings for an artist by ID
 */
export async function getArtistListings(artistId: string) {
  return findActiveListingsByArtist(artistId);
}

/**
 * Set the active state of a listing (enables/disables it)
 */
export async function setListingActiveState(
  artistId: string,
  listingId: string,
  active: boolean
) {
  // Note: artistId parameter is kept for future authorization checks
  return updateCommissionListing(listingId, { isActive: active });
}

/**
 * Soft delete a listing (marks as deleted but keeps in database)
 */
export async function deleteListing(artistId: string, listingId: string) {
  return softDeleteListing(artistId, listingId);
}

/**
 * Update the slots used in a listing (for order creation/cancellation)
 */
export async function applySlotDelta(listingId: string, delta: number) {
  return adjustSlotsUsed(listingId, delta);
}

/**
 * Get active listings for a user by username (public)
 */
export async function getListingsByUsername(username: string) {
  const artist = await findUserByUsername(username);
  if (!artist) {
    throw new HttpError("User not found", 404);
  }
  return findActiveListingsByArtist(artist._id);
}

/**
 * Get a specific listing by ID (public)
 * Validates that it exists and is active
 */
export async function getListingPublic(listingId: string) {
  const listing = await findCommissionListingById(listingId, { lean: true });
  if (!listing || listing.isDeleted || !listing.isActive) {
    throw new HttpError("Listing not found", 404);
  }
  return listing;
}

/**
 * Search for listings with filtering options
 */
export async function browseListings(options: {
  text?: string;
  tags?: string[];
  artistId?: string;
  skip?: number;
  limit?: number;
}) {
  return searchListings(options);
}

/**
 * Update a commission listing with JSON data
 */
export async function updateListing(
  artistId: string,
  listingId: string,
  updates: Partial<CommissionListingPayload>
) {
  // 1. Fetch & auth
  const existing = await findCommissionListingById(listingId);
  if (!existing) throw new HttpError("Listing not found", 404);
  if (existing.artistId.toString() !== artistId) {
    throw new HttpError("Not authorized to update this listing", 403);
  }

  // 2. Sanitize incoming fields
  const sanitized = sanitizePayload(updates);

  // 3. Merge with existing data for a "full payload"
  const merged: Partial<CommissionListingPayload> = {
    ...existing.toObject(),
    ...sanitized,
  };

  // 4. Validate the full payload just like on create
  validateListingPayload(merged);

  // 5. Recompute price range
  const price = computePriceRange(merged);
  sanitized.price = price;

  console.log("Sanitized listing data:", sanitized);

  // 6. Persist all sanitized fields (including price!)
  return updateCommissionListing(listingId, sanitized);
}
