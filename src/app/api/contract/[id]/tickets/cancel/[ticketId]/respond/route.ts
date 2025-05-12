// src/app/api/contract/[id]/tickets/cancel/[ticketId]/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { respondToCancelTicket } from "@/lib/services/ticket.service";

// Respond to a cancel ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const ticketId = param.ticketId;
    const { response: userResponse } = await req.json();

    return withAuth(async (session) => {
      const result = await respondToCancelTicket(
        contractId,
        ticketId,
        session.id,
        userResponse
      );

      const jsonResponse = NextResponse.json({
        message: "Response submitted successfully",
        result,
      });

      rotateToken(jsonResponse, session);
      return jsonResponse;
    });
  } catch (error) {
    return handleError(error);
  }
}
