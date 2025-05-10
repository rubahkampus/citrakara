// src/lib/db/models/escrowtransaction.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

export interface IEscrowTransaction extends Document {
  _id: ObjectId;
  contractId: ObjectId | null; // always tied to a contract

  type: // reason for money move
  | "hold" // client → escrow
    | "release" // escrow → artist
    | "refund" // escrow → client
    | "revision_fee" // client → escrow
    | "change_fee"; // client → escrow

  from: "client" | "escrow"; // source wallet
  to: "escrow" | "artist" | "client"; // destination wallet
  amount: Cents;
  note?: string; // free‑text annotation
  createdAt: ISODate;
}

const EscrowTransactionSchema = new Schema<IEscrowTransaction>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: false, // ← no longer required
      default: null, // ← initialize to null
    },
    type: {
      type: String,
      enum: ["hold", "release", "refund", "revision_fee", "change_fee"],
      required: true,
    },
    from: {
      type: String,
      enum: ["client", "escrow"],
      required: true,
    },
    to: {
      type: String,
      enum: ["escrow", "artist", "client"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

export default models.EscrowTransaction ||
  model<IEscrowTransaction>("EscrowTransaction", EscrowTransactionSchema);
