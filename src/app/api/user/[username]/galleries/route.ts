// src/app/api/user/[username]/galleries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { getGalleriesByUsername } from "@/lib/services/gallery.service";

/**
 * Get all galleries for a specific user (public endpoint)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const param = await params;
    const username = param.username;
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    
    const galleries = await getGalleriesByUsername(username);
    
    return NextResponse.json({ galleries });
  } catch (error) {
    return handleError(error);
  }
}
