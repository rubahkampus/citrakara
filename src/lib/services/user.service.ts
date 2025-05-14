// lib/services/user.service.ts
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
import { uploadFileToR2 } from "@/lib/utils/cloudflare";
import { Types } from "mongoose";
import { HttpError } from "./commissionListing.service";

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

export async function getUserPublicProfile(username: string) {
  return findUserPublicProfileByUsername(username);
}

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

/** Service: Determine if a user is admin by their ID */
export async function isUserAdminById(userId: string): Promise<boolean> {
  const isAdmin = await repoIsAdminById(new Types.ObjectId(userId));
  return isAdmin;
}

/** Service: Determine if a user is admin by their username */
export async function isUserAdminByUsername(
  username: string
): Promise<boolean> {
  const isAdmin = await repoIsAdminByUsername(username);
  return isAdmin;
}

/** Optional: Guard middleware for Express-like routes */
export function requireAdmin(roles: string[] = ["admin"]) {
  return async function (req: any, res: any, next: any) {
    const userId = req.user?.id;
    if (!userId) throw new HttpError("Authentication required", 401);
    const isAdmin = await repoIsAdminById(userId);
    if (!isAdmin) throw new HttpError("Forbidden: Admins only", 403);
    next();
  };
}

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

export async function getUserBookmarkedArtists(userId: string) {
  return getBookmarkedArtists(userId);
}

export async function getUserBookmarkedCommissions(userId: string) {
  return getBookmarkedCommissions(userId);
}

export async function getArtistBookmarkStatus(
  userId: string,
  artistId: string
) {
  if (!userId || !artistId) return false;
  return hasBookmarkedArtist(userId, artistId);
}

export async function getCommissionBookmarkStatus(
  userId: string,
  commissionId: string
) {
  if (!userId || !commissionId) return false;
  return hasBookmarkedCommission(userId, commissionId);
}

export async function searchArtistsService(params: {
  query?: string;
  tags?: string[];
  limit?: number;
  skip?: number;
}) {
  return searchArtists(params);
}
