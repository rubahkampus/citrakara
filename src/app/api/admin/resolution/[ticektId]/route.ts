// src/app/api/admin/resolution/[ticketId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { submitCounterproof } from "@/lib/services/ticket.service";
import { handleError } from "@/lib/utils/errorHandler";
import { findContractById } from "@/lib/db/repositories/contract.repository";
import { isUserAdminById } from "@/lib/services/user.service";

// API Route to get and update a resolution ticket
export async function GET(
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
        { error: "Only administrators can access this resource" },
        { status: 403 }
      );
    }

    const ticket = await findResolutionTicketById(params.ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    return handleError(error);
  }
}
