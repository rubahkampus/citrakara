// lib/services/auth.service.ts
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/utils/jwt";
import { cookieOptions } from "@/lib/utils/cookies";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from "@/lib/db/repositories/user.repository";

export async function registerUser(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    const existingEmail = await findUserByEmail(email);
    const existingUsername = await findUserByUsername(username);

    if (existingEmail || existingUsername) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ email, username, password: hashed });

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      username: user.username,
    });
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      username: user.username,
    });

    const response = NextResponse.json({
      message: "Registered successfully",
      user: { username: user.username, email: user.email },
    });
    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });
    response.cookies.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

export async function loginUser(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await findUserByUsername(username);
    if (!user || user.isDeleted) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      username: user.username,
    });
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      username: user.username,
    });

    const response = NextResponse.json({
      message: "Login successful",
      user: { username: user.username, email: user.email },
    });
    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });
    response.cookies.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}

export function logoutUser() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set("accessToken", "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...cookieOptions, maxAge: 0 });
  return response;
}