// Modify the utility function in src/lib/utils/toObjectId.ts
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export function toObjectId(id: string | ObjectId): mongoose.Types.ObjectId {
  if (typeof id === "string") {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

// Add this helper function to safely validate MongoDB IDs
export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}
