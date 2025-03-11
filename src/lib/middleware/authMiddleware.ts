// src/lib/middleware/authMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/utils/jwt";
import { refreshTokenController } from "@/lib/controllers/AuthController";

export async function authMiddleware(req: NextRequest) {
  let accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    if (!accessToken) {
      // ✅ If no access token, attempt to refresh it
      return await refreshTokenController(req);
    }

    // ✅ Verify the access token
    const decoded = verifyAccessToken(accessToken);
    
    // ✅ Return user data if valid
    return { user: decoded };
  } catch (error) {
    // ❌ If access token is invalid, try refreshing it
    try {
      return await refreshTokenController(req);
    } catch (refreshError) {
      return NextResponse.json({ error: "Session expired, please log in again" }, { status: 401 });
    }
  }
}
