// src/lib/db/repositories/proposal.repository.ts
import mongoose, { ClientSession, ObjectId, Types } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import Proposal, { IProposal } from "@/lib/db/models/proposal.model";
import CommissionListing from "@/lib/db/models/commissionListing.model";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import type { ISODate, Cents } from "@/types/common";

// ========== Input Types ==========
export interface GeneralOptionsInput {
  optionGroups?: Record<
    string,
    {
      selectedLabel: string;
      price: Cents;
    }
  >;
  addons?: Record<string, Cents>;
  answers?: Record<string, string>;
}

export interface SubjectOptionsInput {
  [subjectTitle: string]: {
    instances: Array<{
      optionGroups?: Record<
        string,
        {
          selectedLabel: string;
          price: Cents;
        }
      >;
      addons?: Record<string, Cents>;
      answers?: Record<string, string>;
    }>;
  };
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
  generalOptions?: GeneralOptionsInput;
  subjectOptions?: SubjectOptionsInput;
}

export interface UpdateProposalInput {
  earliestDate?: ISODate;
  latestDate?: ISODate;
  deadline?: ISODate;
  generalDescription?: string;
  referenceImages?: string[];
  generalOptions?: GeneralOptionsInput;
  subjectOptions?: SubjectOptionsInput;
}

export interface FindOpts {
  status?: string[];
  beforeExpire?: boolean;
  clientId?: string | ObjectId;
  artistId?: string | ObjectId;
}

export interface ArtistAdjustment {
  surcharge?: {
    amount: number;
    reason: string;
  };
  discount?: {
    amount: number;
    reason: string;
  };
}

export interface Estimate {
  baseDate: Date;
  earliestDate: Date;
  latestDate: Date;
}

export interface ListingSnapshot {
  title: string;
  basePrice: Cents;
  slots: number;
  generalOptions?: any;
  subjectOptions?: any;
  cancelationFee: {
    kind: "flat" | "percentage";
    amount: number;
  };
  deadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number;
    max: number;
    rushFee?: {
      kind: "flat" | "perDay";
      amount: number;
    };
  };
  revisions?: any;
  milestones?: any;
  flow?: "standard" | "milestone";
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
  latestDate: Date
): boolean {
  if (earliestDate >= latestDate) {
    throw new Error("earliestDate must be before latestDate");
  }

  if (deadline < earliestDate || deadline > latestDate) {
    throw new Error("deadline must be between earliestDate and latestDate");
  }

  return true;
}

function calculateRush(
  listingSnapshot: ListingSnapshot,
  deadline: Date,
  earliestDate: Date,
  latestDate: Date
) {
  if (
    listingSnapshot.deadline.mode !== "withRush" ||
    !listingSnapshot.deadline.rushFee
  ) {
    return null;
  }

  const rushDays = Math.max(
    0,
    Math.ceil(
      (latestDate.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000)
    )
  );
  const paidDays = Math.max(
    0,
    Math.ceil(
      (deadline.getTime() - earliestDate.getTime()) / (24 * 60 * 60 * 1000)
    )
  );

  if (paidDays <= 0) {
    return { days: 0, paidDays: 0, fee: 0 };
  }

  const rushFee =
    listingSnapshot.deadline.rushFee.kind === "flat"
      ? listingSnapshot.deadline.rushFee.amount
      : paidDays * listingSnapshot.deadline.rushFee.amount;

  return {
    days: rushDays,
    paidDays,
    fee: rushFee,
  };
}

function calculateSelectedPrice(
  generalOptions?: GeneralOptionsInput,
  subjectOptions?: SubjectOptionsInput
): { optionGroups: Cents; addons: Cents } {
  let optionGroupsTotal = 0;
  let addonsTotal = 0;

  // Sum general options
  if (generalOptions?.optionGroups) {
    Object.values(generalOptions.optionGroups).forEach((selection) => {
      optionGroupsTotal += selection.price;
    });
  }

  if (generalOptions?.addons) {
    Object.values(generalOptions.addons).forEach((price) => {
      addonsTotal += price;
    });
  }

  // Sum subject options
  if (subjectOptions) {
    Object.values(subjectOptions).forEach((subject) => {
      subject.instances.forEach((instance) => {
        if (instance.optionGroups) {
          Object.values(instance.optionGroups).forEach((selection) => {
            optionGroupsTotal += selection.price;
          });
        }
        if (instance.addons) {
          Object.values(instance.addons).forEach((price) => {
            addonsTotal += price;
          });
        }
      });
    });
  }

  return { optionGroups: optionGroupsTotal, addons: addonsTotal };
}

