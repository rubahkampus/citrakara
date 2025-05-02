// src/lib/db/models/proposal.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";

export interface IProposal extends Document {
  _id: ObjectId;

  /* ---- relationships ---- */
  clientId: ObjectId;
  artistId: ObjectId;
  listingId: ObjectId;

  /* ---- immutable listing snapshot (audit) ---- */
  listingSnapshot: Omit<ICommissionListing, "_id" | "createdAt" | "updatedAt">;

  /* ---- lifecycle status ----
     draft        – client still editing (never stored if you skip)
     pending      – client hit “Submit”; 72 h SLA
     negotiating  – artist proposed price tweaks
     accepted     – artist accepted + invoice finalised
     rejected     – artist clicked reject
     expired      – client marked no-response after SLA
  ---------------------------------------------- */
  status:
    | "draft"
    | "pending"
    | "negotiating"
    | "accepted"
    | "rejected"
    | "expired";
  expiresAt?: ISODate; // present in pending / negotiating

  /* ---- dynamic availability window ---- */
  availability: {
    earliestDate: ISODate; // dynamicMin
    latestDate: ISODate; // dynamicMax
  };
  deadline: ISODate; // chosen by client

  /* ---- rush details (auto-computed) ---- */
  rush?: {
    days: number; // latestDate - deadline
    paidDays?: number; // earliestDate - deadline (negative)
    fee?: Cents; // added to price
  };

  /* ---- brief & refs ---- */
  generalDescription: string;
  referenceImages: string[]; // ≤ 5

  /* ---- option selections ---- */
  generalOptions?: {
    toggles?: Record<string, boolean | number>; // simple toggles keyed by id
    answers?: Record<string, string>; // questionId → answer
  };

  subjectOptions?: {
    [subjectGroupId: string]: {
      selectionIds: string[]; // e.g. pose+finish cells
      addons?: string[]; // add-ons ids
      answers?: Record<string, string>;
    };
  };

  /* ---- price computation ---- */
  calculatedPrice: {
    base: Cents;
    optionGroups: Cents;
    addons: Cents;
    rush: Cents;
    discount: Cents; // client-side coupons
    surcharge: Cents; // artist adjustments
    total: Cents; // final amount due
  };

  /* ---- artist adjustments (before accept) ---- */
  artistAdjustments?: {
    surcharge?: { amount: Cents; reason: string };
    discount?: { amount: Cents; reason: string };
  };

  /* ---- rejection meta ---- */
  rejectionReason?: string;

  /* timestamps */
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** ---- Sub-schemas for clearer validation ---- */
const GeneralOptionsSchema = new Schema(
  {
    toggles: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

const SubjectOptionSchema = new Schema(
  {
    selectionIds: { type: [String], required: true },
    addons: { type: [String], default: [] },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

const ProposalSchema = new Schema<IProposal>(
  {
    /* relationships */
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "CommissionListing",
      required: true,
    },

    /* status */
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "negotiating",
        "accepted",
        "rejected",
        "expired",
      ],
      default: "draft",
    },
    expiresAt: { type: Date },

    /* listing snapshot */
    listingSnapshot: { type: Schema.Types.Mixed, required: true },

    /* availability + deadline */
    availability: {
      earliestDate: { type: Date, required: true },
      latestDate: { type: Date, required: true },
    },
    deadline: { type: Date, required: true },

    /* rush info */
    rush: {
      days: { type: Number },
      paidDays: { type: Number },
      fee: { type: Number },
    },

    /* brief */
    generalDescription: { type: String, required: true },
    referenceImages: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: "You can attach up to 5 reference images only",
      },
    },

    /* general & subject option selections */
    generalOptions: { type: GeneralOptionsSchema, default: {} },
    subjectOptions: {
      type: Map,
      of: SubjectOptionSchema,
      default: {},
    },

    /* price breakdown */
    calculatedPrice: {
      base: { type: Number, required: true, default: 0 },
      optionGroups: { type: Number, required: true, default: 0 },
      addons: { type: Number, required: true, default: 0 },
      rush: { type: Number, required: true, default: 0 },
      discount: { type: Number, required: true, default: 0 },
      surcharge: { type: Number, required: true, default: 0 },
      total: { type: Number, required: true, default: 0 },
    },

    artistAdjustments: {
      surcharge: {
        amount: { type: Number },
        reason: { type: String },
      },
      discount: {
        amount: { type: Number },
        reason: { type: String },
      },
    },

    rejectionReason: { type: String },
  },
  { timestamps: true }
);

/* helpful indexes */
ProposalSchema.index({ artistId: 1, status: 1 });
ProposalSchema.index({ clientId: 1, status: 1 });
ProposalSchema.index({ listingId: 1 });
ProposalSchema.index({ expiresAt: 1 });
ProposalSchema.index(
  { expiresAt: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ["pending", "negotiating"] } } }
);

export default models.Proposal || model<IProposal>("Proposal", ProposalSchema);
