// src/app/api/gallery/[galleryId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession }            from "@/lib/utils/session";
import { cookieOptions }             from "@/lib/utils/cookies";
import { handleError }               from "@/lib/utils/errorHandler";

import {
  renameGallery,
  deleteGallery,
} from "@/lib/services/gallery.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    const { name } = await req.json();
    if (!name) throw new Error("Missing name");

    const gallery = await renameGallery(session.userId, params.galleryId, name);
    const res = NextResponse.json({ gallery });

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
  { params }: { params: { galleryId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    await deleteGallery(session.userId, params.galleryId);
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
