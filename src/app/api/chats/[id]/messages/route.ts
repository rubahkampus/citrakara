import { withAuth } from "@/lib/api/withAuth";
import { sendMessage, isUserInConversation } from "@/lib/services/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

// API endpoint to send a message in a conversation
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
          {
            error:
              "You are not authorized to send messages in this conversation",
          },
          { status: 403 }
        );
      }

      // Get message content from form data
      const formData = await req.formData();
      const content = formData.get("content") as string;

      if (!content || content.trim() === "") {
        return NextResponse.json(
          { error: "Message content cannot be empty" },
          { status: 400 }
        );
      }

      // Get uploaded images if any
      const imageFiles: File[] = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("images") && value instanceof File) {
          imageFiles.push(value);
        }
      }

      // Send the message
      const result = await sendMessage(
        userId,
        conversationId,
        content,
        imageFiles
      );

      return NextResponse.json({
        message: result.message,
        success: true,
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
