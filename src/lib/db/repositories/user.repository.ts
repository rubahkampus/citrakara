// src/lib/db/repositories/user.repository.ts
import User, { IUser } from "@/lib/db/models/user.model";
import { connectDB } from "@/lib/db/connection";
import { defaultUserConfig } from "@/config";
import { createWallet } from "./wallet.repository";
import { createDefaultTos } from "./tos.repository";
import { createDefaultGalleries } from "./gallery.repository";
import mongoose, { Types } from "mongoose";

/** Return user by email */
export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email });
}

/** Return user by username */
export async function findUserByUsername(username: string) {
  await connectDB();
  return User.findOne({ username });
}

/** Return user by username (without password) */
export async function findUserPublicProfileByUsername(username: string) {
  await connectDB();
  return User.findOne({ username }).select("-password");
}

/** Create a new user with related records */
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

/** Update user by username */
export async function updateUserByUsername(
  username: string,
  updates: Record<string, any>
) {
  await connectDB();
  return User.findOneAndUpdate({ username }, updates, { new: true }).select(
    "-password"
  );
}

/** Get a user by their MongoDB ObjectId */
export async function findUserById(id: string | mongoose.Types.ObjectId) {
  await connectDB();
  return User.findById(id);
}

/** Check if a user has the 'admin' role */
export async function isAdminById(
  id: string | mongoose.Types.ObjectId
): Promise<boolean> {
  await connectDB();
  const user = await User.findById(id).select("roles");
  if (!user) return false;
  return user.roles.includes("admin");
}

/** Check if a user identified by username has the 'admin' role */
export async function isAdminByUsername(username: string): Promise<boolean> {
  await connectDB();
  const user = await User.findOne({ username }).select("roles");
  if (!user) return false;
  return user.roles.includes("admin");
}

/** Bookmark an artist */
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

/** Unbookmark an artist */
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

/** Bookmark a commission listing */
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

/** Unbookmark a commission listing */
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

/** Get bookmarked artists for a user */
export async function getBookmarkedArtists(userId: string | Types.ObjectId) {
  await connectDB();
  const user = await User.findById(userId).select("artistBookmarks").populate({
    path: "artistBookmarks",
    select:
      "username displayName profilePicture bio tags openForCommissions rating",
  });

  return user?.artistBookmarks || [];
}

/** Get bookmarked commission listings for a user */
export async function getBookmarkedCommissions(
  userId: string | Types.ObjectId
) {
  await connectDB();
  const user = await User.findById(userId)
    .select("commissionBookmarks")
    .populate({
      path: "commissionBookmarks",
      select:
        "title price samples thumbnailIdx tags type flow slots slotsUsed isActive artistId",
      match: { isDeleted: false },
    });

  return user?.commissionBookmarks || [];
}

/** Check if user has bookmarked an artist */
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

/** Check if user has bookmarked a commission */
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

/** Search for artists by tags and/or name */
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
