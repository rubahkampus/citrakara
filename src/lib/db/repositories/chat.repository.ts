import { connectDB } from "@/lib/db/connection";
import { Conversation, IConversation } from "@/lib/db/models/chat.model";
import { Types } from "mongoose";
import User from "@/lib/db/models/user.model";

/**
 * Find a conversation between two users or create one if it doesn't exist
 * @param userId1 ID of the first user in the conversation
 * @param userId2 ID of the second user in the conversation
 * @returns The existing or newly created conversation
 */
export async function findOrCreateConversation(
  userId1: string | Types.ObjectId,
  userId2: string | Types.ObjectId
): Promise<IConversation> {
  await connectDB();

  // Convert string IDs to ObjectIds if needed
  const user1 =
    typeof userId1 === "string" ? new Types.ObjectId(userId1) : userId1;
  const user2 =
    typeof userId2 === "string" ? new Types.ObjectId(userId2) : userId2;

  // Look for an existing conversation between these users
  const existingConversation = await Conversation.findOne({
    participants: { $all: [user1, user2] },
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create a new conversation if none exists
  const newConversation = new Conversation({
    participants: [user1, user2],
    messages: [],
    lastActivity: new Date(),
  });

  return newConversation.save();
}

/**
 * Add a message to an existing conversation
 * @param conversationId ID of the conversation to add the message to
 * @param senderId ID of the user sending the message
 * @param content Text content of the message
 * @param images Optional array of image URLs included in the message
 * @returns The updated conversation with the new message
 */
export async function addMessage(
  conversationId: string | Types.ObjectId,
  senderId: string | Types.ObjectId,
  content: string,
  images: string[] = []
): Promise<IConversation> {
  await connectDB();

  const convId =
    typeof conversationId === "string"
      ? new Types.ObjectId(conversationId)
      : conversationId;

  const sender =
    typeof senderId === "string" ? new Types.ObjectId(senderId) : senderId;

  const conversation = await Conversation.findByIdAndUpdate(
    convId,
    {
      $push: {
        messages: {
          sender,
          content,
          images,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      lastActivity: new Date(),
    },
    { new: true }
  );

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

/**
 * Get all conversations for a user, sorted by most recent activity
 * @param userId ID of the user to get conversations for
 * @returns Array of conversations with populated participant details
 */
export async function getUserConversations(userId: string | Types.ObjectId) {
  await connectDB();

  const user = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  return Conversation.find({ participants: user })
    .sort({ lastActivity: -1 })
    .populate({
      path: "participants",
      model: User,
      select: "username displayName profilePicture",
    });
}

/**
 * Get a single conversation by ID with populated user details
 * @param conversationId ID of the conversation to retrieve
 * @returns The conversation with populated participant details
 */
export async function getConversationById(
  conversationId: string | Types.ObjectId
) {
  await connectDB();

  const convId =
    typeof conversationId === "string"
      ? new Types.ObjectId(conversationId)
      : conversationId;

  return Conversation.findById(convId).populate({
    path: "participants",
    model: User,
    select: "username displayName profilePicture roles",
  });
}

/**
 * Mark all messages in a conversation as read for a specific user
 * @param conversationId ID of the conversation to mark as read
 * @param userId ID of the user marking messages as read
 * @returns The updated conversation
 */
export async function markConversationAsRead(
  conversationId: string | Types.ObjectId,
  userId: string | Types.ObjectId
) {
  await connectDB();

  const convId =
    typeof conversationId === "string"
      ? new Types.ObjectId(conversationId)
      : conversationId;

  const user = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  return Conversation.findOneAndUpdate(
    {
      _id: convId,
      "messages.sender": { $ne: user },
      "messages.read": false,
    },
    {
      $set: {
        "messages.$[elem].read": true,
      },
    },
    {
      arrayFilters: [{ "elem.sender": { $ne: user }, "elem.read": false }],
      new: true,
    }
  );
}

/**
 * Count unread messages for a user across all conversations
 * @param userId ID of the user to count unread messages for
 * @returns Total number of unread messages
 */
export async function countUnreadMessages(userId: string | Types.ObjectId) {
  await connectDB();

  const user = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const conversations = await Conversation.find({ participants: user });

  let unreadCount = 0;

  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (!message.read && !message.sender.equals(user)) {
        unreadCount++;
      }
    }
  }

  return unreadCount;
}

/**
 * Find a conversation between two users by their usernames
 * @param username1 Username of the first user
 * @param username2 Username of the second user
 * @returns The existing or newly created conversation between the users
 */
export async function findConversationByUsernames(
  username1: string,
  username2: string
) {
  await connectDB();

  const user1 = await User.findOne({ username: username1 });
  const user2 = await User.findOne({ username: username2 });

  if (!user1 || !user2) {
    throw new Error("One or both users not found");
  }

  return findOrCreateConversation(user1._id, user2._id);
}
