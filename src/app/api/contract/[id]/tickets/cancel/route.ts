// src/app/api/contract/[id]/ticket/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { createCancelTicket } from "@/lib/services/ticket.service";

// Create a new cancel ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const { reason } = await req.json();

    return withAuth(async (session) => {
      const ticket = await createCancelTicket(contractId, session.id, reason);

      const response = NextResponse.json({
        message: "Cancellation request submitted successfully",
        ticket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
