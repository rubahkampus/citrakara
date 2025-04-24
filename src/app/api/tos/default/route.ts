// src/app/api/tos/default/route.ts
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { getUserDefaultTos } from "@/lib/services/tos.service";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";

// Get the default TOS for the authenticated user
export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const defaultTos = await getUserDefaultTos(session.id);
    
    if (!defaultTos) {
      return NextResponse.json(
        { error: "Default TOS not found" },
        { status: 404 }
      );
    }
    
    const response = NextResponse.json({ tos: defaultTos });
    
    // If token was refreshed, set the new access token
    if ("_refreshedAccessToken" in session) {
      response.cookies.set("accessToken", session._refreshedAccessToken!, {
        ...cookieOptions,
        maxAge: 60 * 15,
      });
    }
    
    return response;
  } catch (error) {
    return handleError(error);
  }
}