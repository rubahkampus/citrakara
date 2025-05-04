// src/app/api/proposals/[proposalId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalRepository } from "@/lib/db/repositories/proposal.repository";

// GET /api/proposals/:proposalId - Get a specific proposal
export async function GET(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;

    return withAuth(async (session) => {
      const proposal = await proposalRepository.getProposalById(proposalId);

      if (!proposal) {
        return NextResponse.json(
          { error: "Proposal not found" },
          { status: 404 }
        );
      }

      // Check ownership
      const isClient = proposal.clientId.toString() === session.id;
      const isArtist = proposal.artistId.toString() === session.id;

      if (!isClient && !isArtist) {
        return NextResponse.json(
          { error: "Not authorized to view this proposal" },
          { status: 403 }
        );
      }

      const response = NextResponse.json({ proposal });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
