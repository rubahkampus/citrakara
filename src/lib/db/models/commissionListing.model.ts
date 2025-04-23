// src/lib/db/models/commissionListing.model.ts
// ------------------------------------------------------------
// CommissionListing (IMMUTABLE catalogue entry)
// ------------------------------------------------------------
//  • One document per commission sheet an artist publishes
//  • NO runtime state is stored here – orders reference a snapshot
//  • Renaming:  options ➜ generalOptions, subjects ➜ subjectOptions,
//               groups ➜ optionGroups  (clearer semantics)
// ------------------------------------------------------------

import { Schema, model, models, Document } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";

/* -----------------------------------------------------------
   RevisionPolicy – inlined because it is referenced ONLY here
   and in Order snapshots.
-------------------------------------------------------------*/
export interface RevisionPolicy {
  /** Hard cap?  false = unlimited revisions */
  limit: boolean;
  /** # of free revisions before fee */
  free: number;
  /** Can client pay beyond the cap? */
  extraAllowed: boolean;
  /** Fee per extra revision (rupiah‑cents) */
  fee: Cents;
}

/* -----------------------------------------------------------
   1. TS Interface (for service / API layer)
-------------------------------------------------------------*/
export interface ICommissionListing extends Document {
  _id: ObjectId;
  artistId: ObjectId;

  // ─── Public copy ──────────────────────────────────────────
  title: string;
  description: { title: string; detail: string }[];
  tags: string[];
  thumbnail: string;
  samples: string[];

  // ─── Admin / state flags ─────────────────────────────────
  isActive: boolean;
  isDeleted: boolean;

  // ─── Capacity ────────────────────────────────────────────
  slots: number; // −1 = unlimited
  slotsUsed: number;
  counters: {
    activeOrders: ObjectId[]; // orderIds
    pendingOrders: ObjectId[]; // proposalIds
  };

  tos: string; // link to TOS page / doc

  // ─── Classification ─────────────────────────────────────
  type: "template" | "custom";
  flow: "standard" | "milestone";

  // ─── Timing / rush ───────────────────────────────────────
  deadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number; // days
    max: number; // days
    rushFee?: { type: "flat" | "perDay"; amount: Cents };
  };

  // ─── Financial guardrails ───────────────────────────────
  basePrice?: Cents
  price: { min: Cents; max: Cents }; // calculated from basePrice + options
  cancelationFee: { type: "flat" | "percentage"; amount: number };
  latePenaltyPercent?: number; // hardcode 10%
  graceDays?: number; // hardcode 7 days
  currency: string; // ISO‑4217, default "IDR"

  // ─── Client‑side edit toggles ────────────────────────────
  allowContractChange: boolean;
  changeable?: Array<"deadline" | "generalOptions" | "subjectOptions">;

  // ─── Revision policy snapshot ────────────────────────────
  revisions?: {
    type: "none" | "standard" | "milestone";
    policy?: RevisionPolicy; // if revision type = standard only
  };

  // ─── Milestone template (flow = milestone) ──────────────
  milestones?: Array<{
    title: string; // e.g. "Sketch", "Lineart", "Color"
    percent: number; // 0-100
    policy?: RevisionPolicy; // if revision type = milestone only
  }>;

  /* ---------------- OPTION MATRIX ------------------------ */
  /** Meta / off‑canvas add‑ons */
  // General options 
  generalOptions?: {
    optionGroups?: Array<{
      title: string; // e.g. "Copyright", "Commercial use", "NSFW"
      selections: { label: string; price: Cents }[]; // e.g. "Full rights", "Partial rights", "No rights"
    }>;
    addons?: { label: string; price: Cents }[]; // e.g. "Stream my commission"
    questions?: string[];             // extra questions not tied to group
  };

  /** On‑canvas pricing such as characters, backgrounds … */
  // Only if flow = custom
  // Subject options
  subjectOptions?: Array<{
    title: string; // e.g. "Character", "Background", "Props"
    limit: number; // default 1, -1 = unlimited
    discount?: number; // e.g. 10% off for 2+ characters
    optionGroups?: Array<{
      title: string; // e.g. "Cropping"
      selections: { label: string; price: Cents }[]; // e.g. "Full body", "Half body", "Bust"
    }>;
    addons?: Array<{ label: string; price: Cents }>; // e.g. "Add Clothing"
    questions?: string[];            // extra questions, e.g. "Describe chracter's pose"
  }>;

  /* ----- Aggregated reviews (read‑only) ------------------ */
  reviewsSummary: { avg: number; count: number };

  createdAt: ISODate;
  updatedAt: ISODate;
}

/* -----------------------------------------------------------
   2. Mongoose Schema
-------------------------------------------------------------*/
const CounterSchema = new Schema(
  {
    activeOrders: [{ type: Schema.Types.ObjectId, ref: "Order", default: [] }],
    pendingOrders: [
      { type: Schema.Types.ObjectId, ref: "Proposal", default: [] },
    ],
  },
  { _id: false }
);

const CommissionListingSchema = new Schema<ICommissionListing>(
  {
    artistId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true },
    description: [
      {
        title: { type: String, required: true },
        detail: { type: String, required: true },
      },
    ],
    tags: { type: [String], default: [] },
    thumbnail: { type: String, required: true },
    samples: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    slots: { type: Number, default: -1 },
    slotsUsed: { type: Number, default: 0 },
    counters: { type: CounterSchema, default: () => ({}) },

    tos: { type: String, required: true },

    type: { type: String, enum: ["template", "custom"], required: true },
    flow: { type: String, enum: ["standard", "milestone"], required: true },

    deadline: {
      mode: {
        type: String,
        enum: ["standard", "withDeadline", "withRush"],
        required: true,
      },
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      rushFee: {
        type: {
          type: String,
          enum: ["flat", "perDay"],
        },
        amount: Number,
      },
    },

    price: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },

    cancelationFee: {
      type: { type: String, enum: ["flat", "percentage"], required: true },
      amount: { type: Number, required: true },
    },
    latePenaltyPercent: Number,
    graceDays: { type: Number, default: 7 },
    currency: { type: String, default: "IDR" },

    allowContractChange: { type: Boolean, default: true },
    changeable: { type: [String], default: [] },

    revisions: {
      type: {
        type: String,
        enum: ["none", "standard", "milestone"],
      },
      policy: { type: Schema.Types.Mixed },
    },

    milestones: [
      { title: String, percent: Number, policy: Schema.Types.Mixed },
    ],

    generalOptions: Schema.Types.Mixed,
    subjectOptions: Schema.Types.Mixed,

    reviewsSummary: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

/* -----------------------------------------------------------
   Indexes for search & listing
-------------------------------------------------------------*/
CommissionListingSchema.index({ artistId: 1, isActive: 1 });
CommissionListingSchema.index({ tags: 1 });
CommissionListingSchema.index({ title: "text", "description.detail": "text" });

export default models.CommissionListing ||
  model<ICommissionListing>("CommissionListing", CommissionListingSchema);
