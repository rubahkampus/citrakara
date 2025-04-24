// src/app/api/tos/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { getUserTosEntries, createNewTosEntry } from "@/lib/services/tos.service";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";

// Get all TOS entries for the authenticated user
export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const tosEntries = await getUserTosEntries(session.id);
    
    const response = NextResponse.json({ tosEntries });
    
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

// Create a new TOS entry
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { title, content } = await req.json();
    
    if (!title || !content || !Array.isArray(content)) {
      return NextResponse.json(
        { error: "Invalid TOS data" },
        { status: 400 }
      );
    }
    
    // Validate content structure
    for (const section of content) {
      if (!section.subtitle || !section.text) {
        return NextResponse.json(
          { error: "Each TOS section must have a subtitle and text" },
          { status: 400 }
        );
      }
    }
    
    const newTos = await createNewTosEntry(session.id, title, content);
    
    const response = NextResponse.json({ 
      message: "TOS created successfully",
      tos: newTos 
    });
    
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