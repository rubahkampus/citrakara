// src/app/api/gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession }            from "@/lib/utils/session";
import { cookieOptions }             from "@/lib/utils/cookies";
import { handleError }               from "@/lib/utils/errorHandler";

import {
  getUserGalleries,
  createUserGallery,
} from "@/lib/services/gallery.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    const galleries = await getUserGalleries(session.userId);
    const res = NextResponse.json({ galleries });

    /* access-token rotation */
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

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    const { name } = await req.json();
    if (!name || typeof name !== "string")
      throw new Error("Missing gallery name");

    const gallery = await createUserGallery(session.userId, name);
    const res = NextResponse.json({ gallery }, { status: 201 });

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
