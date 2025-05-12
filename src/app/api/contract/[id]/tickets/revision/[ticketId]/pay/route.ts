// src/app/api/contract/[id]/tickets/revision/[ticketId]/pay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { payRevisionFee } from "@/lib/services/ticket.service";

// Pay for a revision ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; ticketId: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const ticketId = param.ticketId;

    // Parse request body
    const {
      paymentMethod,
      secondaryMethod,
      walletAmount,
      remainingAmount,
      paymentAmount,
    } = await req.json();

    return withAuth(async (session) => {
      const result = await payRevisionFee(contractId, ticketId, session.id, paymentMethod, secondaryMethod, walletAmount, remainingAmount, paymentAmount);

      const response = NextResponse.json({
        message: "Revision fee paid successfully",
        result,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
