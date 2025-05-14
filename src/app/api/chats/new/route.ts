import { withAuth } from "@/lib/api/withAuth";
import { startConversationByUsername } from "@/lib/services/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

// API endpoint to start a new conversation with a user by username
export async function POST(req: NextRequest) {
  try {
    return await withAuth(async (session) => {
      const userId = session.id;
      const data = await req.json();
      const { username } = data;

      if (!username) {
        return NextResponse.json(
          { error: "Username is required" },
          { status: 400 }
        );
      }

      // Start the conversation
      const result = await startConversationByUsername(userId, username);

      return NextResponse.json({
        conversation: result,
        success: true,
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
