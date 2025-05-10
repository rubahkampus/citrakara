// src/app/api/contract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getUserContracts } from "@/lib/services/contract.service";

// Get all contracts for the logged-in user
export async function GET(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const contracts = await getUserContracts(session.id);

      const response = NextResponse.json(contracts);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
