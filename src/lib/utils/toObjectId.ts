// src/lib/utils/toObjectId.ts
import mongoose from "mongoose";
import type { ObjectId } from "@/types/common";

export function toObjectId(id: string | ObjectId): mongoose.Types.ObjectId {
  if (typeof id === "string") {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}
