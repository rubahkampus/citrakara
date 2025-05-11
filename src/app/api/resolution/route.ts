// src/app/api/resolution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { getResolutionTicketsByUser } from "@/lib/services/ticket.service";
import { handleError } from "@/lib/utils/errorHandler";

// API Route to get all resolution tickets for a user
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role filter from query params
    const role = req.nextUrl.searchParams.get("role") || "both";
    if (!["submitter", "counterparty", "both"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role parameter" },
        { status: 400 }
      );
    }

    // Get tickets for the user
    const tickets = await getResolutionTicketsByUser(
      (session as Session).id,
      role as "submitter" | "counterparty" | "both"
    );

    return NextResponse.json(tickets);
  } catch (error) {
    return handleError(error);
  }
}