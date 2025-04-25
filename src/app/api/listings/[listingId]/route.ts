// src/appapi/listings/[listingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession }            from "@/lib/utils/session";
import { cookieOptions }             from "@/lib/utils/cookies";
import { handleError }               from "@/lib/utils/errorHandler";

import {
  getListingPublic,
  setListingActiveState,
  deleteListing,
} from "@/lib/services/commissionListing.service";

/* ───────────────────────────── GET – public read ─────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listing = await getListingPublic(params.listingId);
    if (!listing) return handleError(new Error("Listing not found"), 404);
    return NextResponse.json({ listing });
  } catch (err) {
    return handleError(err);
  }
}

/* ───────────────────────────── PATCH – update state ─────────────────────────
   Body (JSON): { isActive: boolean }
   Only the owner (artist) can hit this.
---------------------------------------------------------------------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    const { isActive } = await req.json();
    if (typeof isActive !== "boolean")
      throw new Error("isActive boolean required");

    const listing = await setListingActiveState(
      session.userId,
      params.listingId,
      isActive
    );

    const res = NextResponse.json({ listing });
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

/* ───────────────────────────── DELETE – soft delete ──────────────────────── */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session === "string")
      return handleError(new Error("Unauthorized"), 401);

    await deleteListing(session.userId, params.listingId);
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
