// src/lib/db/models/wallet.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

export interface IWallet extends Document {
  _id: ObjectId;
  user: ObjectId; // owner user
  saldoAvailable: Cents; // withdrawable / spendable
  saldoEscrowed: Cents; // locked in contracts
  createdAt: ISODate;
  updatedAt: ISODate;
}

const WalletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    saldoAvailable: { type: Number, default: 0 },
    saldoEscrowed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Wallet || model<IWallet>("Wallet", WalletSchema);
