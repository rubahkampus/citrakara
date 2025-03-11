// src/lib/services/UserService.ts
import bcrypt from "bcryptjs";
import { findUserByEmail, findUserByUsername, createUser, findUserByUsernamePublic } from "@/lib/repositories/UserRepository";

/** Register a new user */
export async function registerUser(email: string, username: string, password: string) {
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw new Error("Email already registered");

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) throw new Error("Username already used");

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser({ email, username, password: hashedPassword });
}

/** Check if email or username is available */
export async function checkUserAvailabilityService(email?: string, username?: string) {
  if (email) {
    const user = await findUserByEmail(email);
    if (user) {
      return { error: "Email is already registered" };
    }
    return { message: "Email is available" };
  }

  if (username) {
    const user = await findUserByUsername(username);
    if (user) {
      return { error: "Username is already taken" };
    }
    return { message: "Username is available" };
  }

  throw new Error("Invalid parameters");
}

/** Fetch a user's public profile */
export async function getUserProfile(username: string) {
  const user = await findUserByUsernamePublic(username);
  if (!user) throw new Error("User not found");

  return user;
}
