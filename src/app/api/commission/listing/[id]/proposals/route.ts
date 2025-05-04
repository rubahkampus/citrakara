// src/app/api/listings/[listingId]/proposals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalRepository } from "@/lib/db/repositories/proposal.repository";
import { findCommissionListingById } from "@/lib/db/repositories/commissionListing.repository";

// GET /api/listings/:listingId/proposals - Get proposals for a specific listing
export async function GET(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const { listingId } = params;

    return withAuth(async (session) => {
      // First, verify the user owns this listing
      const listing = await findCommissionListingById(listingId);

      if (!listing) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }

      if (listing.artistId.toString() !== session.id) {
        return NextResponse.json(
          { error: "Not authorized to view proposals for this listing" },
          { status: 403 }
        );
      }

      // Get proposals for this listing
      const proposals = await proposalRepository.findProposalsByListing(
        listingId
      );

      const response = NextResponse.json({ proposals });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
