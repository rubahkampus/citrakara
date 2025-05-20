// src/lib/services/tos.service.ts
import { ObjectId } from "mongoose";
import Tos from "@/lib/db/models/tos.model";
import { connectDB } from "@/lib/db/connection";
import {
  findTosByUserId,
  findDefaultTosByUserId,
  updateTos,
} from "@/lib/db/repositories/tos.repository";
import { toObjectId } from "@/lib/utils/toObjectId";

/**
 * Get all TOS entries for a user
 * @param userId User ID to retrieve TOS entries for
 * @returns Array of TOS entries for the user
 */
export async function getUserTosEntries(userId: string | ObjectId) {
  return findTosByUserId(userId);
}

/**
 * Get the default TOS for a user
 * @param userId User ID to retrieve default TOS for
 * @returns The default TOS for the user or null if none exists
 */
export async function getUserDefaultTos(userId: string | ObjectId) {
  return findDefaultTosByUserId(userId);
}

/**
 * Get a specific TOS by ID
 * Validates that the TOS belongs to the specified user
 * @param tosId TOS ID to retrieve
 * @returns The TOS document or null if not found
 */
export async function getTosById(tosId: string) {
  await connectDB();

  const tos = await Tos.findById(tosId);

  return tos;
}

/**
 * Create a new TOS entry for a user
 * If setAsDefault is true, make this the default TOS
 * @param userId User ID to create TOS for
 * @param title Title of the TOS
 * @param content Array of subtitle and text objects forming the TOS content
 * @param setAsDefault Whether to set this as the default TOS
 * @returns The newly created TOS document
 */
export async function createNewTosEntry(
  userId: string | ObjectId,
  title: string,
  content: Array<{ subtitle: string; text: string }>,
  setAsDefault: boolean = false
) {
  await connectDB();

  const session = await Tos.startSession();
  try {
    session.startTransaction();

    // Create the new TOS
    const tos = new Tos({
      user: userId,
      title,
      content,
      isDefault: setAsDefault,
    });

    await tos.save({ session });

    // If setAsDefault is true, unset any existing default
    if (setAsDefault) {
      await Tos.updateMany(
        { user: userId, isDefault: true, _id: { $ne: tos._id } },
        { isDefault: false },
        { session }
      );
    }

    await session.commitTransaction();
    return tos;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Update a TOS entry
 * Validates that the TOS belongs to the specified user
 * @param tosId ID of the TOS to update
 * @param userId User ID that owns the TOS
 * @param title Updated title of the TOS
 * @param content Updated array of subtitle and text objects
 * @param setAsDefault Whether to set this as the default TOS
 * @returns The updated TOS document
 * @throws Error if TOS not found or not owned by user
 */
export async function updateTosEntry(
  tosId: string | ObjectId,
  userId: string | ObjectId,
  title: string,
  content: Array<{ subtitle: string; text: string }>,
  setAsDefault: boolean = false
) {
  await connectDB();

  const session = await Tos.startSession();
  try {
    session.startTransaction();

    // First, check if the TOS belongs to the user
    const tos = await Tos.findOne({
      _id: tosId,
      user: userId,
    });

    if (!tos) {
      throw new Error("TOS entry not found or not owned by user");
    }

    // Update the TOS
    const updatedTos = await Tos.findByIdAndUpdate(
      tosId,
      { title, content, isDefault: setAsDefault || tos.isDefault },
      { new: true, session }
    );

    // If setAsDefault is true, unset any existing defaults
    if (setAsDefault) {
      await Tos.updateMany(
        { user: userId, isDefault: true, _id: { $ne: tosId } },
        { isDefault: false },
        { session }
      );
    }

    await session.commitTransaction();
    return updatedTos;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
