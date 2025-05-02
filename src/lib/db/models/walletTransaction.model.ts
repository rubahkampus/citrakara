// src/lib/db/models/walletTransaction.model.ts
import mongoose, { Schema, model, models, Document } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

export interface IWalletTransaction extends Document {
  wallet: ObjectId;
  type: "credit" | "debit";
  amount: Cents;
  target: "available" | "escrowed"; // where the money goes
  source: "commission" | "refund" | "payment" | "manual" | "release";
  note?: string;
  createdAt: ISODate;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    target: { type: String, enum: ["available", "escrowed"], required: true },
    source: {
      type: String,
      enum: ["commission", "refund", "payment", "manual", "release"],
      required: true,
    },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WalletTransactionSchema.index({ wallet: 1, createdAt: -1 });

export default models.WalletTransaction ||
  model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
