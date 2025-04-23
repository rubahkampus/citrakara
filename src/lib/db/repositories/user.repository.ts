// lib/db/repositories/user.repository.ts
import User from "@/lib/db/models/user.model";
import { connectDB } from "@/lib/db/connection";
import { defaultUserConfig } from "@/config";

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

/** Create a new user */
/** Create a new user */
export async function createUser(data: {
  email: string;
  username: string;
  password: string;
}) {
  await connectDB();

  const user = new User({
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
    earningsTotal: 0,
    isDeleted: false,
    isSuspended: false,
    emailVerified: false,
  });

  return user.save();
}


/** Update user by username */
export async function updateUserByUsername(username: string, updates: Record<string, any>) {
  await connectDB();
  return User.findOneAndUpdate({ username }, updates, { new: true }).select("-password");
}
