// src/app/api/contract/[id]/tickets/cancel/active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { findActiveCancelTickets } from "@/lib/services/ticket.service";

// Get active cancellation tickets for a contract
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const param = await params
    const contractId = param.id;

    return withAuth(async (session) => {
      const tickets = await findActiveCancelTickets(contractId, session.id);

      const response = NextResponse.json(tickets);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
