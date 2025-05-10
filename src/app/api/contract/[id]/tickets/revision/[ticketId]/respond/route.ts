// src/app/api/contract/[id]/tickets/revision/[ticketId]/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { respondToRevisionTicket } from "@/lib/services/ticket.service";

// Respond to a revision ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    const contractId = params.id;
    const ticketId = params.ticketId;
    const { response, rejectionReason } = await req.json();

    return withAuth(async (session) => {
      const result = await respondToRevisionTicket(
        contractId,
        ticketId,
        session.id,
        response,
        rejectionReason
      );

      const responseObj = NextResponse.json({
        message: "Response submitted successfully",
        result,
      });

      rotateToken(responseObj, session);
      return responseObj;
    });
  } catch (error) {
    return handleError(error);
  }
}
