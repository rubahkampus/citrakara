// src/app/api/resolution/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { isUserAdminByUsername } from "@/lib/services/user.service";

// Get a specific resolution ticket
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;

    return withAuth(async (session) => {
      const ticket = await findResolutionTicketById(ticketId);

      if (!ticket) {
        return NextResponse.json(
          { error: "Resolution ticket not found" },
          { status: 404 }
        );
      }

      // Check if user is involved or admin
      const isSubmitter = ticket.submittedById.toString() === session.id;
      const isAdmin = await isUserAdminByUsername(session.username)

      if (!isSubmitter && !isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const response = NextResponse.json(ticket);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
