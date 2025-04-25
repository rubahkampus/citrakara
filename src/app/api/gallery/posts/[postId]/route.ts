// src/app/api/gallery/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession }            from "@/lib/utils/session";
import { cookieOptions }             from "@/lib/utils/cookies";
import { handleError }               from "@/lib/utils/errorHandler";

import {
  editGalleryPost,
  deleteGalleryPost,
} from "@/lib/services/galleryPost.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    const body = await req.json();
    const post = await editGalleryPost(session.userId, params.postId, body);
    const res = NextResponse.json({ post });

    if ("_refreshedAccessToken" in session) {
      res.cookies.set("accessToken", session._refreshedAccessToken!, {
        ...cookieOptions,
        maxAge: 60 * 15,
      });
    }
    return res;
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    await deleteGalleryPost(session.userId, params.postId);
    const res = NextResponse.json({ message: "Deleted" });

    if ("_refreshedAccessToken" in session) {
      res.cookies.set("accessToken", session._refreshedAccessToken!, {
        ...cookieOptions,
        maxAge: 60 * 15,
      });
    }
    return res;
  } catch (err) {
    return handleError(err);
  }
}
