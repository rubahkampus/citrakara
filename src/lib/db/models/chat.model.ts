import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";

// Message type within a conversation
export interface IMessage extends Document {
  _id: ObjectId;
  sender: ObjectId; // User ID of the sender
  content: string; // Text content of the message
  images?: string[]; // Optional array of image URLs
  read: boolean; // Whether the message has been read
  createdAt: ISODate;
  updatedAt: ISODate;
}

// Main conversation model
export interface IConversation extends Document {
  _id: ObjectId;
  participants: ObjectId[]; // Array of user IDs in the conversation (usually 2)
  messages: IMessage[]; // Array of messages in the conversation
  lastActivity: ISODate; // Timestamp of the last activity for sorting
  createdAt: ISODate;
  updatedAt: ISODate;
}

// Schema for individual messages
const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Schema for the conversation
const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    messages: [MessageSchema],
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 }); // For sorting by most recent activity

// Export the model
export const Conversation =
  models.Conversation ||
  model<IConversation>("Conversation", ConversationSchema);
