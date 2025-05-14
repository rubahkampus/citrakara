import { withAuth } from "@/lib/api/withAuth";
import {
  getChatConversation,
  markMessagesAsRead,
  isUserInConversation,
} from "@/lib/services/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

// API endpoint to get a specific conversation
export async function GET(
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
          { error: "You are not authorized to view this conversation" },
          { status: 403 }
        );
      }

      // Get the conversation
      const conversation = await getChatConversation(conversationId);

      // Mark messages as read
      await markMessagesAsRead(userId, conversationId);

      return NextResponse.json({
        conversation,
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
