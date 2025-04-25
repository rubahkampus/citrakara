// src/app/api/listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession }            from "@/lib/utils/session";
import { cookieOptions }             from "@/lib/utils/cookies";
import { handleError }               from "@/lib/utils/errorHandler";

import {
  browseListings,
  createListing,
  createListingFromForm,
} from "@/lib/services/commissionListing.service";

/* ───────────────────────────── GET – public search ──────────────────────────
   /api/listings?text=portrait&tags=furry,anime&artistId=<id>&skip=0&limit=20
---------------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const text      = searchParams.get("text") ?? undefined;
    const tags      = searchParams.get("tags")?.split(",").filter(Boolean);
    const artistId  = searchParams.get("artistId") ?? undefined;
    const skip      = Number(searchParams.get("skip") ?? 0);
    const limit     = Number(searchParams.get("limit") ?? 20);

    const listings = await browseListings({ text, tags, artistId, skip, limit });
    return NextResponse.json({ listings });
  } catch (err) {
    return handleError(err);
  }
}

/* ───────────────────────────── POST – create listing ────────────────────────
   Accepts either:
   1. multipart/form-data  → images uploaded by BE
   2. application/json     → FE already uploaded images, passes URLs
---------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    let listing;
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      listing = await createListingFromForm(session.userId, form);
    } else {
      const payload = await req.json();
      listing = await createListing(session.userId, payload);
    }

    const res = NextResponse.json({ listing }, { status: 201 });
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
