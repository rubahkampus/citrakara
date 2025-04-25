// src/app/api/gallery/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { renameGallery, deleteGallery } from "@/lib/services/gallery.service";

// Rename gallery
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const galleryId = params.id;
    const { name } = await req.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    
    return withAuth(async (session) => {
      const updatedGallery = await renameGallery(session.id, galleryId, name);
      
      const response = NextResponse.json({
        message: "Gallery renamed successfully",
        gallery: updatedGallery
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// Delete gallery
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const galleryId = params.id;
    
    return withAuth(async (session) => {
      await deleteGallery(session.id, galleryId);
      
      const response = NextResponse.json({
        message: "Gallery deleted successfully"
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}