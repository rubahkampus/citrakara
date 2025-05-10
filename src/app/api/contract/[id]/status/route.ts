// src/app/api/contract/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { updateContractStatus } from "@/lib/services/contract.service";
import { isUserAdminByUsername } from "@/lib/services/user.service";

// Update contract status (mainly for admin use)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const { status, workPercentage } = await req.json();

    return withAuth(async (session) => {
      // Check if user is admin (to be implemented)
      const isAdmin = await isUserAdminByUsername(session.username)
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }

      const updatedContract = await updateContractStatus(
        contractId,
        status,
        workPercentage
      );

      const response = NextResponse.json({
        message: "Contract status updated successfully",
        contract: updatedContract,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
