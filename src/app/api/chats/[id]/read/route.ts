import { withAuth } from "@/lib/api/withAuth";
import {
  markMessagesAsRead,
  isUserInConversation,
} from "@/lib/services/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

// API endpoint to mark all messages in a conversation as read
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withAuth(async (session) => {
      const userId = session.id;
      const conversationId = params.id;

      // Check if user is part of this conversation
      const isParticipant = await isUserInConversation(userId, conversationId);
      if (!isParticipant) {
        return NextResponse.json(
          { error: "You are not authorized to access this conversation" },
          { status: 403 }
        );
      }

      // Mark messages as read
      await markMessagesAsRead(userId, conversationId);

      return NextResponse.json({
        success: true,
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
