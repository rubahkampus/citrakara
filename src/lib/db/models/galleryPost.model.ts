// src/lib/db/models/galleryPost.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";

export interface IGalleryPost extends Document {
  _id: ObjectId;
  userId:    ObjectId;
  galleryId: ObjectId;

  image: string;                 // CDN / R2 URL
  description?: string;

  /** Optional cross-links for richer context */
  commissionListingId?: ObjectId;
  orderId?: ObjectId;

  isDeleted: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

const GalleryPostSchema = new Schema<IGalleryPost>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    galleryId: { type: Schema.Types.ObjectId, ref: "Gallery", required: true },

    image:      { type: String, required: true },
    description: { type: String, default: "" },

    commissionListingId: { type: Schema.Types.ObjectId, ref: "CommissionListing" },
    orderId:     { type: Schema.Types.ObjectId, ref: "Order" },

    isDeleted:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

GalleryPostSchema.index({ userId: 1, galleryId: 1, isDeleted: 1 });
GalleryPostSchema.index({ commissionListingId: 1 });

export default models.GalleryPost || model<IGalleryPost>("GalleryPost", GalleryPostSchema);