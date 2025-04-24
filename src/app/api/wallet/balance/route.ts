// src/app/api/wallet/balance/route.ts
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { getUserWalletBalance } from "@/lib/services/wallet.service";
import { handleError } from "@/lib/utils/errorHandler";
import { cookieOptions } from "@/lib/utils/cookies";

export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session || typeof session === "string" || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const wallet = await getUserWalletBalance(session.id);
    
    const response = NextResponse.json({ wallet });
    
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