// src/lib/middleware/authMiddleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/utils/jwt";
import { refreshTokenController } from "@/lib/controllers/AuthController";

/** Helper function to attempt refreshing tokens */
async function attemptTokenRefresh(req: NextRequest) {
  try {
    return await refreshTokenController(req);
  } catch {
    return NextResponse.json({ error: "Session expired, please log in again" }, { status: 401 });
  }
}

export async function authMiddleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // ❌ If refreshToken is missing, reject immediately (no infinite refresh loops)
  if (!refreshToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ✅ If no access token, attempt to refresh
  if (!accessToken) {
    return await attemptTokenRefresh(req);
  }

  try {
    // ✅ Verify the access token
    const decoded = verifyAccessToken(accessToken);
    
    // ✅ If valid, return user data
    return { user: decoded };
  } catch {
    // ❌ If access token is invalid, attempt to refresh ONCE
    return await attemptTokenRefresh(req);
  }
}
