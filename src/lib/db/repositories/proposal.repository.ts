// src/lib/db/repositories/proposal.repository.ts
import mongoose, { ObjectId, Schema, Types } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import Proposal, { IProposal } from "@/lib/db/models/proposal.model";
import CommissionListing from "@/lib/db/models/commissionListing.model";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import type { ISODate, Cents } from "@/types/common";

type ID = number;

// ========== Input Types ==========
export interface ProposalSelectionInput {
  id: number;
  groupId: number;
  selectedSelectionID: number;
  selectedSelectionLabel: string;
  price: Cents;
}

export interface ProposalAddonInput {
  id: number;
  addonId: number;
  price: Cents;
}

export interface ProposalAnswerInput {
  id: number;
  questionId: number;
  answer: string;
}

export interface ProposalGeneralOptionsInput {
  optionGroups?: ProposalSelectionInput[];
  addons?: ProposalAddonInput[];
  answers?: ProposalAnswerInput[];
}

export interface ProposalSubjectInstanceInput {
  id: number;
  optionGroups?: ProposalSelectionInput[];
  addons?: ProposalAddonInput[];
  answers?: ProposalAnswerInput[];
}

export interface ProposalSubjectOptionsInput {
  subjectId: number;
  instances: ProposalSubjectInstanceInput[];
}

export interface ProposalInput {
  clientId: string | ObjectId;
  artistId: string | ObjectId;
  listingId: string | ObjectId;
  earliestDate: ISODate;
  latestDate: ISODate;
  deadline: ISODate;
  generalDescription: string;
  referenceImages?: string[];
  generalOptions?: ProposalGeneralOptionsInput;
  subjectOptions?: ProposalSubjectOptionsInput[];
  baseDate: ISODate; // New required field
}

export interface UpdateProposalInput {
  earliestDate?: ISODate;
  latestDate?: ISODate;
  deadline?: ISODate;
  generalDescription?: string;
  referenceImages?: string[];
  generalOptions?: ProposalGeneralOptionsInput;
  subjectOptions?: ProposalSubjectOptionsInput[];
  baseDate?: ISODate; // Optional during updates
}

export interface FindOpts {
  status?: string[];
  beforeExpire?: boolean;
  clientId?: string | ObjectId;
  artistId?: string | ObjectId;
}

export interface ArtistAdjustment {
  proposedSurcharge?: Cents;
  proposedDiscount?: Cents;
  proposedDate?: ISODate;
}

export interface Estimate {
  baseDate: Date;
  earliestDate: Date;
  latestDate: Date;
}

// ========== Helper Functions ==========
function toObjectId(
  id: string | mongoose.Types.ObjectId | mongoose.Schema.Types.ObjectId
): mongoose.Types.ObjectId {
  if (typeof id === "string") {
    return new mongoose.Types.ObjectId(id);
  }
  if (id instanceof mongoose.Schema.Types.ObjectId) {
    return new mongoose.Types.ObjectId(id.toString());
  }
  return id;
}

function validateDuration(
  earliestDate: Date,
  deadline: Date,
  latestDate: Date,
  deadlineMode: "standard" | "withDeadline" | "withRush",
  baseDate: Date
): boolean {
  // Ensure no date is before or equal to the baseDate
  if (
    earliestDate <= baseDate ||
    deadline <= baseDate ||
    latestDate <= baseDate
  ) {
    throw new Error("All dates must be after the base date");
  }

  // Ensure earliestDate is before latestDate
  if (earliestDate >= latestDate) {
    throw new Error("earliestDate must be before latestDate");
  }

  // Different validation based on deadline mode
  switch (deadlineMode) {
    case "standard":
      // No deadline input in standard mode, nothing to validate
      break;
    case "withDeadline":
      // For withDeadline mode, deadline must be at least after earliestDate
      // Can be after latestDate (unlike the original validation)
      if (deadline < earliestDate) {
        throw new Error("deadline must be after earliestDate");
      }
      break;
    case "withRush":
      // For withRush mode, any deadline after earliestDate is valid (no rush fee)
      // Deadlines before earliestDate are valid but incur rush fees
      // Still must be after baseDate (already checked above)
      break;
  }

  return true;
}

