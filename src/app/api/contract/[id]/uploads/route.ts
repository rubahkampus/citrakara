// src/app/api/contract/[id]/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getContractUploads } from "@/lib/services/upload.service";

// Get all uploads for a contract
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    return withAuth(async (session) => {
      // First verify user is part of the contract (implementation needed)

      const uploads = await getContractUploads(contractId);

      const response = NextResponse.json(uploads);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
