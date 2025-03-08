// src/app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/authMiddleware";

export async function GET(req: NextRequest) {
  const authResponse = await authMiddleware(req);

  if (authResponse instanceof NextResponse) {
    return authResponse; // If middleware returns a response (error), return it.
  }

  // ✅ If user is authenticated, return user info
  return NextResponse.json({ user: authResponse.user });
}
