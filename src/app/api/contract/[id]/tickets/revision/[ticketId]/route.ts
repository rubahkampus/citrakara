// src/app/api/contract/[id]/tickets/revision/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getRevisionTicketById } from "@/lib/services/ticket.service";

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
      const ticket = await getRevisionTicketById(ticketId);
      
      if (!ticket) {
        return NextResponse.json(
          { message: "Revision ticket not found" },
          { status: 404 }
        );
      }

      const response = NextResponse.json({
        message: "Revision ticket retrieved successfully",
        ticket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
