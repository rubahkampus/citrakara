// src/lib/db/models/ticket.model.ts
import { Schema, Types } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

/*──────────────────── 1 ▸ Work Uploads ────────────────────*/
export type WorkUploadStatus =
  | "submitted"    // artist sent, client hasn’t opened
  | "reviewing"    // client is looking at it (24 h window)
  | "approved"     // client accepted
  | "rejected";    // client rejected → triggers (or ties to) a revision

export interface WorkUpload {
  kind: "progress" | "final";
  milestoneIndex?: number;          // always present in milestone flow
  status: WorkUploadStatus;
  /** If this upload is responding to a specific revision ticket. */
  revisionTicketId?: ObjectId;
  images: string[];
  description?: string;
  uploadedAt: ISODate;
}

export const WorkUploadSchema = new Schema<WorkUpload>(
  {
    kind:           { type: String, enum: ["progress", "final"], required: true },
    milestoneIndex: Number,
    status:         { type: String, enum: ["submitted","reviewing","approved","rejected"], required: true },
    revisionTicketId:Schema.Types.ObjectId,
    images:         { type: [String], required: true },
    description:    String,
    uploadedAt:     { type: Date, default: Date.now }
  },
  { _id: false }
);

/*──────────────────── 2 ▸ Status history – unchanged ─────*/
export type ContractStatus =
  | "pending_start" | "in_progress" | "awaiting_review" | "revising"
  | "late" | "cancelled" | "disputed" | "completed" | "refunded";

export interface HistoryEvent {
  event: ContractStatus;
  by: "client" | "artist" | "system" | "moderator";
  at: ISODate;
}

export const HistorySchema = new Schema<HistoryEvent>(
  {
    event:{ type:String, enum:[
      "pending_start","in_progress","awaiting_review","revising",
      "late","cancelled","disputed","completed","refunded"
    ], required:true },
    by:  { type:String, enum:["client","artist","system","moderator"], required:true },
    at:  { type:Date, default:Date.now }
  },
  { _id:false }
);

/*──────────────────── 3 ▸ Event log – unchanged ──────────*/
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

export const ContractEventSchema = new Schema<ContractEvent>(
  {
    type:{ type:String, enum:[
      "status_change","milestone_progress",
      "revision_requested","revision_delivered",
      "cancel_opened","cancel_resolved",
      "change_request","change_applied",
      "late_flagged","payout_released","refund_issued"
    ], required:true },
    timestamp:{ type:Date, default:Date.now },
    actor:{ type:String, enum:["client","artist","system","admin"], required:true },
    actorId:{ type:Schema.Types.ObjectId, ref:"User", required:true },
    data:Schema.Types.Mixed
  },
  { _id:false }
);

/*──────────────────── 4 ▸ Milestones ─────────────────────*/
export interface Milestone {
  title: string;
  description?: string;
  index: number;
  percent: number;
  status: "pending" | "in_progress" | "reviewing" | "approved" | "rejected";
  startedAt?: ISODate;
  completedAt?: ISODate;

  /** All uploads ever submitted for this milestone */
  uploads: WorkUpload[];

  /** Upload finally approved by the client (null until approved) */
  acceptedUploadId?: ObjectId;

  revisionsUsed: number;
  revisionPolicy?: Record<string, unknown>;
}

export const MilestoneSchema = new Schema<Milestone>(
  {
    title:{ type:String, required:true },
    description:String,
    index:{ type:Number, required:true },
    percent:{ type:Number, min:0, max:100, required:true },
    status:{ type:String, enum:["pending","in_progress","reviewing","approved","rejected"], default:"pending" },
    startedAt:Date,
    completedAt:Date,

    uploads:[ WorkUploadSchema ],
    acceptedUploadId:Schema.Types.ObjectId,

    revisionsUsed:{ type:Number, default:0 },
    revisionPolicy:Schema.Types.Mixed
  },
  { _id:false }
);

/*──────────────────── 5 ▸ Tickets ────────────────────────*/
/* 5a ▸ Revision */
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
  paidFee?: Cents;
  paymentTxnId?: ObjectId;

  /** Single upload that answers this revision request */
  workUploadId?: ObjectId;
}

export const RevisionTicketSchema = new Schema<RevisionTicket>(
  {
    _id:{ type:Schema.Types.ObjectId, default:() => new Types.ObjectId() },
    milestoneIdx:Number,
    description:{ type:String, required:true },
    referenceImages:[String],
    status:{ type:String, enum:[
      "awaiting_artist","artist_revising","client_review","awaiting_payment",
      "closed_success","closed_rejected","closed_out_of_scope",
      "closed_cancelled","disputed","closed_by_staff"
    ], default:"awaiting_artist" },
    reviewExpiresAt:Date,
    paidFee:Number,
    paymentTxnId:Schema.Types.ObjectId,
    workUploadId:Schema.Types.ObjectId
  },
  { _id:false }
);

/* 5b ▸ Cancel – unchanged */
export interface CancelTicket {
    _id: ObjectId;
    requestedBy: "client" | "artist";
    requestedAt: ISODate;
    reason: string;
    status: "pending" | "accepted" | "rejected" | "escalated" | "resolved";
    respondBy?: ISODate;
    workPercentComplete?: number;
    artistPayout?: Cents;
    clientRefund?: Cents;
  }
  export const CancelTicketSchema = new Schema<CancelTicket>(
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

/* 5c ▸ Change  (restricted payload) */
export interface ChangeSet {
  deadlineAt?: ISODate;
  generalOptions?: Record<string, unknown>;
  subjectOptions?: Record<string, unknown>;
}

export interface ChangeTicket {
  _id: ObjectId;
  requestedBy: "client" | "artist";
  requestedAt: ISODate;
  changeSet: ChangeSet;
  reason: string;
  status: "draft" | "pending" | "accepted" | "rejected" | "applied" | "cancelled";
  respondBy?: ISODate;
  paidFee?: Cents;
  transactionId?: ObjectId;
  appliedAt?: ISODate;
  contractVersionAfter?: number;
}

export const ChangeTicketSchema = new Schema<ChangeTicket>(
  {
    _id:{ type:Schema.Types.ObjectId, default:() => new Types.ObjectId() },
    requestedBy:{ type:String, enum:["client","artist"], required:true },
    requestedAt:{ type:Date, default:Date.now },

    changeSet:{
      deadlineAt:Date,
      generalOptions:Schema.Types.Mixed,
      subjectOptions:Schema.Types.Mixed
    },

    reason:{ type:String, required:true },
    status:{ type:String, enum:[
      "draft","pending","accepted","rejected","applied","cancelled"
    ], default:"draft" },
    respondBy:Date,
    paidFee:Number,
    transactionId:Schema.Types.ObjectId,
    appliedAt:Date,
    contractVersionAfter:Number
  },
  { _id:false }
);

/* 5d ▸ Resolution – unchanged */
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
  export const ResolutionTicketSchema = new Schema<ResolutionTicket>(
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