function calculateRush(
  listingSnapshot: ICommissionListing,
  deadline: Date,
  earliestDate: Date,
  latestDate: Date
) {
  if (listingSnapshot.deadline.mode == "standard") {
    return {
      days: -14,
      paidDays: 0,
      fee: 0,
    };
  }

  // Calculate days from deadline to latestDate (negative if deadline is after latestDate)
  const rushDays = Math.ceil(
    (latestDate.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000)
  );

  // For modes without rush fee, return rush days info without fee
  if (listingSnapshot.deadline.mode == "withDeadline") {
    return {
      days: rushDays,
      paidDays: 0,
      fee: 0,
    };
  }

  // Calculate days from earliestDate to deadline (for paid days calculation)
  const paidDays = Math.max(
    0,
    Math.ceil(
      (earliestDate.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000)
    )
  );

  // If there are no paid days, return without fee
  if (paidDays <= 0) {
    return {
      days: rushDays,
      paidDays: 0,
      fee: 0,
    };
  }

  // Calculate rush fee based on the fee type (flat or per day)
  const rushFee =
    listingSnapshot.deadline.rushFee?.kind === "flat"
      ? listingSnapshot.deadline.rushFee?.amount || 0
      : paidDays * (listingSnapshot.deadline.rushFee?.amount || 0);

  return {
    days: rushDays,
    paidDays,
    fee: rushFee,
  };
}

/**
 * Like getProposalById, but throws if not found.
 * Now accepts string | Types.ObjectId | Schema.Types.ObjectId
 */
export async function findProposalById(
  id: string | Types.ObjectId | Schema.Types.ObjectId
): Promise<IProposal> {
  await connectDB();
  const proposal = await Proposal.findById(toObjectId(id));
  if (!proposal) {
    throw new Error(`Proposal not found for id ${id}`);
  }
  return proposal;
}

// ========== Repository Functions ==========
export async function createProposal(input: ProposalInput): Promise<IProposal> {
  await connectDB();

  const clientId = toObjectId(input.clientId);
  const artistId = toObjectId(input.artistId);
  const listingId = toObjectId(input.listingId);
  const baseDate = new Date(input.baseDate);

  // Fetch listing for snapshot
  const listing = await CommissionListing.findById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  // Create listing snapshot
  const listingSnapshot: ICommissionListing = listing;

  // Validate dates
  validateDuration(
    new Date(input.earliestDate),
    new Date(input.deadline),
    new Date(input.latestDate),
    listing.deadline.mode,
    baseDate
  );

  // Calculate rush and pricing
  const rush = calculateRush(
    listingSnapshot,
    new Date(input.deadline),
    new Date(input.earliestDate),
    new Date(input.latestDate)
  );

  console.log(JSON.stringify(input));

  const { optionGroups: optionGroupsPrice, addons: addonsPrice } =
    calculateSelectedPrice(
      listingSnapshot, // Pass the listing snapshot to get correct prices
      input.generalOptions,
      input.subjectOptions
    );

  const calculatedPrice = {
    base: listingSnapshot.basePrice,
    optionGroups: optionGroupsPrice,
    addons: addonsPrice,
    rush: rush?.fee || 0,
    discount: 0,
    surcharge: 0,
    total:
      listingSnapshot.basePrice +
      optionGroupsPrice +
      addonsPrice +
      (rush?.fee || 0),
  };

  console.log(calculateRush);

  const proposal = new Proposal({
    clientId,
    artistId,
    listingId,
    listingSnapshot,
    status: "pendingArtist",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    baseDate, // Add the new baseDate field
    availability: {
      earliestDate: input.earliestDate,
      latestDate: input.latestDate,
    },
    deadline: input.deadline,
    rush,
    generalDescription: input.generalDescription,
    referenceImages: input.referenceImages || [],
    generalOptions: input.generalOptions || {},
    subjectOptions: input.subjectOptions || [],
    calculatedPrice,
  });

  return proposal.save();
}

export async function getProposalById(
  id: string | ObjectId
): Promise<IProposal | null> {
  await connectDB();
  return Proposal.findById(toObjectId(id));
}

