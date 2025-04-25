// src/lib/db/models/wallet.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

export interface IWallet extends Document {
  _id: ObjectId;
  user: ObjectId;
  saldoAvailable: Cents;   // can be spent or withdrawn
  saldoEscrowed: Cents;    // held for commissions in progress
  createdAt: ISODate;
  updatedAt: ISODate;
}

const WalletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    saldoAvailable: { type: Number, default: 0 },
    saldoEscrowed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WalletSchema.index({ user: 1 });

export default models.Wallet || model<IWallet>("Wallet", WalletSchema);