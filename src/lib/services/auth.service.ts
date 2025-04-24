// src/lib/services/auth.service.ts
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

/**
 * Register a new user with all required sub-entities
 */
export async function registerUser(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    // Check if email or username already exists
    const existingEmail = await findUserByEmail(email);
    const existingUsername = await findUserByUsername(username);

    if (existingEmail || existingUsername) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user with all relationships 
    // (wallet, default TOS, default galleries all handled in repository)
    const user = await createUser({ 
      email, 
      username, 
      password: hashed 
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      username: user.username,
    });
    
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      username: user.username,
    });

    // Create response
    const response = NextResponse.json({
      message: "Registered successfully",
      user: { 
        username: user.username, 
        email: user.email 
      }
    });
    
    // Set cookies
    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15, // 15 minutes
    });
    
    response.cookies.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" }, 
      { status: 500 }
    );
  }
}

/**
 * Login a user
 */
export async function loginUser(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Find user
    const user = await findUserByUsername(username);
    if (!user || user.isDeleted) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      username: user.username,
    });
    
    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      username: user.username,
    });

    // Create response
    const response = NextResponse.json({
      message: "Login successful",
      user: { 
        username: user.username, 
        email: user.email 
      }
    });
    
    // Set cookies
    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15, // 15 minutes
    });
    
    response.cookies.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login" }, 
      { status: 500 }
    );
  }
}

/**
 * Logout a user
 */
export function logoutUser() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set("accessToken", "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...cookieOptions, maxAge: 0 });
  return response;
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" }, 
        { status: 401 }
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken) as {
      id: string;
      username: string;
    };

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      username: decoded.username,
    });

    // Create response
    const response = NextResponse.json({
      message: "Token refreshed",
    });
    
    // Set new access token cookie
    response.cookies.set("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 60 * 15, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" }, 
      { status: 401 }
    );
  }
}