export async function updateProposal(
  id: string | ObjectId,
  updates: UpdateProposalInput
): Promise<IProposal | null> {
  await connectDB();

  const proposal = await Proposal.findById(toObjectId(id));
  if (!proposal) return null;

  // Get baseDate for validation
  const baseDate = updates.baseDate
    ? new Date(updates.baseDate)
    : proposal.baseDate;

  // Collect values to validate, handling both existing and updated values
  const earliestDate = new Date(
    updates.earliestDate || proposal.availability.earliestDate
  );
  const deadline = new Date(updates.deadline || proposal.deadline);
  const latestDate = new Date(
    updates.latestDate || proposal.availability.latestDate
  );

  try {
    // Validate dates
    validateDuration(
      earliestDate,
      deadline,
      latestDate,
      proposal.listingSnapshot.deadline.mode,
      baseDate
    );

    // Update fields
    if (updates.baseDate) proposal.baseDate = updates.baseDate;
    if (updates.earliestDate)
      proposal.availability.earliestDate = updates.earliestDate;
    if (updates.latestDate)
      proposal.availability.latestDate = updates.latestDate;
    if (updates.deadline) proposal.deadline = updates.deadline;
    if (updates.generalDescription)
      proposal.generalDescription = updates.generalDescription;
    if (updates.referenceImages)
      proposal.referenceImages = updates.referenceImages;
    if (updates.generalOptions)
      proposal.generalOptions = updates.generalOptions;
    if (updates.subjectOptions)
      proposal.subjectOptions = updates.subjectOptions;
  } catch (error) {
    // Handle validation errors
    if (error instanceof Error) {
      throw new Error(`Date validation failed: ${error.message}`);
    } else {
      throw new Error("Date validation failed: Unknown error");
    }
  }

  // Recalculate if dates or options changed
  if (
    updates.earliestDate ||
    updates.latestDate ||
    updates.deadline ||
    updates.generalOptions ||
    updates.subjectOptions
  ) {
    const recalculated = recalculateRushAndPrice(proposal);
    Object.assign(proposal, recalculated);
  }

  proposal.status = "pendingArtist"; // Reset status to pendingArtist on update
  if (proposal.artistAdjustments) {
    proposal.artistAdjustments = undefined; // Clear artist adjustments on update
  }

  return proposal.save();
}

export async function deleteProposal(id: string | ObjectId): Promise<void> {
  await connectDB();
  await Proposal.findByIdAndDelete(toObjectId(id));
}

export async function findProposalsByUser(
  userId: string | ObjectId,
  role: "client" | "artist",
  opts?: FindOpts
): Promise<IProposal[]> {
  await connectDB();
  const query: any = {};

  if (role === "client") {
    query.clientId = toObjectId(userId);
  } else {
    query.artistId = toObjectId(userId);
  }

  if (opts?.status) {
    query.status = { $in: opts.status };
  }

  if (opts?.beforeExpire) {
    query.expiresAt = { $gt: new Date() };
  }

  return Proposal.find(query).sort({ createdAt: -1 });
}

export async function findProposalsByArtist(
  artistId: string | ObjectId,
  opts?: FindOpts
): Promise<IProposal[]> {
  await connectDB();
  const query: any = { artistId: toObjectId(artistId) };

  if (opts?.status) {
    query.status = { $in: opts.status };
  }

  if (opts?.beforeExpire) {
    query.expiresAt = { $gt: new Date() };
  }

  return Proposal.find(query).sort({ createdAt: -1 });
}

export async function findProposalsByClient(
  clientId: string | ObjectId,
  opts?: FindOpts
): Promise<IProposal[]> {
  await connectDB();
  const query: any = { clientId: toObjectId(clientId) };

  if (opts?.status) {
    query.status = { $in: opts.status };
  }

  return Proposal.find(query).sort({ createdAt: -1 });
}

export async function findProposalsByListing(
  listingId: string | ObjectId
): Promise<IProposal[]> {
  await connectDB();
  return Proposal.find({ listingId: toObjectId(listingId) }).sort({
    createdAt: -1,
  });
}

export async function artistResponds(
  id: string | ObjectId,
  accepts: boolean,
  adjustment?: ArtistAdjustment,
  rejectionReason?: string
): Promise<IProposal> {
  await connectDB();

  const proposal = (await Proposal.findById(toObjectId(id))) as IProposal;
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    proposal.status = "expired";
    throw new Error("Proposal has expired");
  }

  // Artist can reject at any status
  if (!accepts) {
    if (!rejectionReason) {
      throw new Error("Rejection reason is required when rejecting");
    }

    proposal.status = "rejectedArtist";
    proposal.rejectionReason = rejectionReason;
    proposal.expiresAt = new Date(); // Set expiration to now
    return proposal.save();
  }

  // For acceptance, the proposal needs to be in pendingArtist state
  if (
    proposal.status !== "pendingArtist" &&
    proposal.status !== "rejectedClient"
  ) {
    throw new Error("Proposal is not in a state that can be accepted");
  }

  // Accept with optional adjustment
  if (adjustment?.proposedSurcharge || adjustment?.proposedDiscount) {
    // Format adjustments to match schema
    proposal.artistAdjustments = {
      proposedSurcharge: adjustment.proposedSurcharge,
      proposedDiscount: adjustment.proposedDiscount,
      proposedDate: adjustment.proposedDate || new Date(),
    };

    proposal.status = "pendingClient";
    proposal.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 3 days expiration
  } else {
    // Simple acceptance without adjustments
    proposal.status = "accepted";
    proposal.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 3 days expiration;
  }

  return proposal.save();
}

