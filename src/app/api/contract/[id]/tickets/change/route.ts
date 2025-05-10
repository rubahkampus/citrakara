// src/app/api/contract/[id]/tickets/change/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { createChangeTicket } from "@/lib/services/ticket.service";

// Create a new change ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    // Parse the form data from the request
    const formData = await req.formData();

    return withAuth(async (session) => {
      // Pass the entire FormData object to the service
      const ticket = await createChangeTicket(contractId, session.id, formData);

      const response = NextResponse.json({
        message: "Change request submitted successfully",
        ticket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
