import { withAuth } from "@/lib/api/withAuth";
import { getUnreadMessageCount } from "@/lib/services/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

// API endpoint to get the count of unread messages for the current user
export async function GET(req: NextRequest) {
  try {
    return await withAuth(async (session) => {
      const userId = session.id;
      const count = await getUnreadMessageCount(userId);

      return NextResponse.json({
        count,
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
