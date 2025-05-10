// src/app/api/wallet/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getTransactions } from "@/lib/services/wallet.service";

// Get transaction history
export async function GET(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const transactions = await getTransactions(session.id);

      const response = NextResponse.json(transactions);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
