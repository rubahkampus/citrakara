// src/lib/services/proposal.service.ts
import { Types } from "mongoose";
import { IProposal } from "@/lib/db/models/proposal.model";
import {
  createProposal as repoCreateProposal,
  getProposalById,
  updateProposal as repoUpdateProposal,
  artistResponds,
  clientRespondsToAdjustment,
  findProposalsByUser,
  findProposalsByArtist,
  findProposalsByClient,
  finalizeAcceptance,
  bulkExpirePending,
  computeDynamicEstimate as repoComputeDynamicEstimate,
  ProposalInput,
  UpdateProposalInput,
  FindOpts,
  ArtistAdjustment,
  cancelProposal,
} from "@/lib/db/repositories/proposal.repository";
import { findCommissionListingById } from "@/lib/db/repositories/commissionListing.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";
import { connectDB } from "@/lib/db/connection";
import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";
import type { Cents, ObjectId } from "@/types/common";
import { HttpError } from "./commissionListing.service";
import { ICommissionListing } from "../db/models/commissionListing.model";

// ========== Service Interfaces ==========
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

export interface CreateProposalInput {
  listingId: string;
  earliestDate: Date;
  latestDate: Date;
  deadline: Date;
  generalDescription: string;
  generalOptions?: GeneralOptionsInput;
  subjectOptions?: SubjectOptionsInput;
}

export interface UpdateProposalInputService {
  earliestDate?: Date;
  latestDate?: Date;
  deadline?: Date;
  generalDescription?: string;
  generalOptions?: GeneralOptionsInput;
  subjectOptions?: SubjectOptionsInput;
}

export interface ArtistDecision {
  acceptProposal: boolean;
  surcharge?: number;
  discount?: number;
  rejectionReason?: string;
}

export interface ClientDecision {
  cancel?: boolean;
  acceptAdjustments?: boolean;
}

export interface ProposalFilters {
  role?: "client" | "artist";
  status?: string[];
  beforeExpire?: boolean;
}

// ========== Service Implementation ==========

// ========== Main CRUD Operations ==========
export async function createProposalFromForm(
  clientId: string,
  form: FormData
): Promise<IProposal> {
  try {
    await connectDB();

    // Parse JSON payload for proposal data
    let jsonPayload: any;
    try {
      const raw = form.get("payload");
      jsonPayload = raw && typeof raw === "string" ? JSON.parse(raw) : {};
    } catch {
      throw new HttpError("Invalid JSON payload", 400);
    }

    // Validate required fields
    const listingId = form.get("listingId");
    if (!listingId || typeof listingId !== "string") {
      throw new HttpError("Required field missing: listingId", 400);
    }

    // Fetch and validate listing
    const listing = await findCommissionListingById(listingId);
    if (!listing) {
      throw new HttpError("Listing not found", 404);
    }

    if (!listing.isActive || listing.isDeleted) {
      throw new HttpError("Listing is not active", 400);
    }

    // Get dynamic availability window to tackle race conditions
    const { earliestDate, latestDate } = await repoComputeDynamicEstimate(
      listing,
      (await getLatestActiveContractDeadline(listing.artistId)) || new Date()
    );

    // Extract deadline from form
    const deadlineFromForm = form.get("deadline");
    if (!deadlineFromForm) {
      throw new HttpError("Missing required deadline field", 400);
    }

    const deadline = new Date(deadlineFromForm.toString());

    // Validate deadline based on listing deadline policy
    validateDeadline(listing, deadline, earliestDate, latestDate);

    // Extract general description
    const generalDescription = form.get("generalDescription");
    if (!generalDescription || typeof generalDescription !== "string") {
      throw new HttpError("Missing required general description", 400);
    }

    // Process reference image uploads
    const referenceBlobs: Blob[] = [];
    form.forEach((value, key) => {
      if (key === "referenceImages[]" && value instanceof Blob) {
        referenceBlobs.push(value);
      }
    });

    // Upload reference images to R2
    const referenceImages = await uploadGalleryImagesToR2(
      referenceBlobs,
      clientId,
      "proposal"
    );

    // Extract options from JSON payload
    const { generalOptions, subjectOptions } = jsonPayload;

    // Create proposal input for repository
    const proposalInput: ProposalInput = {
      clientId,
      artistId: listing.artistId.toString(),
      listingId,
      earliestDate,
      latestDate,
      deadline,
      generalDescription: generalDescription.toString(),
      referenceImages,
      generalOptions,
      subjectOptions,
    };

    validateProposalInput(proposalInput); // Validate input before creating

    const baseDate = await getLatestActiveContractDeadline(listing.artistId);

    return repoCreateProposal(proposalInput, baseDate || new Date());
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw error;
  }
}

