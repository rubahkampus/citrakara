// src/app/api/contract/[id]/tickets/change/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getChangeTicketById } from "@/lib/services/ticket.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, ticketId: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const ticketId = param.ticketId
    
    if (!ticketId) {
      return NextResponse.json(
        { message: "Ticket ID is required" },
        { status: 400 }
      );
    }

    return withAuth(async (session) => {
      // Get the ticket using the service function
      const ticket = await getChangeTicketById(ticketId);
      
      if (!ticket) {
        return NextResponse.json(
          { message: "Change ticket not found" },
          { status: 404 }
        );
      }

      const response = NextResponse.json({
        message: "Change ticket retrieved successfully",
        ticket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
