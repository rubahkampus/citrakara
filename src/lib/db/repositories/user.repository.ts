// src/lib/db/repositories/user.repository.ts
import User from "@/lib/db/models/user.model";
import { connectDB } from "@/lib/db/connection";
import { defaultUserConfig } from "@/config";
import { createWallet } from "./wallet.repository";
import { createDefaultTos } from "./tos.repository";
import { createDefaultGalleries } from "./gallery.repository";

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

  // First create the user without references
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
  });

  // Need to save to get an _id for relationships
  const savedTempUser = await tempUser.save();
  const userId = savedTempUser._id;

  try {
    // Create wallet, TOS, and galleries
    const [wallet, tos, galleries] = await Promise.all([
      createWallet(userId),
      createDefaultTos(userId),
      createDefaultGalleries(userId)
    ]);

    // Update user with relationship IDs
    const galleryIds = galleries.map(gallery => gallery._id);
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        wallet: wallet._id,
        tosEntries: [tos._id],
        galleries: galleryIds
      },
      { new: true }
    );
    
    return user;
  } catch (error) {
    // If anything fails, try to clean up the temporary user
    await User.findByIdAndDelete(userId);
    throw error;
  }
}

/** Update user by username */
export async function updateUserByUsername(username: string, updates: Record<string, any>) {
  await connectDB();
  return User.findOneAndUpdate({ username }, updates, { new: true }).select("-password");
}