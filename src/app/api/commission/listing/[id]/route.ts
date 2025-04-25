// src/app/api/commission/listing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { setListingActiveState, deleteListing } from "@/lib/services/commissionListing.service";

// Update commission listing status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    const { active } = await req.json();
    
    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: "Active status must be a boolean value" },
        { status: 400 }
      );
    }
    
    return withAuth(async (session) => {
      const updatedListing = await setListingActiveState(session.id, listingId, active);
      
      const response = NextResponse.json({
        message: `Listing ${active ? 'activated' : 'deactivated'} successfully`,
        listing: updatedListing
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
        message: "Listing deleted successfully"
      });
      
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}