export async function clientRespondsToAdjustment(
  id: string | ObjectId,
  acceptsAdjustment?: boolean,
  cancel?: boolean
): Promise<IProposal> {
  await connectDB();

  const proposal = (await Proposal.findById(toObjectId(id))) as IProposal;
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    proposal.status = "expired";
    throw new Error("Proposal has expired");
  }

  // Handle cancellation first (can happen at any status)
  if (cancel) {
    proposal.status = "expired";
    proposal.expiresAt = new Date(); // Set expiration to now
    return proposal.save();
  }

  // Main response flow
  if (proposal.status !== "pendingClient") {
    throw new Error("Proposal is not in pendingClient status");
  }

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    throw new Error("Proposal has expired");
  }

  if (acceptsAdjustment) {
    proposal.artistAdjustments = proposal.artistAdjustments || {};

    proposal.artistAdjustments.acceptedDate = new Date(); // Set accepted date to now
    proposal.artistAdjustments.acceptedSurcharge =
      proposal.artistAdjustments.proposedSurcharge;
    proposal.artistAdjustments.acceptedDiscount =
      proposal.artistAdjustments.proposedDiscount;

    const recalculated = recalculateRushAndPrice(proposal);
    Object.assign(proposal, recalculated);

    proposal.status = "accepted";
  } else {
    proposal.status = "rejectedClient";
  }

  return proposal.save();
}

export async function cancelProposal(
  id: string | ObjectId,
  clientId: string | ObjectId
): Promise<IProposal> {
  await connectDB();

  const proposal = await Proposal.findById(toObjectId(id));
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    proposal.status = "expired";
    throw new Error("Proposal has expired");
  }

  // Verify client ownership
  if (proposal.clientId.toString() !== clientId.toString()) {
    throw new Error("Not authorized to cancel this proposal");
  }

  proposal.status = "expired";
  proposal.expiresAt = new Date(); // Set expiration to now

  return proposal.save();
}

export async function expireProposal(id: string | ObjectId): Promise<void> {
  await connectDB();
  await Proposal.findByIdAndUpdate(toObjectId(id), {
    status: "expired",
    $unset: { expiresAt: "" },
  });
}

export async function finalizeAcceptance(
  id: string | ObjectId
): Promise<IProposal> {
  await connectDB();

  const proposal = await Proposal.findById(toObjectId(id));
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "accepted") {
    throw new Error("Proposal is not in accepted status");
  }

  proposal.status = "paid";

  return proposal.save();
}

const DAY = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

export function computeDynamicEstimate(
  listing: ICommissionListing,
  baseDate: Date = new Date() // default: now
): Estimate {
  const earliestDate = new Date(
    baseDate.getTime() + listing.deadline.min * DAY
  );
  const latestDate = new Date(baseDate.getTime() + listing.deadline.max * DAY);
  return { baseDate, earliestDate, latestDate };
}

/**
 * Calculates the selected price based on the commission listing and proposal inputs
 * @param listingSnapshot The commission listing snapshot
 * @param generalOptions General options from the proposal
 * @param subjectOptions Subject options from the proposal
 * @returns The calculated prices for option groups and addons
 */
