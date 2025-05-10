// src/app/api/resolution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  createResolutionTicket,
  getAllResolutionTickets,
} from "@/lib/services/ticket.service";
import { isUserAdminByUsername } from "@/lib/services/user.service";

// Get all resolution tickets (admin only)
export async function GET(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      // Check if user is admin (to be implemented)
      const isAdmin = await isUserAdminByUsername(session.username)
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }

      // Extract query parameters for filtering
      const url = new URL(req.url);
      const status = url.searchParams.get("status")?.split(",");
      const targetType = url.searchParams.get("targetType")?.split(",");

      const tickets = await getAllResolutionTickets({
        status,
        targetType,
      });

      const response = NextResponse.json(tickets);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// Create a new resolution ticket
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extract contractId from form data as it's required for the service function
    const contractId = formData.get("contractId") as string;
    if (!contractId) {
      return NextResponse.json(
        { error: "Contract ID is required" },
        { status: 400 }
      );
    }

    return withAuth(async (session) => {
      // Pass the entire FormData object to the service
      const ticket = await createResolutionTicket(
        contractId,
        session.id,
        formData
      );

      const response = NextResponse.json({
        message: "Resolution ticket created successfully",
        ticket,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
