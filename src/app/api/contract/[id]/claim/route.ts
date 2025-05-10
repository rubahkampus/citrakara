// src/app/api/contract/[id]/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { claimFunds } from "@/lib/services/contract.service";

// Claim payment or refund
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    return withAuth(async (session) => {
      const result = await claimFunds(contractId, session.id);

      const response = NextResponse.json({
        message: "Funds claimed successfully",
        result,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