function calculateSelectedPrice(
  listingSnapshot: ICommissionListing,
  generalOptions?: ProposalGeneralOptionsInput,
  subjectOptions?: ProposalSubjectOptionsInput[]
): { optionGroups: Cents; addons: Cents } {
  console.log("Starting new price calculation approach");

  // Initialize the totals
  let optionGroupsTotal = 0;
  let addonsTotal = 0;

  // Helper function to log a selection lookup
  const logSelectionLookup = (
    context: string,
    selectionId: number,
    groupId: number,
    foundPrice: number | null,
    inputPrice: number | undefined
  ) => {
    if (foundPrice !== null) {
      console.log(
        `${context}: Found selection ID ${selectionId} in group ${groupId} with price ${foundPrice}`
      );
    } else if (inputPrice !== undefined) {
      console.log(
        `${context}: Selection ID ${selectionId} not found in listing, using input price ${inputPrice}`
      );
    } else {
      console.log(
        `${context}: Selection ID ${selectionId} not found in listing and no input price available, using 0`
      );
    }
  };

  // Helper function to log an addon lookup
  const logAddonLookup = (
    context: string,
    addonId: number,
    foundPrice: number | null,
    inputPrice: number | undefined
  ) => {
    if (foundPrice !== null) {
      console.log(
        `${context}: Found addon ID ${addonId} with price ${foundPrice}`
      );
    } else if (inputPrice !== undefined) {
      console.log(
        `${context}: Addon ID ${addonId} not found in listing, using input price ${inputPrice}`
      );
    } else {
      console.log(
        `${context}: Addon ID ${addonId} not found in listing and no input price available, using 0`
      );
    }
  };

  // Helper function to find a selection price from the listing
  const findSelectionPrice = (
    optionGroups:
      | Array<{
          id: ID;
          title: string;
          selections: Array<{ id: ID; label: string; price: Cents }>;
        }>
      | undefined,
    groupId: number,
    selectionId: number
  ): number | null => {
    if (!optionGroups) return null;

    const group = optionGroups.find((g) => g.id === groupId);
    if (!group) return null;

    const selection = group.selections.find((s) => s.id === selectionId);
    return selection ? selection.price : null;
  };

  // Helper function to find an addon price from the listing
  const findAddonPrice = (
    addons: Array<{ id: ID; label: string; price: Cents }> | undefined,
    addonId: number
  ): number | null => {
    if (!addons) return null;

    const addon = addons.find((a) => a.id === addonId);
    return addon ? addon.price : null;
  };

  // 1. Process General Options
  console.log("Processing General Options:");
  if (generalOptions?.optionGroups && generalOptions.optionGroups.length > 0) {
    for (const selection of generalOptions.optionGroups) {
      const price = findSelectionPrice(
        listingSnapshot.generalOptions?.optionGroups,
        selection.groupId,
        selection.selectedSelectionID
      );

      logSelectionLookup(
        "General",
        selection.selectedSelectionID,
        selection.groupId,
        price,
        selection.price
      );

      // Use the price from listing or fallback to input price
      optionGroupsTotal += price !== null ? price : selection.price || 0;
    }
  }

  if (generalOptions?.addons && generalOptions.addons.length > 0) {
    for (const addon of generalOptions.addons) {
      const price = findAddonPrice(
        listingSnapshot.generalOptions?.addons,
        addon.addonId
      );

      logAddonLookup("General", addon.addonId, price, addon.price);

      // Use the price from listing or fallback to input price
      addonsTotal += price !== null ? price : addon.price || 0;
    }
  }

  // 2. Process Subject Options
  console.log("Processing Subject Options:");
  if (
    subjectOptions &&
    subjectOptions.length > 0 &&
    listingSnapshot.subjectOptions
  ) {
    for (const subject of subjectOptions) {
      const subjectOption = listingSnapshot.subjectOptions.find(
        (s) => s.id === subject.subjectId
      );

      if (!subjectOption) {
        console.log(`Subject ID ${subject.subjectId} not found in listing`);
        continue;
      }

      console.log(
        `Found subject "${subjectOption.title}" with ${subject.instances.length} instances`
      );

      // Special handling for multiple instances and discount
      const instancePrices: number[] = [];

      // Process each instance
      for (let idx = 0; idx < subject.instances.length; idx++) {
        const instance = subject.instances[idx];
        let instanceTotal = 0;

        console.log(`Processing instance #${idx + 1}:`);

        // Process option groups for this instance
        if (instance.optionGroups && instance.optionGroups.length > 0) {
          for (const selection of instance.optionGroups) {
            const price = findSelectionPrice(
              subjectOption.optionGroups,
              selection.groupId,
              selection.selectedSelectionID
            );

            logSelectionLookup(
              `Subject ${subject.subjectId} Instance ${idx + 1}`,
              selection.selectedSelectionID,
              selection.groupId,
              price,
              selection.price
            );

            // Use the price from listing or fallback to input price
            instanceTotal += price !== null ? price : selection.price || 0;
          }
        }

        // Process addons for this instance
        if (instance.addons && instance.addons.length > 0) {
          for (const addon of instance.addons) {
            const price = findAddonPrice(subjectOption.addons, addon.addonId);

            logAddonLookup(
              `Subject ${subject.subjectId} Instance ${idx + 1}`,
              addon.addonId,
              price,
              addon.price
            );

            // Use the price from listing or fallback to input price
            instanceTotal += price !== null ? price : addon.price || 0;
          }
        }

        console.log(`Instance #${idx + 1} total: ${instanceTotal}`);
        instancePrices.push(instanceTotal);
      }

      // Apply discount if applicable
      if (subject.instances.length > 1 && subjectOption.discount) {
        console.log(
          `Applying ${subjectOption.discount}% discount to instances after the first`
        );

        let totalForSubject = instancePrices[0]; // First instance at full price

        // Apply discount to all subsequent instances
        for (let i = 1; i < instancePrices.length; i++) {
          const discountedPrice =
            instancePrices[i] * (1 - subjectOption.discount / 100);
          console.log(
            `Instance #${i + 1}: Original: ${
              instancePrices[i]
            }, Discounted: ${discountedPrice}`
          );
          totalForSubject += discountedPrice;
        }

        console.log(`Subject total after discount: ${totalForSubject}`);
        optionGroupsTotal += Math.round(totalForSubject); // Round to avoid floating point issues
      } else {
        // No discount needed
        const totalForSubject = instancePrices.reduce(
          (sum, price) => sum + price,
          0
        );
        console.log(`Subject total (no discount): ${totalForSubject}`);
        optionGroupsTotal += totalForSubject;
      }
    }
  }

  // 3. Final calculation
  console.log(`Final calculation:`);
  console.log(`  Base price: ${listingSnapshot.basePrice}`);
  console.log(`  Option groups total: ${optionGroupsTotal}`);
  console.log(`  Addons total: ${addonsTotal}`);
  console.log(
    `  Grand total: ${
      listingSnapshot.basePrice + optionGroupsTotal + addonsTotal
    }`
  );

  return {
    optionGroups: Math.round(optionGroupsTotal),
    addons: addonsTotal,
  };
}

