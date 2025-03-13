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
    const refreshedResponse = await refreshTokenController(req);
    if (refreshedResponse.status !== 200) {
      return refreshedResponse; // Force logout if refresh failed
    }
    
    const newAccessToken = refreshedResponse.cookies.get("accessToken")?.value;
    if (!newAccessToken) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    // Store new access token in request headers for subsequent calls
    req.headers.set("Authorization", `Bearer ${newAccessToken}`);
  }

  try {
    const decoded = verifyAccessToken(accessToken || req.headers.get("Authorization")?.split(" ")[1] || "");
    return { user: decoded };
  } catch {
    return NextResponse.json({ error: "Invalid session. Please log in again." }, { status: 401 });
  }
}

