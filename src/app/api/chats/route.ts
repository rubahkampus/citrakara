import { withAuth } from "@/lib/api/withAuth";
import { getUserChatList } from "@/lib/services/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

// API endpoint to get all chat conversations for the current user
export async function GET(req: NextRequest) {
  try {
    return await withAuth(async (session) => {
      const userId = session.id;
      const conversations = await getUserChatList(userId);

      return NextResponse.json({
        conversations,
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
