// src/app/api/wallet/transactions/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { getUserTransactionHistory } from "@/lib/services/wallet.service";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get pagination params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");
    
    const transactions = await getUserTransactionHistory(session.id, limit, skip);
    
    const response = NextResponse.json({ transactions });
    
    // If token was refreshed, set the new access token
    if ("_refreshedAccessToken" in session) {
      response.cookies.set("accessToken", session._refreshedAccessToken!, {
        ...cookieOptions,
        maxAge: 60 * 15,
      });
    }
    
    return response;
  } catch (error) {
    return handleError(error);
  }
}