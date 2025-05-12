// src/lib/db/models/ticket.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import {
  ProposalGeneralOptionsSchema,
  ProposalSubjectSchema,
} from "./proposal.model";

/* ---------------------------------------------------------------------------
   CancelTicket – client‑or‑artist request to terminate the contract early.
   Approves/rejects, may escalate; actual payout is handled by FinalUpload +
   contract.cancelSummary after ticket status = accepted/acceptedDisputed.
--------------------------------------------------------------------------- */
export interface ICancelTicket extends Document {
  _id: ObjectId;

  contractId: ObjectId;

  requestedBy: "client" | "artist"; // who opened the ticket
  reason: string; // free‑text justification

  status:
    | "pending" // waiting for other party's response
    | "accepted" // EOL | cancellation mutually agreed
    | "forcedAccepted" // EOL | admin forced acceptance
    | "rejected" // EOL except disputed before expired | except disputed before expired | declined by the other party
    | "disputed"; // auto-escalated due to expiry or disagreement

  createdAt: ISODate; // ticket opened
  expiresAt: ISODate; // Cancellation is void if it does not end the reach the EOL in 48H  and becomes uninteractable other than dispute escalation and becomes uninteractable
  resolvedAt?: ISODate; // When EOL is reached successfully -> move to FinalUpload model
}

/* ---------------------------------------------------------------------------
   RevisionTicket – client asks for a change to delivered work. May cost extra.
   Flow: pending → accepted → (optional) paid → artist delivers RevisionUpload.
--------------------------------------------------------------------------- */
export interface IRevisionTicket extends Document {
  _id: ObjectId;

  contractId: ObjectId;

  milestoneIdx?: number | undefined; // if we're using flow == milestone and revision.type == milestone, undefined if revision type == standard
  description: string; // what client wants changed
  referenceImages?: string[]; // visual refs

  status:
    | "pending" // waiting on artist response
    | "accepted" // artist agreed to do revision
    | "forcedAcceptedArtist" // admin forced artist to revise, move to finalizedFree if free, if paid, wait for payment
    | "rejected" // EOL except disputed before expired | artist refused revision
    | "paid" // EOL | client paid any required fee
    | "cancelled" // EOL | withdrawn before payment
    | "disputed"; // client escalated further

  resolved: boolean; // set true once upload accepted / flow ends
  artistRejectionReason?: string; // filled if status = rejected

  paidFee?: Cents | undefined; // fee per listing rules if paid, undefined if free
  escrowTxnId?: ObjectId; // Escrow row for that fee

  createdAt: ISODate; // ticket opened
  expiresAt: ISODate; // Revision is void if it does not end the reach the EOL in 48H  and becomes uninteractable other than dispute escalation
  resolvedAt?: ISODate; //  When EOL is reached successfully -> move to RevisionUpload model, track the revision in milestone or revision in IContract
}

/* ---------------------------------------------------------------------------
   ChangeTicket – client proposes spec/price changes post‑contract.  
   Artist may accept, reject, or add a surcharge.  
--------------------------------------------------------------------------- */
export interface IChangeTicket extends Document {
  _id: ObjectId;

  contractId: ObjectId;

  createdAt: ISODate; // ticket opened
  expiresAt?: ISODate; // Change is void if it does not end the reach the EOL in 48H  and becomes uninteractable other than dispute escalation

  reason: string; // client's explanation
  changeSet: {
    // requested diffs
    deadlineAt?: ISODate;
    generalDescription: string;
    referenceImages: string[];
    generalOptions?: ProposalGeneralOptions;
    subjectOptions?: ProposalSubjectOptions;
  };

  status:
    | "pendingArtist" // waiting on artist action
    | "pendingClient" // artist proposed surcharge, waiting on client
    | "acceptedArtist" // artist OK -> if no surcharge proposed, it's auto to paid, if surcharge proposed, move to pendingClient
    | "rejectedArtist" // EOL except disputed before expired | artist said no
    | "rejectedClient" //  can be disputed before expired | client declined surcharge -> practically back at pendingArtist
    | "forcedAcceptedClient" // admin forced client to pay the artist proposed surcharge
    | "forcedAcceptedArtist" // admin forced artist to revise with paidFee determined by admin and client to pay
    | "paid" // EOL | fee (if any) paid, change auto‑applied
    | "cancelled"; // EOL | withdrawn or expired draft

  isPaidChange: boolean; // if artist proposed surcharge
  paidFee?: Cents; // surcharge amount, proposed by artist
  escrowTxnId?: ObjectId; // Escrow row for surcharge

  resolvedAt?: ISODate; // contract actually mutated
  contractVersionBefore?: number; // old version
  contractVersionAfter?: number; // version bump after apply
}

/* ---------------------------------------------------------------------------
   ResolutionTicket - MUTABLE – single escalation vehicle for ALL disputes.
   • Can target a CancelTicket, RevisionTicket, FinalUpload, or Milestone upload.
   • Flow: 
       open  → (counterparty may add proof within 24 h) → awaitingReview → resolved
       OR    → cancelled automatically if the original item resolves first.
   • Admin decides outcome once both proofs present or the counter window expires.
--------------------------------------------------------------------------- */
export interface IResolutionTicket extends Document {
  _id: ObjectId;

