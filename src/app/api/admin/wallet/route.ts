// src/app/api/admin/wallet/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { transferBetweenUsers } from "@/lib/services/wallet.service";
import { isUserAdminByUsername } from "@/lib/services/user.service";

// Transfer funds between users (admin only)
export async function POST(req: NextRequest) {
  try {
    const { fromUserId, toUserId, amount, reason } = await req.json();

    return withAuth(async (session) => {
      // Check if user is admin (to be implemented)
      const isAdmin = await isUserAdminByUsername(session.username)
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }

      await transferBetweenUsers(
        fromUserId,
        toUserId,
        amount,
        session.id,
        reason
      );

      const response = NextResponse.json({
        message: "Funds transferred successfully",
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
