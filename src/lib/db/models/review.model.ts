// src/lib/db/models/review.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";

export interface IReview extends Document {
  _id: ObjectId;
  orderId: ObjectId;
  listingId: ObjectId;
  artistId: ObjectId;
  clientId: ObjectId;

  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;

  /** Optional image(s) from the final deliverable. */
  images?: string[];

  createdAt: ISODate;
  editedAt?: ISODate;
  isDeleted: boolean;
}

const ReviewSchema = new Schema<IReview>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "CommissionListing",
      required: true,
    },
    artistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1024 },

    images: { type: [String], default: [] },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------- Indexes ---------- */
ReviewSchema.index({ listingId: 1, isDeleted: 1 });
ReviewSchema.index({ artistId: 1, isDeleted: 1 });

export default models.Review || model<IReview>("Review", ReviewSchema);
