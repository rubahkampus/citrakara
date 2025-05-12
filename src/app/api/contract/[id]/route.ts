// src/app/api/contract/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getContractById,
  extendContractDeadline,
} from "@/lib/services/contract.service";

// Get a specific contract
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const param = await params
    const contractId = param.id;

    return withAuth(async (session) => {
      const contract = await getContractById(contractId, session.id);

      const response = NextResponse.json(contract);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// Update contract deadline (client only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const body = await req.json();

    return withAuth(async (session) => {
      // Only handling deadline extension for now
      if (body.deadlineAt) {
        const updatedContract = await extendContractDeadline(
          contractId,
          session.id,
          new Date(body.deadlineAt)
        );

        const response = NextResponse.json({
          message: "Contract deadline extended successfully",
          contract: updatedContract,
        });

        rotateToken(response, session);
        return response;
      }

      return NextResponse.json(
        { error: "No valid update parameters provided" },
        { status: 400 }
      );
    });
  } catch (error) {
    return handleError(error);
  }
}
