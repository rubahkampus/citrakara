// src/lib/db/repositories/user.repository.ts
import User, { IUser } from "@/lib/db/models/user.model";
import { connectDB } from "@/lib/db/connection";
import { defaultUserConfig } from "@/config";
import { createWallet } from "./wallet.repository";
import { createDefaultTos } from "./tos.repository";
import { createDefaultGalleries } from "./gallery.repository";
import mongoose, { Types } from "mongoose";

/**
 * Find a user by their email address
 * @param email The email address to search for
 * @returns The user document or null if not found
 */
export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email });
}

/**
 * Find a user by their username
 * @param username The username to search for
 * @returns The user document or null if not found
 */
export async function findUserByUsername(username: string) {
  await connectDB();
  return User.findOne({ username });
}

/**
 * Find a user's public profile by username (excludes password)
 * @param username The username to search for
 * @returns The user document without password field, or null if not found
 */
export async function findUserPublicProfileByUsername(username: string) {
  await connectDB();
  return User.findOne({ username }).select("-password");
}

/**
 * Create a new user with related records (wallet, TOS, galleries)
 * @param data Object containing email, username, and password
 * @returns The newly created user with all associated records
 * @throws Error if creation of related records fails
 */
export async function createUser(data: {
  email: string;
  username: string;
  password: string;
}) {
  await connectDB();

  // First create the user with a temporary placeholder for wallet
  const tempUser = new User({
    email: data.email,
    username: data.username,
    password: data.password,
    roles: ["user"],
    displayName: data.username, // default to username
    bio: "",
    profilePicture: defaultUserConfig.profilePicture,
    banner: defaultUserConfig.banner,
    tags: [],
    socials: [],
    openForCommissions: false,
    defaultCurrency: "IDR",
    rating: { avg: 0, count: 0 },
    completedOrders: 0,
    isDeleted: false,
    isSuspended: false,
    emailVerified: false,
    // Add a temporary ObjectId for validation
    wallet: new mongoose.Types.ObjectId(),
  });

  // Save to get the _id
  const savedTempUser = await tempUser.save();
  const userId = savedTempUser._id;

  try {
    // Create wallet, TOS, and galleries
    const [wallet, tos, galleries] = await Promise.all([
      createWallet(userId),
      createDefaultTos(userId),
      createDefaultGalleries(userId),
    ]);

    // Update user with real wallet ID
    const user = await User.findByIdAndUpdate(
      userId,
      {
        wallet: wallet._id,
        tosEntries: [tos._id],
        galleries: galleries.map((gallery) => gallery._id),
      },
      { new: true }
    );

    return user;
  } catch (error) {
    // If anything fails, clean up the temporary user
    await User.findByIdAndDelete(userId);
    throw error;
  }
}

/**
 * Update a user's profile by username
 * @param username The username of the user to update
 * @param updates Object containing fields to update
 * @returns The updated user document without password field
 */
export async function updateUserByUsername(
  username: string,
  updates: Record<string, any>
) {
  await connectDB();
  return User.findOneAndUpdate({ username }, updates, { new: true }).select(
    "-password"
  );
}

/**
 * Find a user by their MongoDB ObjectId
 * @param id The user's ObjectId
 * @returns The user document or null if not found
 */
export async function findUserById(id: string | mongoose.Types.ObjectId) {
  await connectDB();
  return User.findById(id);
}

/**
 * Check if a user has the 'admin' role by their ID
 * @param id The user's ObjectId
 * @returns Boolean indicating whether the user has admin privileges
 */
export async function isAdminById(
  id: string | mongoose.Types.ObjectId
): Promise<boolean> {
  await connectDB();
  const user = await User.findById(id).select("roles");
  if (!user) return false;
  return user.roles.includes("admin");
}

/**
 * Check if a user has the 'admin' role by their username
 * @param username The username to check
 * @returns Boolean indicating whether the user has admin privileges
 */
export async function isAdminByUsername(username: string): Promise<boolean> {
  await connectDB();
  const user = await User.findOne({ username }).select("roles");
  if (!user) return false;
  return user.roles.includes("admin");
}

/**
 * Add an artist to a user's bookmarks
 * @param userId ID of the user adding the bookmark
 * @param artistId ID of the artist to bookmark
 * @returns The updated user's artistBookmarks array
 */
export async function bookmarkArtist(
  userId: string | Types.ObjectId,
  artistId: string | Types.ObjectId
) {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    { $addToSet: { artistBookmarks: artistId } },
    { new: true }
  ).select("artistBookmarks");
}

