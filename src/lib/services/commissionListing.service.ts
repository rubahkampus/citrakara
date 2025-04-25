import { Types } from "mongoose";
import { toObjectId } from "@/lib/utils/toObjectId";
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

import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";

/* ------------- helpers ---------------------------------- */

function computePriceRange(input: CommissionListingCreateInput) {
  // very rough: basePrice + cheapest selection(s) vs most expensive
  let min = input.basePrice ?? 0;
  let max = input.basePrice ?? 0;

  const addPrices = (list?: { price: number }[]) => {
    if (!list?.length) return;
    const prices = list.map((x) => x.price);
    min += Math.min(...prices);
    max += Math.max(...prices);
  };

  input.generalOptions?.optionGroups?.forEach((g) => addPrices(g.selections));
  input.generalOptions?.addons && addPrices(input.generalOptions.addons);
  input.subjectOptions?.forEach((s) => {
    s.optionGroups?.forEach((g) => addPrices(g.selections));
    s.addons && addPrices(s.addons);
  });

  return { min, max };
}

function validateListingPayload(p: CommissionListingCreateInput) {
  if (p.flow === "milestone" && (!p.milestones || !p.milestones.length))
    throw new Error("Milestone flow requires milestones array");

  if (p.milestones) {
    const sum = p.milestones.reduce((acc, m) => acc + m.percent, 0);
    if (sum !== 100) throw new Error("Milestone percents must sum to 100");
  }

  if (p.slots === 0) throw new Error("Slots cannot be 0");
}

/* ------------- Service API ---------------------------------- */

/** Create via JSON body (images already uploaded) */
export async function createListing(
    artistId: string,
    payload: Omit<CommissionListingCreateInput, "artistId" | "price">
  ) {
    /* ---- assemble without declaring the final type yet ---- */
    const tmp: any = {
      ...payload,
      artistId: toObjectId(artistId),
      description: payload.description ?? [],  // ensure array
    };
  
    validateListingPayload(tmp);
    tmp.price = computePriceRange(tmp);        // attach price
  
    /* now cast when everything is present */
    return createCommissionListing(tmp as CommissionListingCreateInput);
  }
  

/** Create via multipart form; handles file upload to R2 */
export async function createListingFromForm(artistId: string, form: FormData) {
  // -------- required simple fields ----------
  const requiredStrings = ["title", "tos", "type", "flow"];
  for (const k of requiredStrings) {
    const v = form.get(k);
    if (!v || typeof v !== "string") throw new Error(`Missing ${k}`);
  }

  // -------- thumbnail & samples -------------
  const thumbBlob = form.get("thumbnail");
  if (!(thumbBlob instanceof Blob)) throw new Error("thumbnail missing");

  const samples: Blob[] = [];
  form.forEach((v, k) => {
    if (k === "samples[]" && v instanceof Blob) samples.push(v);
  });

  const [thumbUrl, ...sampleUrls] = await uploadGalleryImagesToR2(
    [thumbBlob, ...samples],
    artistId,
    "listing"
  );

  // -------- parse JSON fields --------------
  const parseJson = <T>(key: string): T | undefined => {
    const raw = form.get(key);
    if (!raw || typeof raw !== "string") return undefined;
    return JSON.parse(raw) as T;
  };

  const jsonPayload =
    parseJson<Partial<CommissionListingCreateInput>>("payload") ?? {};

  const basePrice = Number(form.get("basePrice") ?? 0);

  /* build a mutable object first */
  const tmp: any = {
    ...jsonPayload,
    artistId: toObjectId(artistId),
    title:      form.get("title")!.toString(),
    tos:        form.get("tos")!.toString(),
    type:       form.get("type") as any,
    flow:       form.get("flow") as any,
    thumbnail:  thumbUrl,
    samples:    sampleUrls,
    basePrice,
    description: jsonPayload.description ?? [],  // guarantee array
  };

  validateListingPayload(tmp);
  tmp.price = computePriceRange(tmp);

  return createCommissionListing(tmp as CommissionListingCreateInput);
}

/** Browse public listings */
export async function browseListings(opts: {
  text?: string;
  tags?: string[];
  artistId?: string;
  skip?: number;
  limit?: number;
}) {
  return searchListings(opts);
}

/** Artist’s own dashboard list (includes inactive) */
export async function getArtistListings(artistId: string) {
  return findActiveListingsByArtist(artistId);
}

/** Activate / deactivate */
export async function setListingActiveState(
  artistId: string,
  listingId: string,
  active: boolean
) {
  return updateCommissionListing(listingId, { isActive: active });
}

/** Soft-delete (cannot be undone) */
export async function deleteListing(artistId: string, listingId: string) {
  return softDeleteListing(artistId, listingId);
}

/** Internal: adjust slots when an order is placed or cancelled */
export async function applySlotDelta(listingId: string, delta: number) {
  return adjustSlotsUsed(listingId, delta);
}

/** Public read by id */
export async function getListingPublic(listingId: string) {
  return findCommissionListingById(listingId, { lean: true });
}
