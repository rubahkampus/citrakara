// src/lib/services/UserService.ts
import bcrypt from "bcryptjs";
import { findUserByEmail, findUserByUsername, createUser, findUserPublicProfileByUsername } from "@/lib/repositories/UserRepository";
import { authConfig } from "@/config";

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
