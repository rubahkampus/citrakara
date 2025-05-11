// src/app/api/admin/resolution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { getAllResolutionTickets } from "@/lib/services/ticket.service";
import { isUserAdminById } from "@/lib/services/user.service";
import { handleError } from "@/lib/utils/errorHandler";

// API Route for admin to get all resolution tickets
export async function GET(req: NextRequest) {
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

    // Get filter params
    const status = req.nextUrl.searchParams.getAll("status");
    const targetType = req.nextUrl.searchParams.getAll("targetType");

    // Build filters
    const filters: { status?: string[]; targetType?: string[] } = {};
    if (status.length > 0) filters.status = status;
    if (targetType.length > 0) filters.targetType = targetType;

    // Get the tickets
    const tickets = await getAllResolutionTickets(filters);

    return NextResponse.json(tickets);
  } catch (error) {
    return handleError(error);
  }
}
