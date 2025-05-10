// src/app/api/contract/[id]/tickets/revision/[ticketId]/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getRevisionUploads } from "@/lib/services/upload.service";

// Get uploads for a specific revision ticket
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    const ticketId = params.ticketId;

    return withAuth(async (session) => {
      // First verify user is part of the contract (implementation needed)

      const uploads = await getRevisionUploads(ticketId);

      const response = NextResponse.json(uploads);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
