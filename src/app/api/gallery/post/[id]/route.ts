// src/app/api/gallery/post/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { editGalleryPost, deleteGalleryPost } from "@/lib/services/galleryPost.service";

// Update gallery post
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const data = await req.json();
    
    // Validate input
    const updates: { description?: string; images?: string[] } = {};
    if ('description' in data && typeof data.description === 'string') {
      updates.description = data.description;
    }
    if ('images' in data && Array.isArray(data.images)) {
      updates.images = data.images;
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }
    
    return withAuth(async (session) => {
      const updatedPost = await editGalleryPost(session.id, postId, updates);
      
      const response = NextResponse.json({
        message: "Post updated successfully",
        post: updatedPost
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// Delete gallery post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    
    return withAuth(async (session) => {
      await deleteGalleryPost(session.id, postId);
      
      const response = NextResponse.json({
        message: "Post deleted successfully"
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}