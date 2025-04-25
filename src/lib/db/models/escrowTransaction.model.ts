// src/lib/db/models/escrowTransaction.model.ts
// -----------------------------------------------------------------------------
// EscrowTransaction – atomic record of every money move through the KOMIS
// “escrow” account.  WalletService writes two WalletTransaction rows that
// mirror each EscrowTransaction so user balances stay consistent.
// -----------------------------------------------------------------------------

import { Schema, model, models, Document } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

export type EscrowTxnType =
  | "hold"           // client → escrow (order payment)
  | "release"        // escrow → artist (payout)
  | "refund"         // escrow → client (cancel / over-delivery)
  | "penalty"        // escrow → client (late-penalty)
  | "revision_fee"   // client → escrow
  | "change_fee";    // client → escrow (contract-change)

export type EscrowStatus =
  | "held"           // money is sitting in escrow
  | "released"       // sent to artist
  | "refunded";      // returned to client

export interface IEscrowTransaction extends Document {
  _id: ObjectId;

  contractId: ObjectId;       // link to Contract / Order
  walletTransactionId: ObjectId; // mirror row in wallet_txns (optional)

  /** direction of funds */
  type: EscrowTxnType;
  from: "client" | "escrow";
  to:   "escrow" | "artist" | "client";

  amount: Cents;
  currency: "IDR";

  status: EscrowStatus;

  /** bookkeeping / traceability */
  createdAt: ISODate;
  note?: string;              // optional human comment
}

const EscrowSchema = new Schema<IEscrowTransaction>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    walletTransactionId: { type: Schema.Types.ObjectId, ref: "WalletTransaction" },

    type:   { type: String, enum: ["hold","release","refund","penalty","revision_fee","change_fee"], required: true },
    from:   { type: String, enum: ["client","escrow"], required: true },
    to:     { type: String, enum: ["escrow","artist","client"], required: true },

    amount:   { type: Number, required: true },
    currency: { type: String, default: "IDR" },

    status: { type: String, enum: ["held","released","refunded"], required: true },

    note: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* Indexes for quick look-ups */
EscrowSchema.index({ contractId: 1, createdAt: -1 });
EscrowSchema.index({ status: 1, createdAt: -1 });

export default models.EscrowTransaction
  || model<IEscrowTransaction>("EscrowTransaction", EscrowSchema);
