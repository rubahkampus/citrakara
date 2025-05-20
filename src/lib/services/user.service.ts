// lib/services/user.service.ts

import { Types } from "mongoose";
import { HttpError } from "./commissionListing.service";
import { uploadFileToR2 } from "@/lib/utils/cloudflare";
import {
  findUserByEmail,
  findUserByUsername,
  findUserPublicProfileByUsername,
  updateUserByUsername,
  isAdminById as repoIsAdminById,
  isAdminByUsername as repoIsAdminByUsername,
  bookmarkArtist,
  unbookmarkArtist,
  bookmarkCommission,
  unbookmarkCommission,
  getBookmarkedArtists,
  getBookmarkedCommissions,
  hasBookmarkedArtist,
  hasBookmarkedCommission,
  searchArtists,
} from "@/lib/db/repositories/user.repository";

/* ======================================================================
 * User Management Functions
 * ====================================================================== */

/**
 * Check if an email or username is available for registration
 *
 * @param email Optional email to check availability
 * @param username Optional username to check availability
 * @returns Object with error message if unavailable, success message if available
 * @throws Error if neither email nor username is provided
 */
export async function checkUserAvailability(email?: string, username?: string) {
  if (!email && !username) throw new Error("Missing email or username");

  if (email) {
    const existing = await findUserByEmail(email);
    if (existing) return { error: "Email already in use" };
  }

  if (username) {
    const existing = await findUserByUsername(username);
    if (existing) return { error: "Username already taken" };
  }

  return { message: "Available" };
}

/**
 * Get a user's public profile by username
 *
 * @param username Username of the user to fetch
 * @returns User's public profile or null if not found
 */
export async function getUserPublicProfile(username: string) {
  return findUserPublicProfileByUsername(username);
}

/**
 * Update a user's profile information from form data
 *
 * @param username Username of the user to update
 * @param formData Form data containing profile updates
 * @returns Updated user document
 */
