// src/app/api/commission/listing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  setListingActiveState,
  deleteListing,
  updateListing,
  getListingPublic,
} from "@/lib/services/commissionListing.service";

// Get a specific commission listing
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    const listing = await getListingPublic(listingId);

    return NextResponse.json({ listing });
  } catch (error) {
    return handleError(error);
  }
}

// Update commission listing
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Grab the raw content-type to decide how to parse
    const contentType = req.headers.get("content-type") || "";

    let received: any;
    if (contentType.includes("application/json")) {
      received = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      // Turn FormData into a plain object
      received = Object.fromEntries(formData.entries());
    } else {
      // Fallback to raw text
      received = await req.text();
    }

    // Echo back what we got, plus the listing ID and content-type
    return NextResponse.json(
      {
        listingId: params.id,
        contentType,
        received,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleError(error);
  }
}

// Delete commission listing
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

    return withAuth(async (session) => {
      await deleteListing(session.id, listingId);

      const response = NextResponse.json({
        message: "Listing deleted successfully",
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
