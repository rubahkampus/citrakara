// src/lib/services/tos.service.ts
import { findTosByUserId, findDefaultTosByUserId, updateTos } from "@/lib/db/repositories/tos.repository";
import { ObjectId } from "mongoose";
import Tos from "@/lib/db/models/tos.model";
import { connectDB } from "@/lib/db/connection";

/**
 * Get all TOS entries for a user
 */
export async function getUserTosEntries(userId: string | ObjectId) {
  return findTosByUserId(userId);
}

/**
 * Get the default TOS for a user
 */
export async function getUserDefaultTos(userId: string | ObjectId) {
  return findDefaultTosByUserId(userId);
}

/**
 * Create a new TOS entry for a user
 */
export async function createNewTosEntry(
  userId: string | ObjectId,
  title: string,
  content: Array<{ subtitle: string; text: string }>
) {
  await connectDB();
  
  const tos = new Tos({
    user: userId,
    title,
    content,
    isDefault: false
  });

  return tos.save();
}

/**
 * Update a TOS entry
 */
export async function updateTosEntry(
  tosId: string | ObjectId,
  title: string,
  content: Array<{ subtitle: string; text: string }>
) {
  return updateTos(tosId, { title, content });
}

/**
 * Set a TOS entry as default
 */
export async function setDefaultTos(userId: string | ObjectId, tosId: string | ObjectId) {
  await connectDB();
  
  // First, unset any existing default
  await Tos.updateMany(
    { user: userId, isDefault: true },
    { isDefault: false }
  );
  
  // Then set the new default
  return Tos.findByIdAndUpdate(tosId, { isDefault: true }, { new: true });
}

/**
 * Delete a TOS entry (soft delete)
 */
export async function deleteTosEntry(tosId: string | ObjectId) {
  await connectDB();
  
  // Check if it's the default - we shouldn't delete the default TOS
  const tos = await Tos.findById(tosId);
  
  if (!tos) {
    throw new Error("TOS entry not found");
  }
  
  if (tos.isDefault) {
    throw new Error("Cannot delete the default TOS");
  }
  
  return Tos.findByIdAndUpdate(tosId, { isDeleted: true }, { new: true });
}