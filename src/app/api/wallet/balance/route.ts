// src/app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getWalletSummary,
  addFundsToWallet,
} from "@/lib/services/wallet.service";

// Get wallet balance
export async function GET(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const summary = await getWalletSummary(session.id);

      const response = NextResponse.json(summary);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// Add funds to wallet
export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    return withAuth(async (session) => {
      const wallet = await addFundsToWallet(session.id, amount);

      const response = NextResponse.json({
        message: "Funds added successfully",
        wallet,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
