// src/app/api/proposals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalService } from "@/lib/services/proposal.service";
import { proposalRepository } from "@/lib/db/repositories/proposal.repository";

// POST /api/proposals - Submit a new proposal
export async function POST(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const body = await req.json();

      const {
        listingId,
        earliestDate,
        latestDate,
        deadline,
        generalDescription,
        referenceImages,
        generalOptions,
        subjectOptions,
      } = body;

      // Validate required fields
      if (
        !listingId ||
        !earliestDate ||
        !latestDate ||
        !deadline ||
        !generalDescription
      ) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Convert string dates to Date objects
      const proposal = await proposalService.submitProposal(
        session.id,
        listingId,
        {
          earliestDate: new Date(earliestDate),
          latestDate: new Date(latestDate),
          deadline: new Date(deadline),
          generalDescription,
          referenceImages,
          generalOptions,
          subjectOptions,
        }
      );

      const response = NextResponse.json({
        message: "Proposal submitted successfully",
        proposal,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// GET /api/proposals - Get proposals with filters
export async function GET(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const { searchParams } = new URL(req.url);
      const role = searchParams.get("role");
      const status = searchParams.get("status");
      const listingId = searchParams.get("listingId");
      const beforeExpire = searchParams.get("beforeExpire") === "true";

      let proposals;

      // Parse status filter
      const statusFilter = status?.split(",");

      if (role === "client") {
        proposals = await proposalRepository.findProposalsByClient(session.id, {
          status: statusFilter,
        });
      } else if (role === "artist") {
        proposals = await proposalRepository.findProposalsByArtist(session.id, {
          status: statusFilter,
          beforeExpire,
        });
      } else if (listingId) {
        // Validate artist owns the listing
        const listingProposals =
          await proposalRepository.findProposalsByListing(listingId);
        // Filter to only proposals for listings owned by this artist
        proposals = listingProposals.filter(
          (p) => p.artistId.toString() === session.id
        );
      } else {
        // Default: get both client and artist proposals
        const [clientProposals, artistProposals] = await Promise.all([
          proposalRepository.findProposalsByClient(session.id, {
            status: statusFilter,
          }),
          proposalRepository.findProposalsByArtist(session.id, {
            status: statusFilter,
            beforeExpire,
          }),
        ]);
        proposals = [...clientProposals, ...artistProposals];
      }

      const response = NextResponse.json({ proposals });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
