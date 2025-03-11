// src/lib/controllers/AuthController.ts
import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/AuthService";
import { verifyRefreshToken, generateAccessToken } from "@/lib/utils/jwt";
import { LoginSchema } from "@/schemas/AuthSchema";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";

export async function loginController(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = LoginSchema.parse(body);

    const { user, accessToken, refreshToken } = await loginUser(username, password);

    const response = NextResponse.json({
      message: "Logged in successfully!",
      user: { id: user._id.toString(), username: user.username, email: user.email },
    });

    response.cookies.set("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 });
    response.cookies.set("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });

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
    response.cookies.set("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 });

    return response;
  } catch (error) {
    return handleError(error, 403);
  }
}

export function logoutController() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.set("accessToken", "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...cookieOptions, maxAge: 0 });

  return response;
}
