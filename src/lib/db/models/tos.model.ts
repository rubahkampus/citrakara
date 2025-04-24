// src/lib/db/models/tos.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";

interface TosSection {
  subtitle: string;
  text: string;
}

export interface ITosEntry extends Document {
  _id: ObjectId;
  user: ObjectId;
  title: string;
  content: TosSection[];
  isDefault: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

const TosSectionSchema = new Schema<TosSection>(
  {
    subtitle: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false } // No individual _id for sections
);

const TosSchema = new Schema<ITosEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: [TosSectionSchema], required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TosSchema.index({ user: 1, isDefault: 1 });

export default models.Tos || model<ITosEntry>("Tos", TosSchema);