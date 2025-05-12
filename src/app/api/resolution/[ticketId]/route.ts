// src/app/api/resolution/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { submitCounterproof } from "@/lib/services/ticket.service";
import { handleError } from "@/lib/utils/errorHandler";
import { findContractById } from "@/lib/db/repositories/contract.repository";

// API Route to get and update a resolution ticket
export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const param = await params
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await findResolutionTicketById(param.ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user is part of this resolution
    const isSubmitter =
      ticket.submittedById.toString() === (session as Session).id;
    const isCounterparty =
      (ticket.submittedBy === "client" && ticket.counterparty === "artist") ||
      (ticket.submittedBy === "artist" && ticket.counterparty === "client");

    if (!isSubmitter && !isCounterparty) {
      return NextResponse.json(
        { error: "Not authorized to view this resolution" },
        { status: 403 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    return handleError(error);
  }
}