// src/lib/repositories/UserRepository.ts
import { connectDB } from "@/lib/utils/db";
import User from "@/lib/models/User";

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
export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  bio?: string;
  profilePicture?: string;
  banner?: string;
}) {
  await connectDB();
  return User.create(new User(data)); // ✅ Ensures Mongoose schema validation
}


/** Update user by username */
export async function updateUserByUsername(username: string, updates: Record<string, any>) {
  await connectDB();
  return User.findOneAndUpdate({ username }, updates, { new: true }).select("-password");
}