export async function updateProposalFromForm(
  proposalId: string,
  userId: string,
  form: FormData
): Promise<IProposal> {
  try {
    await connectDB();

    // First check if proposal exists and user has permission to edit
    const existing = await getProposalById(proposalId);
    if (!existing) {
      throw new HttpError("Proposal not found", 404);
    }

    if (existing.clientId.toString() !== userId) {
      throw new HttpError("Not authorized to edit this proposal", 403);
    }

    if (existing.status !== "pendingArtist") {
      throw new HttpError(
        "Can only edit proposals in pendingArtist status",
        400
      );
    }

    // Parse JSON payload
    let jsonPayload: any;
    try {
      const raw = form.get("payload");
      jsonPayload = raw && typeof raw === "string" ? JSON.parse(raw) : {};
    } catch {
      throw new HttpError("Invalid JSON payload", 400);
    }

    // Fetch the listing to validate deadline against policy
    const listing = await findCommissionListingById(
      existing.listingId.toString()
    );
    if (!listing) {
      throw new HttpError("Associated listing not found", 404);
    }

    // Get dynamic availability window
    const { earliestDate, latestDate } = await repoComputeDynamicEstimate(
      listing,
      (await getLatestActiveContractDeadline(listing.artistId)) || new Date()
    );

    // Initialize updates object
    const updates: UpdateProposalInput = {
      earliestDate,
      latestDate,
    };

    // Handle deadline update if provided
    const deadlineFromForm = form.get("deadline");
    if (deadlineFromForm) {
      const deadline = new Date(deadlineFromForm.toString());

      // Validate deadline based on listing deadline policy
      validateDeadline(listing, deadline, earliestDate, latestDate);

      updates.deadline = deadline;
    }

    // Handle general description if provided
    const generalDescription = form.get("generalDescription");
    if (generalDescription && typeof generalDescription === "string") {
      updates.generalDescription = generalDescription;
    }

    // Extract options from JSON payload
    if (jsonPayload.generalOptions) {
      updates.generalOptions = jsonPayload.generalOptions;
    }

    if (jsonPayload.subjectOptions) {
      updates.subjectOptions = jsonPayload.subjectOptions;
    }

    // Handle reference images: combine existing kept images with new uploads
    const existingReferences = form
      .getAll("existingReferences[]")
      .map((v) => v.toString());

    const referenceBlobs = form
      .getAll("referenceImages[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Only process images if either existing or new files were submitted
    if (existingReferences.length > 0 || referenceBlobs.length > 0) {
      // Upload new reference images (if any)
      let uploadedUrls: string[] = [];
      if (referenceBlobs.length > 0) {
        uploadedUrls = await uploadGalleryImagesToR2(
          referenceBlobs,
          userId,
          "proposal"
        );
      }

      // Combine existing and new references
      updates.referenceImages = [...existingReferences, ...uploadedUrls];
    }

    const baseDate = await getLatestActiveContractDeadline(listing.artistId);

    const updatedProposal = await repoUpdateProposal(
      proposalId,
      updates,
      baseDate || new Date()
    );
    if (!updatedProposal) {
      throw new HttpError("Failed to update proposal", 500);
    }

    return updatedProposal;
  } catch (error) {
    console.error("Error updating proposal:", error);
    throw error;
  }
}

// Helper function to validate deadline based on listing policy
function validateDeadline(
  listing: ICommissionListing,
  deadline: Date,
  earliestDate: Date,
  latestDate: Date
): void {
  switch (listing.deadline.mode) {
    case "standard":
      // For standard mode, deadline is always system-determined as 2 weeks + latestDate
      // Client-provided deadline is ignored
      break;

    case "withDeadline":
      // For withDeadline mode, client-provided deadline must fall on or after earliestDate
      if (deadline < earliestDate) {
        throw new HttpError(
          `Deadline cannot be earlier than ${
            earliestDate.toISOString().split("T")[0]
          }`,
          400
        );
      }
      break;

    case "withRush":
      // For withRush mode, any deadline is valid, but rush fees may apply
      break;

    default:
      throw new HttpError("Invalid deadline mode in listing", 500);
  }
}

// ========== Response Operations ==========
export async function artistRespond(
  artistId: string,
  proposalId: string,
  decision: ArtistDecision
): Promise<IProposal> {
  try {
    await connectDB();

    console.log({
      artistId,
      proposalId,
      decision,
    })

    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    console.log(proposal.status)

    if (proposal.artistId.toString() !== artistId) {
      throw new Error("Not authorized to respond to this proposal");
    }

    // Artist is rejecting the proposal
    if (!decision.acceptProposal) {
      if (!decision.rejectionReason) {
        throw new Error("Rejection reason is required");
      }
      return artistResponds(
        proposalId,
        false,
        undefined,
        decision.rejectionReason
      );
    }

    if (
      proposal.status == "pendingArtist" ||
      proposal.status == "rejectedClient"
    ) {
      // Artist is accepting, check if there are adjustments
      let adjustment: ArtistAdjustment | undefined;
      if (decision.surcharge || decision.discount) {
        adjustment = {};

        if (decision.surcharge) {
          adjustment.proposedSurcharge = decision.surcharge;
        }

        if (decision.discount) {
          adjustment.proposedDiscount = decision.discount;
        }
      }

      return artistResponds(proposalId, true, adjustment, undefined);
    } else {
      throw new Error("Proposal is not awaiting artist response");
    }
  } catch (error) {
    console.error("Error in artist response:", error);
    throw error;
  }
}

export async function clientRespond(
  clientId: string,
  proposalId: string,
  decision: ClientDecision
): Promise<IProposal> {
  try {
    await connectDB();

    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.clientId.toString() !== clientId) {
      throw new Error("Not authorized to respond to this proposal");
    }

    // Handle cancellation (can happen at any status)
    if (decision.cancel) {
      return cancelProposal(proposalId, clientId);
    }

    // Regular client response to adjustment
    if (proposal.status !== "pendingClient") {
      throw new Error("Proposal is not awaiting client response");
    }

    return clientRespondsToAdjustment(
      proposalId,
      decision.acceptAdjustments,
      false // Not canceling
    );
  } catch (error) {
    console.error("Error in client response:", error);
    throw error;
  }
}
// ========== Query Operations ==========
export async function getUserProposals(
  userId: string,
  role: "client" | "artist",
  filters?: ProposalFilters
): Promise<IProposal[]> {
  try {
    await connectDB();

    const options: FindOpts = {
      status: filters?.status,
      beforeExpire: filters?.beforeExpire,
    };

    return findProposalsByUser(userId, role, options);
  } catch (error) {
    console.error("Error fetching user proposals:", error);
    throw error;
  }
}

