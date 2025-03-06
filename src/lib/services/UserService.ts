// src/lib/services/UserService.ts
import bcrypt from "bcrypt";
import { findUserByEmail, findUserByUsername, createUser } from "@/lib/repositories/UserRepository";

/** Register a new user */
export async function registerUser(email: string, username: string, password: string) {
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) throw new Error("Email already registered");

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) throw new Error("Username already used");

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser({ email, username, password: hashedPassword });
}
