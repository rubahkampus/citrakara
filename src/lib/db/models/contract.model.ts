// src/lib/db/models/contract.model.ts
// -----------------------------------------------------------------------------
// Contract (Order) – single source-of-truth for a running commission
// -----------------------------------------------------------------------------
//  • Created when a Proposal is *paid*.
//  • Snapshots of the Listing and Proposal for audit.
//  • Holds progress/final uploads, milestone states, ticket arrays, finance,
//    payment, late, dispute history, etc.
// -----------------------------------------------------------------------------

import { Schema, model, models, Document, Types } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import type { ICommissionListing } from "./commissionListing.model";
import type { IProposal } from "./proposal.model";

/* -------------------------------------------------------------------------- */
/* 1. Progress / Final uploads (NO “revision/deliverable” kinds any more)     */
/* -------------------------------------------------------------------------- */
/** A progress screenshot or final package. */
export interface WorkUpload {
  /** “progress” = WIPs / sketches; “final” = approved finished files */
  kind: "progress" | "final";
  /** For milestone flow, which stage this upload belongs to (0-N). */
  milestoneIndex?: number;
  images: string[];            // CDN URLs
  description?: string;        // artist’s note
  uploadedAt: ISODate;
}
const WorkUploadSchema = new Schema<WorkUpload>(
  {
    kind:            { type: String, enum: ["progress", "final"], required: true },
    milestoneIndex:  Number,
    images:          { type: [String], required: true },
    description:     String,
    uploadedAt:      { type: Date, default: Date.now }
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/* 2. History: one row per STATUS change                                      */
/* -------------------------------------------------------------------------- */
export type ContractStatus =
  | "pending_start" | "in_progress" | "awaiting_review" | "revising"
  | "late" | "cancelled" | "disputed" | "completed" | "refunded";

export interface HistoryEvent {
  event: ContractStatus;       // status we just entered
  by: "client" | "artist" | "system" | "moderator";
  at: ISODate;
}
const HistorySchema = new Schema<HistoryEvent>(
  {
    event:   { type: String, enum: [
                "pending_start","in_progress","awaiting_review","revising",
                "late","cancelled","disputed","completed","refunded"
              ], required: true },
    by:      { type: String, enum: ["client","artist","system","moderator"], required: true },
    at:      { type: Date,   default: Date.now }
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/* 3. Contract-level Event log (granular audit)                               */
/* -------------------------------------------------------------------------- */
export type ContractEventType =
  | "status_change" | "milestone_progress"
  | "revision_requested" | "revision_delivered"
  | "cancel_opened" | "cancel_resolved"
  | "change_request" | "change_applied"
  | "late_flagged" | "payout_released" | "refund_issued";

export interface ContractEvent {
  type: ContractEventType;
  timestamp: ISODate;
  actor: "client" | "artist" | "system" | "admin";
  actorId: ObjectId;
  data?: Record<string, unknown>;
}
const EventSchema = new Schema<ContractEvent>(
  {
    type:      { type: String, enum: [
                  "status_change","milestone_progress",
                  "revision_requested","revision_delivered",
                  "cancel_opened","cancel_resolved",
                  "change_request","change_applied",
                  "late_flagged","payout_released","refund_issued"
                ], required: true },
    timestamp: { type: Date, default: Date.now },
    actor:     { type: String, enum: ["client","artist","system","admin"], required: true },
    actorId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    data:      Schema.Types.Mixed
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/* 4. Milestones (deliverable now = accepted final WorkUpload reference)      */
/* -------------------------------------------------------------------------- */
export interface Milestone {
  title: string;
  description?: string;
  index: number;
  percent: number;                       // percent invoiced
  status: "pending" | "in_progress" | "reviewing" | "approved" | "rejected";
  startedAt?: ISODate;
  completedAt?: ISODate;
  /** Once client approves, store the _id of the “final” WorkUpload row. */
  workUploadId?: ObjectId;
  revisionsUsed: number;
  revisionPolicy?: Record<string, unknown>;
}
const MilestoneSchema = new Schema<Milestone>(
  {
    title:  { type: String, required: true },
    description:String,
    index:  { type: Number, required: true },
    percent:{ type: Number, min:0, max:100, required: true },
    status: { type: String, enum: ["pending","in_progress","reviewing","approved","rejected"], default:"pending" },
    startedAt:Date,
    completedAt:Date,
    workUploadId: Schema.Types.ObjectId,
    revisionsUsed:{ type: Number, default:0 },
    revisionPolicy:Schema.Types.Mixed
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/* 5. Ticket schemas                                                          */
/* -------------------------------------------------------------------------- */
/* 5a. Revision Ticket – log removed (chat handles negotiation) */
export interface RevisionTicket {
  _id: ObjectId;
  milestoneIdx?: number;
  description: string;
  referenceImages?: string[];
  status:
    | "awaiting_artist" | "artist_revising" | "client_review"
    | "awaiting_payment" | "closed_success" | "closed_rejected"
    | "closed_out_of_scope" | "closed_cancelled" | "disputed"
    | "closed_by_staff";
  reviewExpiresAt?: ISODate;
  paidFee?: Cents;               // fee charged if beyond free quota
  paymentTxnId?: ObjectId;
  deliverables?: string[];       // URLs
}
const RevisionTicketSchema = new Schema<RevisionTicket>(
  {
    _id:        { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
    milestoneIdx:Number,
    description:{ type: String, required: true },
    referenceImages:[String],
    status:{ type: String, enum:[
             "awaiting_artist","artist_revising","client_review",
             "awaiting_payment","closed_success","closed_rejected",
             "closed_out_of_scope","closed_cancelled","disputed","closed_by_staff"
           ], default:"awaiting_artist" },
    reviewExpiresAt:Date,
    paidFee:Number,
    paymentTxnId:Schema.Types.ObjectId,
    deliverables:[String]
  },
  { _id:false }
);

/* 5b. Cancel Ticket – log removed, negotiation via chat, no “negotiating” */
export interface CancelTicket {
  _id: ObjectId;
  requestedBy: "client" | "artist";
  requestedAt: ISODate;
  reason: string;
  status: "pending" | "accepted" | "rejected" | "escalated" | "resolved";
  respondBy?: ISODate;
  workPercentComplete?: number;      // artist-reported %
  artistPayout?: Cents;
  clientRefund?: Cents;
}
const CancelTicketSchema = new Schema<CancelTicket>(
  {
    _id:        { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
    requestedBy:{ type: String, enum:["client","artist"], required:true },
    requestedAt:{ type: Date, default: Date.now },
    reason:     { type: String, required:true },
    status:     { type: String, enum:["pending","accepted","rejected","escalated","resolved"], default:"pending" },
    respondBy:  Date,
    workPercentComplete:Number,
    artistPayout:Number,
    clientRefund:Number
  },
  { _id:false }
);

/* 5c. Contract-Change Ticket – priceDelta → paidFee, add txnRef, drop log */
export interface ChangeTicket {
  _id: ObjectId;
  requestedBy: "client" | "artist";
  requestedAt: ISODate;
  changes: Record<string, unknown>;
  reason: string;
  status: "draft" | "pending" | "accepted" | "rejected" | "applied" | "cancelled";
  respondBy?: ISODate;
  paidFee?: Cents;            // artist can propose an up-charge
  transactionId?: ObjectId;   // walletTxn / escrowTxn that paid the fee
  appliedAt?: ISODate;
  contractVersionAfter?: number;
}
const ChangeTicketSchema = new Schema<ChangeTicket>(
  {
    _id:{ type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
    requestedBy:{ type: String, enum:["client","artist"], required:true },
    requestedAt:{ type: Date, default: Date.now },
    changes:    { type: Schema.Types.Mixed, required:true },
    reason:     { type: String, required:true },
    status:     { type: String, enum:["draft","pending","accepted","rejected","applied","cancelled"], default:"draft" },
    respondBy:  Date,
    paidFee:    Number,
    transactionId:Schema.Types.ObjectId,
    appliedAt:  Date,
    contractVersionAfter:Number
  },
  { _id:false }
);

/* 5d. Resolution Ticket – openedBy (no system), actionTaken enum */
export interface ResolutionTicket {
  _id: ObjectId;
  openedBy: "client" | "artist" | "admin";
  openedAt: ISODate;
  issue: string;
  status: "open" | "under_review" | "resolved";
  originalTicketId?: ObjectId;
  ticketType?: "revision" | "cancel" | "change" | "late";
  actionTaken?: "full_refund" | "partial_refund" | "release_funds" | "no_action";
  resolvedAt?: ISODate;
  resolvedBy?: ObjectId;
}
const ResolutionTicketSchema = new Schema<ResolutionTicket>(
  {
    _id:{ type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
    openedBy:{ type: String, enum:["client","artist","admin"], required:true },
    openedAt:{ type: Date, default: Date.now },
    issue:{ type: String, required:true },
    status:{ type: String, enum:["open","under_review","resolved"], default:"open" },
    originalTicketId:Schema.Types.ObjectId,
    ticketType:{ type:String, enum:["revision","cancel","change","late"] },
    actionTaken:{ type:String, enum:["full_refund","partial_refund","release_funds","no_action"] },
    resolvedAt:Date,
    resolvedBy:Schema.Types.ObjectId
  },
  { _id:false }
);

/* -------------------------------------------------------------------------- */
/* 6. Finance & Payment                                                       */
/* -------------------------------------------------------------------------- */
/**
 * Finance block is an immutable snapshot of the *agreed* amount
 * at contract start + every applied contract-change.
 *
 * ┌────────────────────────────┐
 * │ basePrice   – floor price  │  ← listing.basePrice
 * │ optionFees  – sum of optionGroups selections
 * │ addons      – sum of addon prices
 * │ rushFee     – added if client chooses deadline < minDays
 * │ discount    – coupons or artist goodwill
 * │ surcharge   – artist manual up-charge before accept
 * │ extraFees   – later contract-change paidFee total
 * ├────────────────────────────┤
 * │ subtotal = base+option+addon+rush - discount + surcharge │
 * │ total    = subtotal + extraFees                          │
 * └────────────────────────────┘
 */
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
    basePrice: { type: Number, required: true },
    optionFees:{ type: Number, required: true },
    addons:    { type: Number, required: true },
    rushFee:   { type: Number, default: 0 },
    discount:  { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    extraFees: { type: Number, default: 0 },
    subtotal:  { type: Number, required: true },
    total:     { type: Number, required: true }
  },
  { _id:false }
);

/* Payment block tracks escrow & refund lifecycle */
export interface Payment {
  status: "pending" | "paid" | "partially_refunded" | "fully_refunded" | "released";
  paidAt?: ISODate;
  escrowTxnId?: ObjectId;   // link to EscrowTransaction ‘hold’
  releasedTxnId?: ObjectId; // link to ‘release’
  refundTxnId?: ObjectId;   // last refund
}
const PaymentSchema = new Schema<Payment>(
  {
    status:{ type:String, enum:["pending","paid","partially_refunded","fully_refunded","released"], default:"pending" },
    paidAt:Date,
    escrowTxnId:Schema.Types.ObjectId,
    releasedTxnId:Schema.Types.ObjectId,
    refundTxnId:Schema.Types.ObjectId
  },
  { _id:false }
);

/* -------------------------------------------------------------------------- */
/* 7. Contract Interface                                                      */
/* -------------------------------------------------------------------------- */
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

  work: WorkUpload[];

  revisionTickets: RevisionTicket[];
  cancelTickets: CancelTicket[];
  contractChangeTickets: ChangeTicket[];
  resolutionTickets: ResolutionTicket[];

  late?: {
    flaggedAt: ISODate;
    extensions?: { requestedAt: ISODate; newDeadlineAt: ISODate; newGraceEndsAt: ISODate }[];
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

  addEvent(type: ContractEventType, actor: "client" | "artist" | "system" | "admin", actorId: ObjectId, data?: Record<string, unknown>): void;
  changeStatus(newStatus: ContractStatus, actor: "client" | "artist" | "system" | "admin"): void;
}

/* -------------------------------------------------------------------------- */
/* 8. Mongoose Schema                                                         */
/* -------------------------------------------------------------------------- */
const ContractSchema = new Schema<IContract>(
  {
    clientId:{ type:Schema.Types.ObjectId, ref:"User", required:true },
    artistId:{ type:Schema.Types.ObjectId, ref:"User", required:true },
    listingId:{ type:Schema.Types.ObjectId, ref:"CommissionListing", required:true },
    proposalId:{ type:Schema.Types.ObjectId, ref:"Proposal", required:true },

    contractNumber:{ type:String, required:true, unique:true },

    status:{ type:String, enum:[
      "pending_start","in_progress","awaiting_review","revising",
      "late","cancelled","disputed","completed","refunded"
    ], default:"pending_start" },
    statusHistory:[ HistorySchema ],
    events:[ EventSchema ],

    listingSnapshot:Schema.Types.Mixed,
    proposalSnapshot:Schema.Types.Mixed,
    contractVersion:{ type:Number, default:1 },

    flow:{ type:String, enum:["standard","milestone"], required:true },
    currentMilestoneIndex:Number,
    milestones:[ MilestoneSchema ],

    work:[ WorkUploadSchema ],

    revisionTickets:[ RevisionTicketSchema ],
    cancelTickets:[ CancelTicketSchema ],
    contractChangeTickets:[ ChangeTicketSchema ],
    resolutionTickets:[ ResolutionTicketSchema ],

    late:{
      flaggedAt:Date,
      extensions:[{ requestedAt:Date, newDeadlineAt:Date, newGraceEndsAt:Date }],
      payoutDone:Boolean
    },
    latePenaltyPercent:Number,

    finance: FinanceSchema,
    payment: PaymentSchema,

    cancelSummary:Schema.Types.Mixed,
    completion:   Schema.Types.Mixed,
    disputes:     { type:[Schema.Types.Mixed], default:[] },

    deadlineAt:{ type:Date, required:true },
    graceEndsAt:{ type:Date, required:true },

    activeSubflow:String,
    isHidden:{ type:Boolean, default:false }
  },
  { timestamps:true }
);

/* -------------------------------------------------------------------------- */
/* 9. Instance helpers                                                        */
/* -------------------------------------------------------------------------- */
ContractSchema.methods.addEvent = function(
  type: ContractEventType,
  actor: "client" | "artist" | "system" | "admin",
  actorId: ObjectId,
  data?: Record<string, unknown>
) {
  this.events.push({ type, timestamp:new Date(), actor, actorId, data });
};

ContractSchema.methods.changeStatus = function(
  newStatus: ContractStatus,
  actor: "client" | "artist" | "system" | "admin"
) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.statusHistory.push({ event:newStatus, by:actor, at:new Date() });
  this.addEvent("status_change", actor, actor === "client" ? this.clientId : this.artistId, { oldStatus, newStatus });
};

/* -------------------------------------------------------------------------- */
/* 10. Indexes                                                                */
/* -------------------------------------------------------------------------- */
ContractSchema.index({ artistId:1, status:1 });
ContractSchema.index({ clientId:1, status:1 });
ContractSchema.index({ contractNumber:1 }, { unique:true });
ContractSchema.index({ deadlineAt:1 });
ContractSchema.index({ createdAt:-1 });

export default models.Contract || model<IContract>("Contract", ContractSchema);