export async function getIncomingProposals(
  artistId: string,
  filters?: ProposalFilters
): Promise<IProposal[]> {
  try {
    await connectDB();

    return findProposalsByArtist(artistId);
  } catch (error) {
    console.error("Error fetching incoming proposals:", error);
    throw error;
  }
}

export async function getOutgoingProposals(
  clientId: string,
  filters?: ProposalFilters
): Promise<IProposal[]> {
  try {
    await connectDB();

    const options: FindOpts = {
      status: filters?.status,
    };

    return findProposalsByClient(clientId, options);
  } catch (error) {
    console.error("Error fetching outgoing proposals:", error);
    throw error;
  }
}

export async function fetchProposalById(
  proposalId: string,
  userId: string
): Promise<IProposal> {
  try {
    await connectDB();

    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Check if user has permission to view
    const isClient = proposal.clientId.toString() === userId;
    const isArtist = proposal.artistId.toString() === userId;

    if (!isClient && !isArtist) {
      throw new Error("Not authorized to view this proposal");
    }

    return proposal;
  } catch (error) {
    console.error("Error fetching proposal:", error);
    throw error;
  }
}

// ========== Permission Helpers ==========
export async function canEditProposal(
  proposalId: string,
  userId: string
): Promise<boolean> {
  try {
    const proposal = await getProposalById(proposalId);
    if (!proposal) return false;

    return (
      proposal.clientId.toString() === userId &&
      proposal.status === "pendingArtist"
    );
  } catch (error) {
    console.error("Error checking edit permission:", error);
    return false;
  }
}

