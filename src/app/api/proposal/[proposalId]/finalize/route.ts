// src/app/api/proposals/[proposalId]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalService } from "@/lib/services/proposal.service";

// POST /api/proposals/:proposalId/finalize - Finalize proposal and create contract
export async function POST(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;

    return withAuth(async (session) => {
      // Check if user is admin (implement admin check when admin system is ready)
      // For now, allow authenticated users to finalize their own accepted proposals

      const result = await proposalService.finalizeProposal(proposalId);

      const response = NextResponse.json({
        message: "Proposal finalized successfully",
        ...result,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
