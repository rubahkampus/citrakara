// src/app/api/user/[username]/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { getUserPosts } from "@/lib/services/galleryPost.service";

/**
 * Get all posts for a specific user (public endpoint)
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
    
    const posts = await getUserPosts(username);
    
    return NextResponse.json({ posts });
  } catch (error) {
    return handleError(error);
  }
}