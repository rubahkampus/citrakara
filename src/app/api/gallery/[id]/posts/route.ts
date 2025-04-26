// src/app/api/gallery/[id]/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { listGalleryPosts } from "@/lib/services/galleryPost.service";

// Get all posts for a specific gallery
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const param = await params
    const galleryId = await param.id;
    if (!galleryId) throw new Error("ID required");
    
    return withAuth(async (session) => {
      const posts = await listGalleryPosts(galleryId);
      
      const response = NextResponse.json({ posts });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}