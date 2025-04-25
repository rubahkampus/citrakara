// src/app/api/gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { createUserGallery, getUserGalleries } from "@/lib/services/gallery.service";

// Create a new gallery
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    
    return withAuth(async (session) => {
      const newGallery = await createUserGallery(session.id, name);
      
      const response = NextResponse.json({
        message: "Gallery created successfully",
        gallery: newGallery
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// Get all galleries for the authenticated user
export async function GET() {
  try {
    return withAuth(async (session) => {
      const galleries = await getUserGalleries(session.id);
      
      const response = NextResponse.json({ galleries });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}