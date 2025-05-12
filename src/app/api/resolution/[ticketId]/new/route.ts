// src/app/api/resolution/[ticketId]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { cancelResolutionTicket } from "@/lib/services/ticket.service";
import { handleError } from "@/lib/utils/errorHandler";

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const param = await params
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the cancellation
    const cancelledTicket = await cancelResolutionTicket(
      param.ticketId,
      (session as Session).id
    );

    return NextResponse.json({
      message: "Resolution ticket cancelled successfully",
      ticket: cancelledTicket,
    });
  } catch (error) {
    return handleError(error);
  }
}
