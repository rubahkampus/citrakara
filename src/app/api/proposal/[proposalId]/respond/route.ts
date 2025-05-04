// src/app/api/proposals/[proposalId]/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalService } from "@/lib/services/proposal.service";

// PATCH /api/proposals/:proposalId/respond - Artist responds to proposal
export async function PATCH(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;

    return withAuth(async (session) => {
      const body = await req.json();

      const { accept, surcharge, discount, reason } = body;

      // Validate required fields
      if (typeof accept !== "boolean") {
        return NextResponse.json(
          { error: "Accept field is required and must be boolean" },
          { status: 400 }
        );
      }

      const updatedProposal = await proposalService.artistRespond(
        session.id,
        proposalId,
        { accept, surcharge, discount, reason }
      );

      const response = NextResponse.json({
        message: "Response recorded successfully",
        proposal: updatedProposal,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