export async function canRespondToProposal(
  proposalId: string,
  userId: string,
  role: "client" | "artist"
): Promise<boolean> {
  try {
    const proposal = await getProposalById(proposalId);
    if (!proposal) return false;

    if (role === "artist") {
      return (
        proposal.artistId.toString() === userId &&
        proposal.status === "pendingArtist"
      );
    } else {
      return (
        proposal.clientId.toString() === userId &&
        proposal.status === "pendingClient"
      );
    }
  } catch (error) {
    console.error("Error checking respond permission:", error);
    return false;
  }
}

// ========== Status Operations ==========
export async function finalizeProposal(proposalId: string): Promise<IProposal> {
  try {
    await connectDB();

    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "accepted") {
      throw new Error("Proposal must be in accepted status to finalize");
    }

    return finalizeAcceptance(proposalId);
  } catch (error) {
    console.error("Error finalizing proposal:", error);
    throw error;
  }
}

export async function expireOldProposals(
  asOf: Date = new Date()
): Promise<number> {
  try {
    await connectDB();
    return bulkExpirePending(asOf);
  } catch (error) {
    console.error("Error expiring proposals:", error);
    throw error;
  }
}

// ========== Dashboard Helpers ==========
export async function getDashboardData(userId: string): Promise<{
  incoming: IProposal[];
  outgoing: IProposal[];
  totalIncoming: number;
  totalOutgoing: number;
}> {
  try {
    await connectDB();

    const [incoming, outgoing] = await Promise.all([
      getIncomingProposals(userId),
      getOutgoingProposals(userId),
    ]);

    return {
      incoming,
      outgoing,
      totalIncoming: incoming.length,
      totalOutgoing: outgoing.length,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

// ========== Validation Helpers ==========
export function validateProposalInput(input: any): void {
  // Validate dates
  if (input.earliestDate >= input.latestDate) {
    throw new Error("Earliest date must be before latest date");
  }

  // Validate description
  if (!input.generalDescription.trim()) {
    throw new Error("Description is required");
  }

  // Validate reference images
  if (input.referenceImages && input.referenceImages.length > 5) {
    throw new Error("Maximum 5 reference images allowed");
  }
}

// ========== Utility Operations ==========
export async function getDynamicEstimate(listingId: string) {
  await connectDB();
  const listing = await findCommissionListingById(listingId);
  if (!listing) throw new Error("Listing not found");

  // ── NEW: peek at the artist’s latest active contract
  const latestDeadline = await getLatestActiveContractDeadline(
    listing.artistId
  );

  const baseDate = latestDeadline ?? new Date(); // now if none
  return repoComputeDynamicEstimate(listing, baseDate);
}

// TODO: replace stub with real query once contract.repository is ready
// TODO: once Contract model is wired, return the most recent active one.
export async function getLatestActiveContractDeadline(
  artistId: ObjectId
): Promise<Date | null> {
  return null; // for now, always “no active contract”
}
