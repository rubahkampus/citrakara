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
  CommissionListingCreateInput,
} from "@/lib/db/repositories/commissionListing.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";

/**
 * Computes the price range (min/max) for a commission listing
 * based on all options, selections, and addons
 */
function computePriceRange(input: CommissionListingCreateInput) {
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
function validateListingPayload(payload: CommissionListingCreateInput) {
  // Check milestone requirements for milestone flow
  if (
    payload.flow === "milestone" &&
    (!payload.milestones || !payload.milestones.length)
  ) {
    throw new Error("Milestone flow requires milestones array");
  }

  // Validate milestone percentages sum to 100%
  if (payload.milestones) {
    const sum = payload.milestones.reduce(
      (acc, milestone) => acc + milestone.percent,
      0
    );
    if (sum !== 100) {
      throw new Error("Milestone percentages must sum to 100%");
    }
  }

  // Validate slots
  if (payload.slots === 0) {
    throw new Error("Slots cannot be 0");
  }
}

/**
 * Create a commission listing from a JSON payload
 * (Used when frontend has already handled image uploads)
 */
export async function createListing(
  artistId: string,
  payload: Omit<CommissionListingCreateInput, "artistId" | "price">
) {
  // Prepare the complete listing data
  const listingData: any = {
    ...payload,
    artistId: toObjectId(artistId),
    description: payload.description ?? [], // Ensure description is an array
  };

  // Validate the listing data
  validateListingPayload(listingData);

  // Calculate and attach price range
  listingData.price = computePriceRange(listingData);

  // Create the listing
  return createCommissionListing(listingData as CommissionListingCreateInput);
}

/**
 * Create a commission listing from form data
 * Handles file uploads to R2 and JSON parsing
 */
export async function createListingFromForm(artistId: string, form: FormData) {
  // Validate required fields
  const requiredFields = ["title", "tos", "type", "flow"];
  for (const field of requiredFields) {
    const value = form.get(field);
    if (!value || typeof value !== "string") {
      throw new Error(`Required field missing: ${field}`);
    }
  }

  // Handle thumbnail upload
  const thumbBlob = form.get("thumbnail");
  if (!(thumbBlob instanceof Blob)) {
    throw new Error("Thumbnail image is required");
  }

  // Collect sample images
  const sampleBlobs: Blob[] = [];
  form.forEach((value, key) => {
    if (key === "samples[]" && value instanceof Blob) {
      sampleBlobs.push(value);
    }
  });

  // Upload all images to R2
  const [thumbnailUrl, ...sampleUrls] = await uploadGalleryImagesToR2(
    [thumbBlob, ...sampleBlobs],
    artistId,
    "listing"
  );

  // Parse JSON payload if provided
  const jsonPayload = (() => {
    const raw = form.get("payload");
    if (raw && typeof raw === "string") {
      try {
        return JSON.parse(raw) as Partial<CommissionListingCreateInput>;
      } catch (error) {
        throw new Error("Invalid JSON payload");
      }
    }
    return {};
  })();

  // Prepare the complete listing data
  const listingData: any = {
    ...jsonPayload,
    artistId: toObjectId(artistId),
    title: form.get("title")!.toString(),
    tos: form.get("tos")!.toString(),
    type: form.get("type") as any,
    flow: form.get("flow") as any,
    thumbnail: thumbnailUrl,
    samples: sampleUrls,
    basePrice: Number(form.get("basePrice") ?? 0),
    description: jsonPayload.description ?? [], // Ensure description is an array
  };

  // Validate the listing data
  validateListingPayload(listingData);

  // Calculate and attach price range
  listingData.price = computePriceRange(listingData);

  // Create the listing
  return createCommissionListing(listingData as CommissionListingCreateInput);
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
    throw new Error("User not found");
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
    throw new Error("Listing not found");
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
