// src/lib/controllers/AuthController.ts
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/AuthService";
import { verifyRefreshToken, generateAccessToken } from "@/lib/utils/jwt";
import { LoginSchema } from "@/schemas/AuthSchema";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";
import { authConfig } from "@/config";

export async function loginController(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = LoginSchema.parse(body);

    const { user, accessToken, refreshToken } = await loginUser(username, password);

    const response = NextResponse.json({
      message: "Logged in successfully!",
      user: { id: user._id.toString(), username: user.username, email: user.email },
    });

    response.cookies.set("accessToken", accessToken, { ...cookieOptions, maxAge: authConfig.accessTokenExpiry });
    response.cookies.set("refreshToken", refreshToken, { ...cookieOptions, maxAge: authConfig.refreshTokenExpiry });

    return response;
  } catch (error) {
    return handleError(error);
  }
}

export function refreshTokenController(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (!refreshToken) throw new Error("No refresh token");

    const decoded = verifyRefreshToken(refreshToken) as { id: string; username: string };
    const newAccessToken = generateAccessToken({ id: decoded.id, username: decoded.username });

    const response = NextResponse.json({ message: "Token refreshed" });
    response.cookies.set("accessToken", newAccessToken, { ...cookieOptions, maxAge: authConfig.accessTokenExpiry });

    return response;
  } catch (error) {
    // ⛔ If refresh token is invalid or expired, log out the user
    const response = NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    response.cookies.set("accessToken", "", { ...cookieOptions, maxAge: 0 });
    response.cookies.set("refreshToken", "", { ...cookieOptions, maxAge: 0 });

    return response;
  }
}


export async function logoutController() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.set("accessToken", "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...cookieOptions, maxAge: 0 });

  return response;
}