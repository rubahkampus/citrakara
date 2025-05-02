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
    const listingId = params.id;
    const body = await req.json();

    // If 'active' is present, it's an active status update
    if ("active" in body && typeof body.active === "boolean") {
      return withAuth(async (session) => {
        const updatedListing = await setListingActiveState(
          session.id,
          listingId,
          body.active
        );

        const response = NextResponse.json({
          message: `Listing ${
            body.active ? "activated" : "deactivated"
          } successfully`,
          listing: updatedListing,
        });

        rotateToken(response, session);
        return response;
      });
    }

    // Otherwise, it's a content update
    return withAuth(async (session) => {
      const updatedListing = await updateListing(session.id, listingId, body);

      const response = NextResponse.json({
        message: "Listing updated successfully",
        listing: updatedListing,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
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
