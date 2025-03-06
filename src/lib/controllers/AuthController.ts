// src/lib/controllers/AuthController.ts
import { NextResponse } from "next/server";
import { loginUser } from "@/lib/services/AuthService";
import { verifyRefreshToken, generateAccessToken } from "@/lib/utils/jwt";

export async function loginController(username: string, password: string) {
  try {
    const { user, accessToken, refreshToken } = await loginUser(username, password);

    // Create response
    const response = NextResponse.json({
      message: "Logged in successfully!",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });

    // Set cookies
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export function refreshTokenController(refreshToken?: string) {
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    // Verify token
    const decoded = verifyRefreshToken(refreshToken) as { id: string; username: string };

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      username: decoded.username,
    });

    // Return a NextResponse with updated cookie
    const response = NextResponse.json({ message: "Token refreshed!" });
    response.headers.set(
      "Set-Cookie",
      `accessToken=${newAccessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900`
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 403 });
  }
}

export function logoutController() {
  // Create response
  const response = NextResponse.json({ message: "Logged out successfully" });

  // Clear both accessToken and refreshToken cookies
  // (Switching to .cookies.set for consistency)
  response.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}
