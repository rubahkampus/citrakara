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
} from "@/lib/db/repositories/proposal.repository";
import { findCommissionListingById } from "@/lib/db/repositories/commissionListing.repository";
import { findUserByUsername } from "@/lib/db/repositories/user.repository";
import { connectDB } from "@/lib/db/connection";
import { uploadGalleryImagesToR2 } from "@/lib/utils/cloudflare";
import type { Cents } from "@/types/common";
import { HttpError } from "./commissionListing.service";

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
  accept: boolean;
  surcharge?: number;
  discount?: number;
  reason?: string;
}

export interface ClientDecision {
  accept: boolean;
  rejectionReason?: string;
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

    // Extract form date fields
    const earliestDate = form.get("earliestDate");
    const latestDate = form.get("latestDate");
    const deadline = form.get("deadline");
    const generalDescription = form.get("generalDescription");

    if (
      !earliestDate ||
      !latestDate ||
      !deadline ||
      !generalDescription ||
      typeof generalDescription !== "string"
    ) {
      throw new HttpError("Missing required proposal fields", 400);
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
      earliestDate: new Date(earliestDate.toString()),
      latestDate: new Date(latestDate.toString()),
      deadline: new Date(deadline.toString()),
      generalDescription: generalDescription.toString(),
      referenceImages,
      generalOptions,
      subjectOptions,
    };

    validateProposalInput(proposalInput); // Validate input before creating

    return repoCreateProposal(proposalInput);
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
      throw new HttpError("Can only edit proposals in pendingArtist status", 400);
    }

    // Parse JSON payload
    let jsonPayload: any;
    try {
      const raw = form.get("payload");
      jsonPayload = raw && typeof raw === "string" ? JSON.parse(raw) : {};
    } catch {
      throw new HttpError("Invalid JSON payload", 400);
    }

    // Extract form fields
    const updates: UpdateProposalInput = {};
    
    // Handle date fields if provided
    const earliestDate = form.get("earliestDate");
    if (earliestDate) {
      updates.earliestDate = new Date(earliestDate.toString());
    }
    
    const latestDate = form.get("latestDate");
    if (latestDate) {
      updates.latestDate = new Date(latestDate.toString());
    }
    
    const deadline = form.get("deadline");
    if (deadline) {
      updates.deadline = new Date(deadline.toString());
    }
    
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
      .map(v => v.toString());

    const referenceBlobs = form
      .getAll("referenceImages[]")
      .filter(v => v instanceof Blob) as Blob[];

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

    const updatedProposal = await repoUpdateProposal(proposalId, updates);
    if (!updatedProposal) {
      throw new HttpError("Failed to update proposal", 500);
    }

    return updatedProposal;
  } catch (error) {
    console.error("Error updating proposal:", error);
    throw error;
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

    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.artistId.toString() !== artistId) {
      throw new Error("Not authorized to respond to this proposal");
    }

    let adjustment: ArtistAdjustment | undefined;

    if (decision.accept && (decision.surcharge || decision.discount)) {
      adjustment = {};

      if (decision.surcharge) {
        adjustment.surcharge = {
          amount: decision.surcharge,
          reason: decision.reason || "Artist adjustment",
        };
      }

      if (decision.discount) {
        adjustment.discount = {
          amount: decision.discount,
          reason: decision.reason || "Artist adjustment",
        };
      }
    }

    return artistResponds(
      proposalId,
      decision.accept,
      adjustment,
      decision.reason
    );
  } catch (error) {
    console.error("Error in artist response:", error);
    throw error;
  }
}

export async function clientRespondToAdjustment(
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

    return clientRespondsToAdjustment(
      proposalId,
      decision.accept,
      decision.rejectionReason
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

    const options: FindOpts = {
      status: filters?.status || ["pendingArtist", "pendingClient"],
      beforeExpire: filters?.beforeExpire,
    };

    return findProposalsByArtist(artistId, options);
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
      getIncomingProposals(userId, {
        status: ["pendingArtist", "pendingClient"],
      }),
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

  if (
    input.deadline < input.earliestDate ||
    input.deadline > input.latestDate
  ) {
    throw new Error("Deadline must be between earliest and latest date");
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

// ========== Helper for Options Processing ==========
export function calculateTotalPrice(proposal: IProposal): {
  basePrice: number;
  optionsTotal: number;
  rush: number;
  discount: number;
  surcharge: number;
  finalTotal: number;
} {
  const { calculatedPrice } = proposal;

  return {
    basePrice: calculatedPrice.base,
    optionsTotal: calculatedPrice.optionGroups + calculatedPrice.addons,
    rush: calculatedPrice.rush,
    discount: calculatedPrice.discount,
    surcharge: calculatedPrice.surcharge,
    finalTotal: calculatedPrice.total,
  };
}

// ========== Format Helpers for Frontend ==========
export function formatProposalForUI(proposal: IProposal) {
  const priceBreakdown = calculateTotalPrice(proposal);

  return {
    id: proposal._id.toString(),
    status: proposal.status,
    clientId: proposal.clientId.toString(),
    artistId: proposal.artistId.toString(),
    listingId: proposal.listingId.toString(),
    listingTitle: proposal.listingSnapshot.title,
    deadline: new Date(proposal.deadline),
    availability: {
      earliestDate: new Date(proposal.availability.earliestDate),
      latestDate: new Date(proposal.availability.latestDate),
    },
    description: proposal.generalDescription,
    referenceImages: proposal.referenceImages,
    expiresAt: proposal.expiresAt ? new Date(proposal.expiresAt) : null,
    priceBreakdown,
    adjustments: proposal.artistAdjustments,
    rejectionReason: proposal.rejectionReason,
    createdAt: new Date(proposal.createdAt),
    updatedAt: new Date(proposal.updatedAt),
  };
}

// ========== Utility Operations ==========
export async function getDynamicEstimate(
  listingId: string
): Promise<{ earliestDate: Date; latestDate: Date }> {
  try {
    await connectDB();

    const listing = await findCommissionListingById(listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Create basic snapshot for estimate computation
    const listingSnapshot = {
      deadline: listing.deadline,
    };

    return repoComputeDynamicEstimate(listingSnapshot as any);
  } catch (error) {
    console.error("Error computing dynamic estimate:", error);
    throw error;
  }
}
