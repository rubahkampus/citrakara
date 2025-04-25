// src/app/api/gallery/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession }            from "@/lib/utils/session";
import { cookieOptions }             from "@/lib/utils/cookies";
import { handleError }               from "@/lib/utils/errorHandler";

import {
  listGalleryPosts,
  addGalleryPostFromForm,
} from "@/lib/services/galleryPost.service";

/* GET /api/gallery/posts?galleryId=<id>&includeDeleted=1 */
export async function GET(req: NextRequest) {
  try {
    const galleryId = req.nextUrl.searchParams.get("galleryId");
    if (!galleryId) throw new Error("galleryId missing");

    const includeDeleted =
      req.nextUrl.searchParams.get("includeDeleted") === "1";

    const posts = await listGalleryPosts(galleryId, { includeDeleted });
    return NextResponse.json({ posts });
  } catch (err) {
    return handleError(err, 400);
  }
}

/* POST /api/gallery/posts  (multipart/form-data) */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    const form = await req.formData();
    const post = await addGalleryPostFromForm(session.userId, form);
    const res = NextResponse.json({ post }, { status: 201 });

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
