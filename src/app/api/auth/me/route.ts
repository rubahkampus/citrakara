// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { handleError } from "@/lib/utils/errorHandler";

export async function GET() {
  try {
    const session = await getAuthSession();

    // If no session found, return not logged in status
    if (!session || typeof session === "string") {
      return NextResponse.json({
        isLoggedIn: false,
        userId: null,
        username: null,
      });
    }

    // Return authenticated user info
    return NextResponse.json({
      isLoggedIn: true,
      userId: session.id,
      username: session.username,
    });
  } catch (error) {
    return handleError(error);
  }
}