/**
 * Recalculates rush fees and prices for a proposal
 */
export function recalculateRushAndPrice(proposal: IProposal): IProposal {
  const { listingSnapshot, deadline, availability, baseDate } = proposal;

  if (!availability) return proposal;

  console.log("Recalculating rush and price for proposal");

  // Recalculate rush
  const rush = calculateRush(
    listingSnapshot,
    new Date(deadline),
    new Date(availability.earliestDate),
    new Date(availability.latestDate)
  );

  // Recalculate price using source of truth from listing snapshot
  const { optionGroups: optionGroupsPrice, addons: addonsPrice } =
    calculateSelectedPrice(
      listingSnapshot,
      proposal.generalOptions,
      proposal.subjectOptions
    );

  const surchargeAmount =
    proposal.artistAdjustments?.acceptedSurcharge ||
    proposal.artistAdjustments?.proposedSurcharge ||
    0;
  const discountAmount =
    proposal.artistAdjustments?.acceptedDiscount ||
    proposal.artistAdjustments?.proposedDiscount ||
    0;

  console.log(`Rush fee: ${rush?.fee || 0}`);
  console.log(`Surcharge: ${surchargeAmount}`);
  console.log(`Discount: ${discountAmount}`);

  const total =
    listingSnapshot.basePrice +
    optionGroupsPrice +
    addonsPrice +
    (rush?.fee || 0) +
    surchargeAmount -
    discountAmount;

  console.log(`Final total price: ${total}`);

  proposal.rush = rush || undefined;
  proposal.calculatedPrice = {
    base: listingSnapshot.basePrice,
    optionGroups: optionGroupsPrice,
    addons: addonsPrice,
    rush: rush?.fee || 0,
    discount: discountAmount,
    surcharge: surchargeAmount,
    total: total,
  };

  return proposal;
}

export async function findExpiredProposals(
  asOf: Date = new Date()
): Promise<IProposal[]> {
  await connectDB();
  return Proposal.find({
    status: { $in: ["pendingArtist", "pendingClient"] },
    expiresAt: { $lte: asOf },
  });
}

export async function bulkExpirePending(
  asOf: Date = new Date()
): Promise<number> {
  await connectDB();
  const result = await Proposal.updateMany(
    {
      status: { $in: ["pendingArtist", "pendingClient"] },
      expiresAt: { $lte: asOf },
    },
    {
      status: "expired",
      $unset: { expiresAt: "" },
    }
  );
  return result.modifiedCount;
}
