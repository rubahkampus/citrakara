// src/lib/services/AuthService.ts
import bcrypt from "bcrypt";
import { findUserByUsername } from "@/lib/repositories/UserRepository";
import { generateAccessToken, generateRefreshToken } from "@/lib/utils/jwt";

/** Login user (credentials flow) */
export async function loginUser(username: string, password: string) {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken({ id: user._id.toString(), username: user.username });
  const refreshToken = generateRefreshToken({ id: user._id.toString(), username: user.username });

  return { user, accessToken, refreshToken };
}
