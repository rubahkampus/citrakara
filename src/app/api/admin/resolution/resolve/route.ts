// src/app/api/admin/resolution/[ticketId]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { resolveDispute } from "@/lib/services/ticket.service";
import { isUserAdminById } from "@/lib/services/user.service";
import { handleError } from "@/lib/utils/errorHandler";

// API Route for admin resolution decisions
export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    const isAdmin = await isUserAdminById((session as Session).id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can resolve disputes" },
        { status: 403 }
      );
    }

    // Get the ticket to validate status
    const ticket = await findResolutionTicketById(params.ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if ticket is in the correct state
    if (ticket.status !== "awaitingReview") {
      return NextResponse.json(
        { error: "This ticket is not ready for resolution" },
        { status: 400 }
      );
    }

    // Parse the request
    const data = await req.json();
    const { decision, resolutionNote } = data;

    // Validate inputs
    if (!decision || !["favorClient", "favorArtist"].includes(decision)) {
      return NextResponse.json(
        { error: "Valid decision (favorClient or favorArtist) is required" },
        { status: 400 }
      );
    }

    if (!resolutionNote) {
      return NextResponse.json(
        { error: "Resolution note is required" },
        { status: 400 }
      );
    }

    // Process the resolution
    const resolvedTicket = await resolveDispute(
      params.ticketId,
      (session as Session).id,
      decision,
      resolutionNote
    );

    return NextResponse.json({
      message: "Dispute resolved successfully",
      ticket: resolvedTicket,
    });
  } catch (error) {
    return handleError(error);
  }
}