// src/app/api/contract/[id]/tickets/change/[ticketId]/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { respondToChangeTicket } from "@/lib/services/ticket.service";

// Respond to a change ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const ticketId = param.ticketId;
    const { response, paidFee } = await req.json();

    return withAuth(async (session) => {
      const result = await respondToChangeTicket(
        contractId,
        ticketId,
        session.id,
        response,
        paidFee
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