export async function updateUserProfile(username: string, formData: FormData) {
  const updates: Record<string, any> = {};

  const bio = formData.get("bio");
  if (bio && typeof bio === "string") updates.bio = bio;

  const displayName = formData.get("displayName");
  if (displayName && typeof displayName === "string")
    updates.displayName = displayName;

  const openForCommissions = formData.get("openForCommissions");
  if (openForCommissions !== null)
    updates.openForCommissions = openForCommissions === "true";

  const defaultCurrency = formData.get("defaultCurrency");
  if (defaultCurrency && typeof defaultCurrency === "string")
    updates.defaultCurrency = defaultCurrency;

  const tags = formData.get("tags");
  if (tags && typeof tags === "string") {
    // comma-separated: "anime,furry,cute"
    updates.tags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  const socials = formData.get("socials");
  if (socials && typeof socials === "string") {
    try {
      const parsed = JSON.parse(socials);
      if (Array.isArray(parsed)) {
        updates.socials = parsed.filter(
          (s) => typeof s.label === "string" && typeof s.url === "string"
        );
      }
    } catch (err) {
      console.warn("Invalid socials JSON");
    }
  }

  const profilePicture = formData.get("profilePicture");
  if (profilePicture instanceof Blob) {
    const profilePictureUrl = await uploadFileToR2(
      profilePicture,
      `profile-pics/${username}`
    );
    updates.profilePicture = profilePictureUrl;
  }

  const banner = formData.get("banner");
  if (banner instanceof Blob) {
    const bannerUrl = await uploadFileToR2(banner, `banners/${username}`);
    updates.banner = bannerUrl;
  }

  return updateUserByUsername(username, updates);
}

/* ======================================================================
 * Admin Functions
 * ====================================================================== */

/**
 * Determine if a user is admin by their ID
 *
 * @param userId ID of the user to check
 * @returns Boolean indicating whether the user is an admin
 */
export async function isUserAdminById(userId: string): Promise<boolean> {
  const isAdmin = await repoIsAdminById(new Types.ObjectId(userId));
  return isAdmin;
}

/**
 * Determine if a user is admin by their username
 *
 * @param username Username of the user to check
 * @returns Boolean indicating whether the user is an admin
 */
export async function isUserAdminByUsername(
  username: string
): Promise<boolean> {
  const isAdmin = await repoIsAdminByUsername(username);
  return isAdmin;
}

/**
 * Guard middleware for Express-like routes to restrict access to admins
 *
 * @param roles Array of allowed roles (defaults to ["admin"])
 * @returns Middleware function for route protection
 * @throws HttpError if user is not authenticated or not an admin
 */
export function requireAdmin(roles: string[] = ["admin"]) {
  return async function (req: any, res: any, next: any) {
    const userId = req.user?.id;
    if (!userId) throw new HttpError("Authentication required", 401);
    const isAdmin = await repoIsAdminById(userId);
    if (!isAdmin) throw new HttpError("Forbidden: Admins only", 403);
    next();
  };
}

/* ======================================================================
 * Bookmark Functions
 * ====================================================================== */

/**
 * Toggle bookmark status for an artist
 *
 * @param userId ID of the user performing the action
 * @param artistId ID of the artist to bookmark/unbookmark
 * @param action Whether to bookmark or unbookmark
 * @returns Object with status message and current bookmark state
 * @throws HttpError if parameters are invalid
 */
export async function toggleArtistBookmark(
  userId: string,
  artistId: string,
  action: "bookmark" | "unbookmark"
) {
  if (!userId || !artistId) {
    throw new HttpError("Missing required parameters", 400);
  }

  if (userId === artistId) {
    throw new HttpError("You cannot bookmark yourself", 400);
  }

  const isBookmarked = await hasBookmarkedArtist(userId, artistId);

  if (action === "bookmark" && isBookmarked) {
    return { message: "Artist already bookmarked", isBookmarked: true };
  } else if (action === "unbookmark" && !isBookmarked) {
    return { message: "Artist not bookmarked", isBookmarked: false };
  }

  if (action === "bookmark") {
    await bookmarkArtist(userId, artistId);
    return { message: "Artist bookmarked successfully", isBookmarked: true };
  } else {
    await unbookmarkArtist(userId, artistId);
    return { message: "Artist unbookmarked successfully", isBookmarked: false };
  }
}

/**
 * Toggle bookmark status for a commission listing
 *
 * @param userId ID of the user performing the action
 * @param commissionId ID of the commission to bookmark/unbookmark
 * @param action Whether to bookmark or unbookmark
 * @returns Object with status message and current bookmark state
 * @throws HttpError if parameters are invalid
 */
export async function toggleCommissionBookmark(
  userId: string,
  commissionId: string,
  action: "bookmark" | "unbookmark"
) {
  if (!userId || !commissionId) {
    throw new HttpError("Missing required parameters", 400);
  }

  const isBookmarked = await hasBookmarkedCommission(userId, commissionId);

  if (action === "bookmark" && isBookmarked) {
    return { message: "Commission already bookmarked", isBookmarked: true };
  } else if (action === "unbookmark" && !isBookmarked) {
    return { message: "Commission not bookmarked", isBookmarked: false };
  }

  if (action === "bookmark") {
    await bookmarkCommission(userId, commissionId);
    return {
      message: "Commission bookmarked successfully",
      isBookmarked: true,
    };
  } else {
    await unbookmarkCommission(userId, commissionId);
    return {
      message: "Commission unbookmarked successfully",
      isBookmarked: false,
    };
  }
}

/**
 * Get all artists bookmarked by a user
 *
 * @param userId ID of the user
 * @returns Array of bookmarked artist documents
 */
export async function getUserBookmarkedArtists(userId: string) {
  return getBookmarkedArtists(userId);
}

/**
 * Get all commission listings bookmarked by a user
 *
 * @param userId ID of the user
 * @returns Array of bookmarked commission documents
 */
export async function getUserBookmarkedCommissions(userId: string) {
  return getBookmarkedCommissions(userId);
}

/**
 * Check if a user has bookmarked a specific artist
 *
 * @param userId ID of the user
 * @param artistId ID of the artist
 * @returns Boolean indicating whether the user has bookmarked the artist
 */
export async function getArtistBookmarkStatus(
  userId: string,
  artistId: string
) {
  if (!userId || !artistId) return false;
  return hasBookmarkedArtist(userId, artistId);
}

/**
 * Check if a user has bookmarked a specific commission listing
 *
 * @param userId ID of the user
 * @param commissionId ID of the commission
 * @returns Boolean indicating whether the user has bookmarked the commission
 */
export async function getCommissionBookmarkStatus(
  userId: string,
  commissionId: string
) {
  if (!userId || !commissionId) return false;
  return hasBookmarkedCommission(userId, commissionId);
}

/* ======================================================================
 * Search Functions
 * ====================================================================== */

/**
 * Search for artists based on query parameters
 *
 * @param params Object containing search parameters (query, tags, pagination)
 * @returns Search results with artists matching the criteria
 */
export async function searchArtistsService(params: {
  query?: string;
  tags?: string[];
  limit?: number;
  skip?: number;
}) {
  return searchArtists(params);
}
