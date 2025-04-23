// src/lib/db/models/gallery.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";

export interface IGallery extends Document {
  _id: ObjectId;
  userId: ObjectId;             // owner
  name: string;                 // "General", "Commissions", etc.
  isDeleted: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

const GallerySchema = new Schema<IGallery>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    name:     { type: String, required: true, maxlength: 50 },
    isDeleted:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

GallerySchema.index({ userId:1, isDeleted:1 });

export default models.Gallery || model<IGallery>("Gallery", GallerySchema);