// ========== Repository Functions ==========
export async function createProposal(input: ProposalInput): Promise<IProposal> {
  await connectDB();

  const clientId = toObjectId(input.clientId);
  const artistId = toObjectId(input.artistId);
  const listingId = toObjectId(input.listingId);

  // Fetch listing for snapshot
  const listing = await CommissionListing.findById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  // Create listing snapshot
  const listingSnapshot: ListingSnapshot = {
    title: listing.title,
    basePrice: listing.basePrice,
    slots: listing.slots,
    generalOptions: listing.generalOptions,
    subjectOptions: listing.subjectOptions,
    cancelationFee: listing.cancelationFee,
    deadline: listing.deadline,
    revisions: listing.revisions,
    milestones: listing.milestones,
    flow: listing.flow,
  };

  // Validate dates
  validateDuration(
    new Date(input.earliestDate),
    new Date(input.deadline),
    new Date(input.latestDate)
  );

  // Calculate rush and pricing
  const rush = calculateRush(
    listingSnapshot,
    new Date(input.deadline),
    new Date(input.earliestDate),
    new Date(input.latestDate)
  );

  const { optionGroups: optionGroupsPrice, addons: addonsPrice } =
    calculateSelectedPrice(input.generalOptions, input.subjectOptions);

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

  const proposal = new Proposal({
    clientId,
    artistId,
    listingId,
    listingSnapshot,
    status: "pendingArtist",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    availability: {
      earliestDate: input.earliestDate,
      latestDate: input.latestDate,
    },
    deadline: input.deadline,
    rush,
    generalDescription: input.generalDescription,
    referenceImages: input.referenceImages || [],
    generalOptions: input.generalOptions || {},
    subjectOptions: input.subjectOptions || {},
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

  // Update fields
  if (updates.earliestDate)
    proposal.availability.earliestDate = updates.earliestDate;
  if (updates.latestDate) proposal.availability.latestDate = updates.latestDate;
  if (updates.deadline) proposal.deadline = updates.deadline;
  if (updates.generalDescription)
    proposal.generalDescription = updates.generalDescription;
  if (updates.referenceImages)
    proposal.referenceImages = updates.referenceImages;
  if (updates.generalOptions) proposal.generalOptions = updates.generalOptions;
  if (updates.subjectOptions) proposal.subjectOptions = updates.subjectOptions;

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

  const proposal = await Proposal.findById(toObjectId(id));
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "pendingArtist") {
    throw new Error("Proposal is not in pendingArtist status");
  }

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    throw new Error("Proposal has expired");
  }

  if (!accepts) {
    if (!rejectionReason) {
      throw new Error("Rejection reason is required when rejecting");
    }

    proposal.status = "rejectedArtist";
    proposal.rejectionReason = rejectionReason;
    proposal.expiresAt = undefined;
    return proposal.save();
  }

  // Accept with optional adjustment
  if (adjustment?.surcharge || adjustment?.discount) {
    const surchargeAmount = adjustment.surcharge?.amount || 0;
    const discountAmount = adjustment.discount?.amount || 0;

    proposal.artistAdjustments = adjustment;
    proposal.calculatedPrice.surcharge = surchargeAmount;
    proposal.calculatedPrice.discount = discountAmount;
    proposal.calculatedPrice.total =
      proposal.calculatedPrice.base +
      proposal.calculatedPrice.optionGroups +
      proposal.calculatedPrice.addons +
      proposal.calculatedPrice.rush +
      surchargeAmount -
      discountAmount;

    proposal.status = "pendingClient";
    proposal.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  } else {
    proposal.status = "accepted";
    proposal.expiresAt = undefined;
  }

  return proposal.save();
}

export async function clientRespondsToAdjustment(
  id: string | ObjectId,
  accepts: boolean,
  rejectionReason?: string
): Promise<IProposal> {
  await connectDB();

  const proposal = await Proposal.findById(toObjectId(id));
  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "pendingClient") {
    throw new Error("Proposal is not in pendingClient status");
  }

  if (accepts) {
    proposal.status = "accepted";
    proposal.expiresAt = undefined;
  } else {
    proposal.status = "rejectedClient";
    if (rejectionReason) {
      proposal.rejectionReason = rejectionReason;
    }
    proposal.expiresAt = undefined;
  }

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

  return proposal;
}

const DAY = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

export function computeDynamicEstimate(
  listing: ListingSnapshot,
  baseDate: Date = new Date() // default: now
): Estimate {
  const earliestDate = new Date(
    baseDate.getTime() + listing.deadline.min * DAY
  );
  const latestDate = new Date(baseDate.getTime() + listing.deadline.max * DAY);
  return { baseDate, earliestDate, latestDate };
}

export function recalculateRushAndPrice(proposal: IProposal): IProposal {
  const { listingSnapshot, deadline, availability } = proposal;

  if (!availability) return proposal;

  // Recalculate rush
  const rush = calculateRush(
    listingSnapshot,
    new Date(deadline),
    new Date(availability.earliestDate),
    new Date(availability.latestDate)
  );

  // Recalculate price
  const { optionGroups: optionGroupsPrice, addons: addonsPrice } =
    calculateSelectedPrice(proposal.generalOptions, proposal.subjectOptions);

  const surchargeAmount = proposal.artistAdjustments?.surcharge?.amount || 0;
  const discountAmount = proposal.artistAdjustments?.discount?.amount || 0;

  proposal.rush = rush || undefined;
  proposal.calculatedPrice = {
    base: listingSnapshot.basePrice,
    optionGroups: optionGroupsPrice,
    addons: addonsPrice,
    rush: rush?.fee || 0,
    discount: discountAmount,
    surcharge: surchargeAmount,
    total:
      listingSnapshot.basePrice +
      optionGroupsPrice +
      addonsPrice +
      (rush?.fee || 0) +
      surchargeAmount -
      discountAmount,
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