/**
 * Remove an artist from a user's bookmarks
 * @param userId ID of the user removing the bookmark
 * @param artistId ID of the artist to unbookmark
 * @returns The updated user's artistBookmarks array
 */
export async function unbookmarkArtist(
  userId: string | Types.ObjectId,
  artistId: string | Types.ObjectId
) {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    { $pull: { artistBookmarks: artistId } },
    { new: true }
  ).select("artistBookmarks");
}

/**
 * Add a commission to a user's bookmarks
 * @param userId ID of the user adding the bookmark
 * @param commissionId ID of the commission to bookmark
 * @returns The updated user's commissionBookmarks array
 */
export async function bookmarkCommission(
  userId: string | Types.ObjectId,
  commissionId: string | Types.ObjectId
) {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    { $addToSet: { commissionBookmarks: commissionId } },
    { new: true }
  ).select("commissionBookmarks");
}

/**
 * Remove a commission from a user's bookmarks
 * @param userId ID of the user removing the bookmark
 * @param commissionId ID of the commission to unbookmark
 * @returns The updated user's commissionBookmarks array
 */
export async function unbookmarkCommission(
  userId: string | Types.ObjectId,
  commissionId: string | Types.ObjectId
) {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    { $pull: { commissionBookmarks: commissionId } },
    { new: true }
  ).select("commissionBookmarks");
}

/**
 * Get all artists bookmarked by a user with populated details
 * @param userId ID of the user to get bookmarked artists for
 * @returns Array of artist documents with selected fields
 */
export async function getBookmarkedArtists(userId: string | Types.ObjectId) {
  await connectDB();
  const user = await User.findById(userId).select("artistBookmarks").populate({
    path: "artistBookmarks",
    select:
      "username displayName profilePicture bio tags openForCommissions rating",
  });

  return user?.artistBookmarks || [];
}

/**
 * Get all commissions bookmarked by a user with populated details
 * @param userId ID of the user to get bookmarked commissions for
 * @returns Array of commission documents that are not deleted
 */
export async function getBookmarkedCommissions(
  userId: string | Types.ObjectId
) {
  await connectDB();
  const user = await User.findById(userId)
    .select("commissionBookmarks")
    .populate({
      path: "commissionBookmarks",
      match: { isDeleted: false },
    });

  return user?.commissionBookmarks || [];
}

/**
 * Check if a user has bookmarked a specific artist
 * @param userId ID of the user to check
 * @param artistId ID of the artist to check for in bookmarks
 * @returns Boolean indicating whether the artist is bookmarked
 */
export async function hasBookmarkedArtist(
  userId: string | Types.ObjectId,
  artistId: string | Types.ObjectId
) {
  await connectDB();
  const user = await User.findOne({
    _id: userId,
    artistBookmarks: artistId,
  }).select("_id");

  return !!user;
}

/**
 * Check if a user has bookmarked a specific commission
 * @param userId ID of the user to check
 * @param commissionId ID of the commission to check for in bookmarks
 * @returns Boolean indicating whether the commission is bookmarked
 */
export async function hasBookmarkedCommission(
  userId: string | Types.ObjectId,
  commissionId: string | Types.ObjectId
) {
  await connectDB();
  const user = await User.findOne({
    _id: userId,
    commissionBookmarks: commissionId,
  }).select("_id");

  return !!user;
}

/**
 * Search for artists by name and/or tags with pagination
 * @param options Object containing search parameters
 * @param options.query Optional text to search in username and displayName
 * @param options.tags Optional array of tags to filter by
 * @param options.limit Maximum number of results to return (default: 20)
 * @param options.skip Number of results to skip for pagination (default: 0)
 * @returns Object with artists array and total count of matching records
 */
export async function searchArtists({
  query,
  tags,
  limit = 20,
  skip = 0,
}: {
  query?: string;
  tags?: string[];
  limit?: number;
  skip?: number;
}) {
  await connectDB();

  const searchQuery: any = {
    isDeleted: false,
    isSuspended: false,
  };

  if (query) {
    searchQuery.$or = [
      { displayName: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ];
  }

  if (tags && tags.length > 0) {
    searchQuery.tags = { $in: tags };
  }

  const [artists, total] = await Promise.all([
    User.find(searchQuery)
      .select(
        "username displayName profilePicture bio tags openForCommissions rating"
      )
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(searchQuery),
  ]);

  return { artists, total };
}
