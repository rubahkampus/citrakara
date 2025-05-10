// src/app/api/resolution/[id]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { resolveDispute } from "@/lib/services/ticket.service";
import { isUserAdminByUsername } from "@/lib/services/user.service";

// Resolve a dispute (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    const { decision, resolutionNote } = await req.json();

    return withAuth(async (session) => {
      // Check if user is admin (to be implemented)
      const isAdmin = await isUserAdminByUsername(session.username)
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }

      const resolvedTicket = await resolveDispute(
        ticketId,
        session.id,
        decision,
        resolutionNote
      );

      const response = NextResponse.json({
        message: "Dispute resolved successfully",
        ticket: resolvedTicket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
