// src/lib/db/models/upload.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate } from "@/types/common";

/* ---------------------------------------------------------------------------
   ProgressUploadStandard – casual progress post in standard flow. No review. - USED IN STANDARD FLOW
--------------------------------------------------------------------------- */
export interface IProgressUploadStandard extends Document {
  _id: ObjectId;
  kind: "progressStandard";

  contractId: ObjectId;
  artistId: ObjectId;

  images: string[]; // CDN / S3 URLs
  description?: string; // optional commentary

  createdAt: ISODate; // immutable timestamp
}

/* ---------------------------------------------------------------------------
   ProgressUploadMilestone - ONLY STATUS CAN BE CHANGED, ELSE IMMUTABLE – update or final submission for a milestone.
   If isFinal = true  → client must approve/reject (`status` is required). - USED IN MILESTONE FLOW
--------------------------------------------------------------------------- */
export interface IProgressUploadMilestone extends Document {
  _id: ObjectId;
  kind: "progressMilestone";

  contractId: ObjectId;
  milestoneIdx: number; // which milestone
  artistId: ObjectId;

  isFinal: boolean; // marks milestone completion

  images: string[];
  description?: string;

  status?: // statuses only present if isFinal=true
  | "submitted" // waiting for client
    | "accepted" // EOL | accepted by client or auto
    | "rejected" // EOL except disputed before expired | client rejected
    | "forcedAccepted" // EOL | admin forced accept
    | "disputed"; // client escalated to admin

  createdAt: ISODate;
  expiresAt: ISODate; // auto‑accept in 24H, to prevent client missing
  closedAt?: ISODate; // When EOL is reached successfully
}

/* ---------------------------------------------------------------------------
   FinalUpload - ONLY STATUS CAN BE CHANGED, ELSE IMMUTABLE – last delivery (or cancel proof). Always reviewed.
--------------------------------------------------------------------------- */
export interface IFinalUpload extends Document {
  _id: ObjectId;
  kind: "final";

  contractId: ObjectId;

  images: string[]; // main delivery or cancel proof
  description?: string; // optional explanation or notes

  status:
    | "submitted" // waiting for client
    | "accepted" // EOL | accepted by client or auto
    | "rejected" // EOL except disputed before expired | client rejected
    | "forcedAccepted" // EOL | admin forced client to accept
    | "disputed"; // client escalated to admin

  /**
   * Declared progress percentage:
   * - 100 = standard final delivery
   * - <100 = cancel proof delivery
   * - For milestone contracts: inferred from last completed milestone as a default, or can input manually too
   * - For standard contracts: artist must input manually if cancelling
   */

  workProgress: number; // 100% normal, <100% if in cancellation
  cancelTicketId?: ObjectId; // links to CancelTicket if tied to cancellation

  createdAt: ISODate;
  expiresAt: ISODate; // auto‑accept in 24H, to prevent client missing
  closedAt?: ISODate; // When EOL is reached successfully
}

/* ---------------------------------------------------------------------------
   RevisionUpload - ONLY STATUS CAN BE CHANGED, ELSE IMMUTABLE – artist's response to a RevisionTicket. Reviewed by client.
--------------------------------------------------------------------------- */
export interface IRevisionUpload extends Document {
  _id: ObjectId;

  contractId: ObjectId;
  revisionTicketId: ObjectId; // parent ticket
  artistId: ObjectId;

  images: string[];
  description?: string;

  status:
    | "submitted" // waiting for client
    | "accepted" // EOL | accepted by client or auto
    | "rejected" // EOL except disputed before expired | client rejected
    | "forcedAccepted" // EOL | admin forced client to accept
    | "disputed"; // escalated by client or artist

  createdAt: ISODate; // upload time
  expiresAt: ISODate; // auto‑accept in 24H, to prevent client missing
  resolvedAt?: ISODate; // When EOL is reached successfully
}

// Schema for ProgressUploadStandard
const ProgressUploadStandardSchema = new Schema<IProgressUploadStandard>(
  {
    kind: {
      type: String,
      default: "progressStandard",
      enum: ["progressStandard"],
      required: true,
    },
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Contract",
    },
    artistId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    images: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

// Schema for ProgressUploadMilestone
const ProgressUploadMilestoneSchema = new Schema<IProgressUploadMilestone>(
  {
    kind: {
      type: String,
      default: "progressMilestone",
      enum: ["progressMilestone"],
      required: true,
    },
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Contract",
    },
    milestoneIdx: {
      type: Number,
      required: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isFinal: {
      type: Boolean,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected", "forcedAccepted", "disputed"],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Schema for FinalUpload
const FinalUploadSchema = new Schema<IFinalUpload>(
  {
    kind: {
      type: String,
      default: "final",
      enum: ["final"],
      required: true,
    },
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Contract",
    },
    images: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected", "forcedAccepted", "disputed"],
      default: "submitted",
      required: true,
    },
    workProgress: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    cancelTicketId: {
      type: Schema.Types.ObjectId,
      ref: "CancelTicket",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Schema for RevisionUpload
const RevisionUploadSchema = new Schema<IRevisionUpload>(
  {
    revisionTicketId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RevisionTicket",
    },
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Contract",
    },
    artistId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    images: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected", "forcedAccepted", "disputed"],
      default: "submitted",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create and export the models
export const ProgressUploadStandard =
  models.ProgressUploadStandard ||
  model<IProgressUploadStandard>(
    "ProgressUploadStandard",
    ProgressUploadStandardSchema
  );
export const ProgressUploadMilestone =
  models.ProgressUploadMilestone ||
  model<IProgressUploadMilestone>(
    "ProgressUploadMilestone",
    ProgressUploadMilestoneSchema
  );
export const FinalUpload =
  models.FinalUpload || model<IFinalUpload>("FinalUpload", FinalUploadSchema);
export const RevisionUpload =
  models.RevisionUpload ||
  model<IRevisionUpload>("RevisionUpload", RevisionUploadSchema);
