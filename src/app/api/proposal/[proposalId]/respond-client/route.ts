// src/app/api/proposals/[proposalId]/respond-client/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalService } from "@/lib/services/proposal.service";

// PATCH /api/proposals/:proposalId/respond-client - Client responds to adjustment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const { proposalId } = params;

    return withAuth(async (session) => {
      const body = await req.json();

      const { accept, rejectionReason } = body;

      // Validate required fields
      if (typeof accept !== "boolean") {
        return NextResponse.json(
          { error: "Accept field is required and must be boolean" },
          { status: 400 }
        );
      }

      const updatedProposal = await proposalService.clientRespondToAdjustment(
        session.id,
        proposalId,
        accept,
        rejectionReason
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
