// src/lib/services/chat.service.ts
import { Types } from "mongoose";
import { v4 as uuid } from "uuid";
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
import { HttpError } from "@/lib/services/commissionListing.service";
import { IMessage } from "../db/models/chat.model";

/**
 * Create or retrieve a conversation between two users
 * @param userId1 ID of the first user in the conversation
 * @param userId2 ID of the second user in the conversation
 * @returns The conversation object
 * @throws HttpError if conversation creation fails
 */
export async function getOrStartConversation(userId1: string, userId2: string) {
  try {
    return await findOrCreateConversation(userId1, userId2);
  } catch (error) {
    throw new HttpError("Failed to create conversation", 500);
  }
}

/**
 * Get a conversation by ID with participant details
 * @param conversationId ID of the conversation to retrieve
 * @returns The conversation with its messages and participants
 * @throws HttpError if conversation not found or retrieval fails
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
 * Get all conversations for a user with additional metadata
 * @param userId User ID to get conversations for
 * @returns Array of conversations with other participant info and unread counts
 * @throws HttpError if retrieval fails
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
 * Send a message in a conversation with optional image attachments
 * @param senderId ID of the user sending the message
 * @param conversationId ID of the conversation
 * @param content Text content of the message
 * @param imageFiles Optional array of image files to attach
 * @returns Object containing updated conversation and the new message
 * @throws HttpError if message sending fails
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
 * Mark all messages in a conversation as read for a specific user
 * @param userId User ID marking messages as read
 * @param conversationId ID of the conversation
 * @returns The updated conversation
 * @throws HttpError if operation fails
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
 * Get total unread message count across all conversations for a user
 * @param userId User ID to check unread messages for
 * @returns Total count of unread messages
 * @throws HttpError if count operation fails
 */
export async function getUnreadMessageCount(userId: string) {
  try {
    return await countUnreadMessages(userId);
  } catch (error) {
    throw new HttpError("Failed to count unread messages", 500);
  }
}

/**
 * Start a conversation with a user by their username
 * @param currentUserId ID of the current user
 * @param targetUsername Username of the user to start conversation with
 * @returns Object with conversation ID and target user details
 * @throws HttpError if target user not found or conversation creation fails
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
 * Get participants in a conversation
 * @param conversationId ID of the conversation
 * @returns Array of participant user objects
 * @throws HttpError if conversation not found or retrieval fails
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
 * Check if a user is part of a conversation
 * @param userId User ID to check
 * @param conversationId Conversation ID to check
 * @returns Boolean indicating if user is a participant in the conversation
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
