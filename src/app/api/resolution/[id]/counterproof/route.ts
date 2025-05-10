// src/app/api/resolution/[id]/counterproof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { submitCounterproof } from "@/lib/services/ticket.service";

// Submit counterproof for a resolution ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;

    // Parse the form data from the request
    const formData = await req.formData();

    return withAuth(async (session) => {
      // Pass the entire FormData object to the service
      const updatedTicket = await submitCounterproof(
        ticketId,
        session.id,
        formData
      );

      const response = NextResponse.json({
        message: "Counterproof submitted successfully",
        ticket: updatedTicket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
