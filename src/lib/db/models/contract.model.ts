// src/lib/db/models/contract.model.ts
// -----------------------------------------------------------------------------
// Contract – single source-of-truth for a running commission
// -----------------------------------------------------------------------------

import { Schema, model, models, Document } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import type { ICommissionListing } from "./commissionListing.model";
import type { IProposal } from "./proposal.model";

/* sub-schemas -------------------------------------------------------------- */
import {
  ContractStatus, // enum
  HistorySchema,
  HistoryEvent,
  ContractEventType,
  ContractEventSchema,
  ContractEvent,
  WorkUploadSchema,
  WorkUpload,
  MilestoneSchema,
  Milestone,
  RevisionTicketSchema,
  RevisionTicket,
  CancelTicketSchema,
  CancelTicket,
  ChangeTicketSchema,
  ChangeTicket,
  ResolutionTicketSchema,
  ResolutionTicket,
} from "./ticket.model";

/* ───────────────────────── Finance & Payment (unchanged) ────────────────── */
export interface Finance {
  basePrice: Cents;
  optionFees: Cents;
  addons: Cents;
  rushFee: Cents;
  discount: Cents;
  surcharge: Cents;
  extraFees: Cents;
  subtotal: Cents;
  total: Cents;
}
const FinanceSchema = new Schema<Finance>(
  {
    basePrice: Number,
    optionFees: Number,
    addons: Number,
    rushFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    extraFees: { type: Number, default: 0 },
    subtotal: Number,
    total: Number,
  },
  { _id: false }
);

export interface Payment {
  status:
    | "pending"
    | "paid"
    | "partially_refunded"
    | "fully_refunded"
    | "released";
  paidAt?: ISODate;
  escrowTxnId?: ObjectId;
  releasedTxnId?: ObjectId;
  refundTxnId?: ObjectId;
}
const PaymentSchema = new Schema<Payment>(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "partially_refunded",
        "fully_refunded",
        "released",
      ],
      default: "pending",
    },
    paidAt: Date,
    escrowTxnId: Schema.Types.ObjectId,
    releasedTxnId: Schema.Types.ObjectId,
    refundTxnId: Schema.Types.ObjectId,
  },
  { _id: false }
);

/* ───────────────────────── Contract interface (fixed actorId nullable) ───── */
export interface IContract extends Document {
  _id: ObjectId;
  clientId: ObjectId;
  artistId: ObjectId;
  listingId: ObjectId;
  proposalId: ObjectId;
  contractNumber: string;

  status: ContractStatus;
  statusHistory: HistoryEvent[];
  events: ContractEvent[];

  listingSnapshot: Omit<ICommissionListing, "_id" | "createdAt" | "updatedAt">;
  proposalSnapshot: IProposal;
  contractVersion: number;

  flow: "standard" | "milestone";
  currentMilestoneIndex?: number;
  milestones?: Milestone[];

  // Option A: Keep top-level work (unified view across milestones)
  work: WorkUpload[];

  revisionTickets: RevisionTicket[];
  cancelTickets: CancelTicket[];
  contractChangeTickets: ChangeTicket[];
  resolutionTickets: ResolutionTicket[];

  late?: {
    flaggedAt: ISODate;
    extensions?: {
      requestedAt: ISODate;
      newDeadlineAt: ISODate;
      newGraceEndsAt: ISODate;
    }[];
    payoutDone?: boolean;
  };
  latePenaltyPercent?: number;

  finance: Finance;
  payment: Payment;

  /** Each cancellation / refund path pushed here so history is recoverable. */
  cancelSummary?: {
    by: "client" | "artist";
    at: ISODate;
    route: string;
    workPercent: number;
    artistPayout: Cents;
    clientPayout: Cents;
    escrowTxnIds: ObjectId[];
  };

  completion?: {
    percentComplete: number;
    clientRating?: number;
    artistRating?: number;
    reviewId?: ObjectId;
  };

  /** Multiple disputes allowed over contract lifetime. */
  disputes?: Array<{
    status: "open" | "under_review" | "resolved";
    openedAt: ISODate;
    openedBy: "client" | "artist" | "admin";
    reason: string;
    resolution?: string;
    resolvedAt?: ISODate;
    decision?: "favor_client" | "favor_artist" | "compromise";
  }>;

