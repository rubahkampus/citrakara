// src/app/api/contract/[id]/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getContractById } from "@/lib/services/contract.service";

// Get all tickets for a contract
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    return withAuth(async (session) => {
      // Get contract with tickets populated
      const contract = await getContractById(contractId, session.id);

      // Extract tickets
      const tickets = {
        cancelTickets: contract.cancelTickets || [],
        revisionTickets: contract.revisionTickets || [],
        changeTickets: contract.changeTickets || [],
        resolutionTickets: contract.resolutionTickets || [],
      };

      const response = NextResponse.json(tickets);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
