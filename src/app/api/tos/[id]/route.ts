// src/app/api/tos/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { updateTosEntry, setDefaultTos, deleteTosEntry } from "@/lib/services/tos.service";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";
import Tos from "@/lib/db/models/tos.model";
import { connectDB } from "@/lib/db/connection";

// Update a TOS entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tosId = params.id;
    if (!tosId) {
      return NextResponse.json(
        { error: "TOS ID is required" },
        { status: 400 }
      );
    }
    
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the TOS entry belongs to the authenticated user
    await connectDB();
    const tosEntry = await Tos.findById(tosId);
    
    if (!tosEntry) {
      return NextResponse.json(
        { error: "TOS entry not found" },
        { status: 404 }
      );
    }
    
    if (tosEntry.user.toString() !== session.id) {
      return NextResponse.json(
        { error: "Unauthorized - this TOS entry does not belong to you" },
        { status: 403 }
      );
    }
    
    const { title, content, setAsDefault } = await req.json();
    
    // Update the TOS entry
    const updatedTos = await updateTosEntry(tosId, title, content);
    
    // Set as default if requested
    if (setAsDefault) {
      await setDefaultTos(session.id, tosId);
    }
    
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

// Delete a TOS entry (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tosId = params.id;
    if (!tosId) {
      return NextResponse.json(
        { error: "TOS ID is required" },
        { status: 400 }
      );
    }
    
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if the TOS entry belongs to the authenticated user
    await connectDB();
    const tosEntry = await Tos.findById(tosId);
    
    if (!tosEntry) {
      return NextResponse.json(
        { error: "TOS entry not found" },
        { status: 404 }
      );
    }
    
    if (tosEntry.user.toString() !== session.id) {
      return NextResponse.json(
        { error: "Unauthorized - this TOS entry does not belong to you" },
        { status: 403 }
      );
    }
    
    // Cannot delete the default TOS
    if (tosEntry.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default TOS" },
        { status: 400 }
      );
    }
    
    await deleteTosEntry(tosId);
    
    const response = NextResponse.json({ 
      message: "TOS deleted successfully" 
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