  deadlineAt: ISODate;
  graceEndsAt: ISODate;

  activeSubflow?: string;
  isHidden: boolean;

  addEvent(
    type: ContractEventType,
    actor: "client" | "artist" | "system" | "admin",
    actorId: ObjectId | null, // Fixed: Made actorId nullable to match implementation
    data?: Record<string, unknown>
  ): void;
  changeStatus(
    newStatus: ContractStatus,
    actor: "client" | "artist" | "system" | "admin"
  ): void;
}

/* ───────────────────────── Mongoose schema  ─────────────────────────────── */
const ContractSchema = new Schema<IContract>(
  {
    /* relationships */
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "CommissionListing",
      required: true,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },

    /* id */
    contractNumber: { type: String, required: true, unique: true },

    /* status & logs */
    status: {
      type: String,
      enum: [
        "pending_start",
        "in_progress",
        "awaiting_review",
        "revising",
        "late",
        "cancelled",
        "disputed",
        "completed",
        "refunded",
      ],
      default: "pending_start",
    },
    statusHistory: [HistorySchema],
    events: [ContractEventSchema],

    /* snapshots */
    listingSnapshot: Schema.Types.Mixed,
    proposalSnapshot: Schema.Types.Mixed,
    contractVersion: { type: Number, default: 1 },

    /* flow */
    flow: { type: String, enum: ["standard", "milestone"], required: true },
    currentMilestoneIndex: Number,
    milestones: [MilestoneSchema],

    /* uploads & tickets */
    work: [WorkUploadSchema],
    revisionTickets: [RevisionTicketSchema],
    cancelTickets: [CancelTicketSchema],
    contractChangeTickets: [ChangeTicketSchema],
    resolutionTickets: [ResolutionTicketSchema],

    /* lateness */
    late: {
      flaggedAt: Date,
      extensions: [
        { requestedAt: Date, newDeadlineAt: Date, newGraceEndsAt: Date },
      ],
      payoutDone: Boolean,
    },
    latePenaltyPercent: Number,

    /* money */
    finance: FinanceSchema,
    payment: PaymentSchema,

    cancelSummary: Schema.Types.Mixed,
    completion: Schema.Types.Mixed,
    disputes: { type: [Schema.Types.Mixed], default: [] },

    /* deadlines */
    deadlineAt: { type: Date, required: true },
    graceEndsAt: { type: Date, required: true },

    /* misc */
    activeSubflow: String,
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ───────────────────────── Instance helpers – tweaked ───────────────────── */
ContractSchema.methods.addEvent = function (
  type: ContractEventType,
  actor: "client" | "artist" | "system" | "admin",
  actorId: ObjectId | null,
  data: Record<string, unknown> = {}
) {
  this.events.push({ type, timestamp: new Date(), actor, actorId, data });
};

ContractSchema.methods.changeStatus = function (
  newStatus: ContractStatus,
  actor: "client" | "artist" | "system" | "admin"
) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.statusHistory.push({ event: newStatus, by: actor, at: new Date() });

  /* pick actorId if it matches ids we have, else null (e.g., admin) */
  let aid: null | ObjectId = null;
  if (actor === "client") aid = this.clientId;
  else if (actor === "artist") aid = this.artistId;

  this.addEvent("status_change", actor, aid, { oldStatus, newStatus });
};

/* -------------------------------- Hooks -------------------------------- */
// Ensure chronological consistency: graceEndsAt should always be after deadlineAt
ContractSchema.pre("save", function (next) {
  if (this.graceEndsAt <= this.deadlineAt) {
    return next(new Error("graceEndsAt must be after deadlineAt"));
  }
  // Sync graceEndsAt with last extension if present
  const exts = this.late?.extensions;
  if (exts && exts.length) {
    const last = exts[exts.length - 1];
    if (last.newGraceEndsAt) this.graceEndsAt = last.newGraceEndsAt;
  }
  next();
});
/* ───────────────────────── Indexes (unchanged) ──────────────────────────── */
ContractSchema.index({ artistId: 1, status: 1 });
ContractSchema.index({ clientId: 1, status: 1 });
ContractSchema.index({ contractNumber: 1 }, { unique: true });
ContractSchema.index({ deadlineAt: 1 });
ContractSchema.index({ createdAt: -1 });

export default models.Contract || model<IContract>("Contract", ContractSchema);
