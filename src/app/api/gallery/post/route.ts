// src/app/api/gallery/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { addGalleryPostFromForm } from "@/lib/services/galleryPost.service";

// Create a new gallery post
export async function POST(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const formData = await req.formData();
      const newPost = await addGalleryPostFromForm(session.id, formData);
      
      const response = NextResponse.json({
        message: "Post created successfully",
        post: newPost
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}