  /* ----- linkage ----- */
  contractId: ObjectId; // parent contract (1‑to‑many)
  submittedBy: "client" | "artist"; // who opened the dispute
  submittedById: ObjectId; // user id of opener

  /* the object being challenged */
  targetType: "cancel" | "revision" | "final" | "milestone"; // entity class
  targetId: ObjectId; // id of that entity

  /* ----- initiator proof ----- */
  description: string; // why they think it's wrong
  proofImages?: string[]; // URLs (e.g. screenshots)

  /* ----- counter‑proof ----- */
  counterparty: "client" | "artist"; // who may respond
  counterDescription?: string; // response text
  counterProofImages?: string[]; // their evidence
  counterExpiresAt: ISODate; // 24 h after ticket creation

  /* ----- dispute workflow status ----- */
  status:
    | "open" // waiting for counterparty proof / timer running
    | "awaitingReview" // both proofs in OR counter expired → admin time
    | "resolved" // admin issued decision
    | "cancelled"; // original ticket/upload resolved → dispute moot

  /* ----- admin ruling (filled when status = resolved) ----- */
  decision?: "favorClient" | "favorArtist"; // result
  resolutionNote?: string; // moderator reasoning
  resolvedBy?: ObjectId; // admin/mod id
  resolvedAt?: ISODate; // final timestamp

  createdAt: ISODate; // dispute opened
}

// Type import for ChangeTicket
interface ProposalGeneralOptions {
  // Add any properties from the original interface
  [key: string]: any;
}

interface ProposalSubjectOptions {
  // Add any properties from the original interface
  [key: string]: any;
}

// Schema for CancelTicket
const CancelTicketSchema = new Schema<ICancelTicket>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    requestedBy: {
      type: String,
      enum: ["client", "artist"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "forcedAccepted", "rejected", "disputed"],
      default: "pending",
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

// Schema for RevisionTicket
const RevisionTicketSchema = new Schema<IRevisionTicket>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    milestoneIdx: {
      type: Number,
    },
    description: {
      type: String,
      required: true,
    },
    referenceImages: {
      type: [String],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "forcedAcceptedArtist",
        "rejected",
        "paid",
        "cancelled",
        "disputed",
      ],
      default: "pending",
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
      required: true,
    },
    artistRejectionReason: {
      type: String,
    },
    paidFee: {
      type: Number,
    },
    escrowTxnId: {
      type: Schema.Types.ObjectId,
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

// Schema for ChangeTicket
const ChangeTicketSchema = new Schema<IChangeTicket>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    changeSet: {
      deadlineAt: {
        type: Date,
      },
      generalDescription: {
        type: String,
        required: true,
      },
      referenceImages: {
        type: [String],
        required: true,
      },
      generalOptions: { type: ProposalGeneralOptionsSchema, default: {} },
      subjectOptions: { type: [ProposalSubjectSchema], default: [] },
    },
    status: {
      type: String,
      enum: [
        "pendingArtist",
        "pendingClient",
        "acceptedArtist",
        "rejectedArtist",
        "rejectedClient",
        "forcedAcceptedClient",
        "forcedAcceptedArtist",
        "paid",
        "cancelled",
      ],
      default: "pendingArtist",
      required: true,
    },
    isPaidChange: {
      type: Boolean,
      required: true,
    },
    paidFee: {
      type: Number,
    },
    escrowTxnId: {
      type: Schema.Types.ObjectId,
    },
    expiresAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    contractVersionBefore: {
      type: Number,
    },
    contractVersionAfter: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Schema for ResolutionTicket
const ResolutionTicketSchema = new Schema<IResolutionTicket>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Contract",
    },
    submittedBy: {
      type: String,
      enum: ["client", "artist"],
      required: true,
    },
    submittedById: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    targetType: {
      type: String,
      enum: ["cancel", "revision", "final", "milestone"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    proofImages: {
      type: [String],
    },
    counterparty: {
      type: String,
      enum: ["client", "artist"],
      required: true,
    },
    counterDescription: {
      type: String,
    },
    counterProofImages: {
      type: [String],
    },
    counterExpiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "awaitingReview", "resolved", "cancelled"],
      default: "open",
      required: true,
    },
    decision: {
      type: String,
      enum: ["favorClient", "favorArtist"],
    },
    resolutionNote: {
      type: String,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create and export the models
export const CancelTicket =
  models.CancelTicket ||
  model<ICancelTicket>("CancelTicket", CancelTicketSchema);
export const RevisionTicket =
  models.RevisionTicket ||
  model<IRevisionTicket>("RevisionTicket", RevisionTicketSchema);
export const ChangeTicket =
  models.ChangeTicket ||
  model<IChangeTicket>("ChangeTicket", ChangeTicketSchema);
export const ResolutionTicket =
  models.ResolutionTicket ||
  model<IResolutionTicket>("ResolutionTicket", ResolutionTicketSchema);
