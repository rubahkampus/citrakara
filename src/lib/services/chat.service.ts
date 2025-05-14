import {
  findOrCreateConversation,
  addMessage,
  getUserConversations,
  getConversationById,
  markConversationAsRead,
  countUnreadMessages,
  findConversationByUsernames,
} from "@/lib/db/repositories/chat.repository";
import {
  findUserByUsername,
  findUserById,
} from "@/lib/db/repositories/user.repository";
import { uploadFileToR2 } from "@/lib/utils/cloudflare";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";
import { HttpError } from "@/lib/services/commissionListing.service";
import { IMessage } from "../db/models/chat.model";

/**
 * Service function to create or retrieve a conversation between two users
 */
export async function getOrStartConversation(userId1: string, userId2: string) {
  try {
    return await findOrCreateConversation(userId1, userId2);
  } catch (error) {
    throw new HttpError("Failed to create conversation", 500);
  }
}

/**
 * Service function to get a conversation by ID with participant details
 */
export async function getChatConversation(conversationId: string) {
  try {
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }
    return conversation;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Failed to retrieve conversation", 500);
  }
}

/**
 * Service function to get all conversations for a user
 */
export async function getUserChatList(userId: string) {
  try {
    const conversations = await getUserConversations(userId);

    // Process conversations to get latest message and other participant info
    return conversations.map((conv) => {
      const otherParticipants = conv.participants.filter(
        (p: Types.ObjectId) => p._id.toString() !== userId
      );

      const latestMessage =
        conv.messages.length > 0
          ? conv.messages[conv.messages.length - 1]
          : null;

      // Count unread messages where sender is not the current user
      const unreadCount = conv.messages.filter(
        (msg: IMessage) => !msg.read && msg.sender.toString() !== userId
      ).length;

      return {
        _id: conv._id,
        otherUser: otherParticipants[0],
        latestMessage,
        unreadCount,
        lastActivity: conv.lastActivity,
      };
    });
  } catch (error) {
    throw new HttpError("Failed to retrieve chat list", 500);
  }
}

/**
 * Service function to send a message
 */
export async function sendMessage(
  senderId: string,
  conversationId: string,
  content: string,
  imageFiles?: File[]
) {
  try {
    // Handle image uploads if present
    let imageUrls: string[] = [];

    if (imageFiles && imageFiles.length > 0) {
      // Upload images to Cloudflare R2
      imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const path = `chats/${conversationId}/${uuid()}-${file.name}`;
          return uploadFileToR2(file, path);
        })
      );
    }

    // Add message to the conversation
    const updatedConversation = await addMessage(
      conversationId,
      senderId,
      content,
      imageUrls
    );

    return {
      conversation: updatedConversation,
      message:
        updatedConversation.messages[updatedConversation.messages.length - 1],
    };
  } catch (error) {
    throw new HttpError("Failed to send message", 500);
  }
}

/**
 * Service function to mark messages as read
 */
export async function markMessagesAsRead(
  userId: string,
  conversationId: string
) {
  try {
    return await markConversationAsRead(conversationId, userId);
  } catch (error) {
    throw new HttpError("Failed to mark messages as read", 500);
  }
}

/**
 * Service function to get total unread message count for a user
 */
export async function getUnreadMessageCount(userId: string) {
  try {
    return await countUnreadMessages(userId);
  } catch (error) {
    throw new HttpError("Failed to count unread messages", 500);
  }
}

/**
 * Service function to start a conversation by username
 */
export async function startConversationByUsername(
  currentUserId: string,
  targetUsername: string
) {
  try {
    // Validate that target user exists
    const targetUser = await findUserByUsername(targetUsername);
    if (!targetUser) {
      throw new HttpError("User not found", 404);
    }

    // Don't allow starting conversation with self
    if (targetUser._id.toString() === currentUserId) {
      throw new HttpError("Cannot start conversation with yourself", 400);
    }

    // Create or find the conversation
    const conversation = await findOrCreateConversation(
      currentUserId,
      targetUser._id
    );

    return {
      conversationId: conversation._id,
      targetUser: {
        _id: targetUser._id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        profilePicture: targetUser.profilePicture,
      },
    };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Failed to start conversation", 500);
  }
}

/**
 * Find chat participants by conversation ID
 */
export async function getChatParticipants(conversationId: string) {
  try {
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      throw new HttpError("Conversation not found", 404);
    }

    return conversation.participants;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Failed to get chat participants", 500);
  }
}

/**
 * Check if user is part of conversation
 */
export async function isUserInConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const conversation = await getConversationById(conversationId);
    if (!conversation) return false;

    return conversation.participants.some(
      (p: Types.ObjectId) => p._id.toString() === userId
    );
  } catch (error) {
    return false;
  }
}
