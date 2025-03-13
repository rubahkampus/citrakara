// src/lib/services/UserService.ts
import bcrypt from "bcryptjs";
import { findUserByEmail, findUserByUsername, createUser, findUserPublicProfileByUsername, updateUserByUsername } from "@/lib/repositories/UserRepository";
import { authConfig } from "@/config";
import { uploadFileToR2 } from "@/lib/utils/cloudflare";

/** Register a new user */
export async function registerUser(email: string, username: string, password: string) {
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw new Error("Email already in use");

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) throw new Error("Username already taken");

  const hashedPassword = await bcrypt.hash(password, authConfig.bcryptSaltRounds);
  return createUser({ email, username, password: hashedPassword });
}

/** Check if email or username is available */
export async function checkUserAvailabilityService(email?: string, username?: string) {
  if (email) {
    const user = await findUserByEmail(email);
    if (user) {
      return { error: "Email is already in use" };
    }
    return { message: "Available" };
  }

  if (username) {
    const user = await findUserByUsername(username);
    if (user) {
      return { error: "Username is taken" };
    }
    return { message: "Available" };
  }

  throw new Error("Invalid parameters");
}

/** Fetch a user's public profile */
export async function getUserPublicProfile(username: string) {
  return findUserPublicProfileByUsername(username); // Removed redundant checks
}



/** Update user profile */
export async function updateUserProfileService(username: string, updateData: any) {
  const user = await findUserByUsername(username); // ✅ Fetch by username
  if (!user) throw new Error("User not found");

  const updates: Record<string, any> = {};

  if (updateData.bio) {
    updates.bio = updateData.bio;
  }

  if (updateData.profilePicture instanceof Blob) {
    const profilePictureUrl = await uploadFileToR2(updateData.profilePicture, `profile-pics/${username}`); // ✅ Use username
    updates.profilePicture = profilePictureUrl;
  }

  if (updateData.banner instanceof Blob) {
    const bannerUrl = await uploadFileToR2(updateData.banner, `banners/${username}`); // ✅ Use username
    updates.banner = bannerUrl;
  }

  return updateUserByUsername(username, updates); // ✅ Update by username
}
