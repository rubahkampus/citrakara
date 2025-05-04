// src/app/api/tos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { updateTosEntry, getTosById } from "@/lib/services/tos.service";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";

// Get a specific TOS entry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tosId = params.id;
    
    // const session = await getAuthSession();
    
    // if (!session || typeof session === "string" || !session.id) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }
    
    const tos = await getTosById(tosId);
    
    if (!tos) {
      return NextResponse.json(
        { error: "TOS entry not found" },
        { status: 404 }
      );
    }
    
    const response = NextResponse.json({ tos });
    
    // // If token was refreshed, set the new access token
    // if ("_refreshedAccessToken" in session) {
    //   response.cookies.set("accessToken", session._refreshedAccessToken!, {
    //     ...cookieOptions,
    //     maxAge: 60 * 15,
    //   });
    // }
    
    return response;
  } catch (error) {
    return handleError(error);
  }
}

// Update a TOS entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tosId = params.id;
    
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { title, content, setAsDefault } = await req.json();
    
    // Validate the data
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
    
    // Update the TOS
    const updatedTos = await updateTosEntry(tosId, session.id, title, content, setAsDefault === true);
    
    const response = NextResponse.json({
      message: "TOS updated successfully",
      tos: updatedTos
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