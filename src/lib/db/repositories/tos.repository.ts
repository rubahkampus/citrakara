// src/lib/db/repositories/tos.repository.ts
import Tos from "@/lib/db/models/tos.model";
import { connectDB } from "@/lib/db/connection";
import { ObjectId } from "mongoose";

/**
 * Create a default TOS entry for a new user
 * @param userId The ID of the user to create default TOS for
 * @returns The newly created TOS document
 */
export async function createDefaultTos(userId: string | ObjectId) {
  await connectDB();

  const defaultContent = [
    {
      subtitle: "General Terms",
      text: "These terms govern all commissions accepted by the artist.",
    },
    {
      subtitle: "Payment",
      text: "Payment is required upfront before work begins. No refunds after work has started.",
    },
    {
      subtitle: "Rights",
      text: "The artist retains all rights to the artwork unless explicitly stated otherwise.",
    },
    {
      subtitle: "Usage",
      text: "The client may use the commissioned work for personal use only, unless commercial rights are purchased.",
    },
    {
      subtitle: "Revisions",
      text: "Each commission includes up to 2 revisions. Additional revisions will be charged at the artist's hourly rate.",
    },
  ];

  const tos = new Tos({
    user: userId,
    title: "Default Terms of Service",
    content: defaultContent,
    isDefault: true,
  });

  return tos.save();
}

/**
 * Find all TOS entries by user ID
 * @param userId The ID of the user to find TOS entries for
 * @returns Array of TOS documents belonging to the user
 */
export async function findTosByUserId(userId: string | ObjectId) {
  await connectDB();
  return Tos.find({ user: userId });
}

/**
 * Find the default TOS for a specific user
 * @param userId The ID of the user to find default TOS for
 * @returns The default TOS document for the user, or null if not found
 */
export async function findDefaultTosByUserId(userId: string | ObjectId) {
  await connectDB();
  return Tos.findOne({ user: userId, isDefault: true });
}

/**
 * Update an existing TOS entry
 * @param tosId The ID of the TOS document to update
 * @param updates Object containing fields to update (title and/or content)
 * @returns The updated TOS document
 */
export async function updateTos(
  tosId: string | ObjectId,
  updates: {
    title?: string;
    content?: Array<{ subtitle: string; text: string }>;
  }
) {
  await connectDB();
  return Tos.findByIdAndUpdate(tosId, updates, { new: true });
}
