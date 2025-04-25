// src/lib/api/rotateToken.ts
import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/utils/cookies";
export function rotateToken(res: NextResponse, session: any) {
  if (session && typeof session === "object" && "_refreshedAccessToken" in session) {
    res.cookies.set("accessToken", session._refreshedAccessToken!, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });
  }
}