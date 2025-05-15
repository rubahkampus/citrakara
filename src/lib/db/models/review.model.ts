import { ISODate } from "@/types/common";
import { Document, Schema, model, models, Types, ObjectId } from "mongoose";

export interface IReview extends Document {
  _id: ObjectId;
  uploadId: ObjectId;

  contractId: ObjectId;
  listingId: ObjectId;
  artistId: ObjectId;
  clientId: ObjectId;

  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;

  /** Optional image(s) from the final deliverable. */
  images?: string[];

  createdAt: ISODate;
  updatedAt: ISODate;
}

const ReviewSchema = new Schema<IReview>(
  {
    uploadId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "FinalUpload",
    },

    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Contract",
    },
    listingId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "CommissionListing",
    },
    artistId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    clientId: { type: Schema.Types.ObjectId, required: true, ref: "User" },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5",
      },
    },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Index by related objects for quick lookups
ReviewSchema.index({ uploadId: 1 }, { unique: true }); // One review per upload
ReviewSchema.index({ contractId: 1 });
ReviewSchema.index({ listingId: 1 });
ReviewSchema.index({ artistId: 1 });
ReviewSchema.index({ clientId: 1 });

export default models.Review || model<IReview>("Review", ReviewSchema);
