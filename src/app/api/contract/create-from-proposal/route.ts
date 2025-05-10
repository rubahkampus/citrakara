// src/app/api/contract/create-from-proposal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { createContractFromProposal } from "@/lib/services/contract.service";

// Create a contract from an accepted proposal
export async function POST(req: NextRequest) {
  try {
    const { proposalId, paymentAmount } = await req.json();

    return withAuth(async (session) => {
      const contract = await createContractFromProposal(
        proposalId,
        paymentAmount
      );

      const response = NextResponse.json({
        message: "Contract created successfully",
        contract,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
