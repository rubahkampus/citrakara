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
const RevisionPolicySchema = new Schema<RevisionPolicy>(
  {
    limit: { type: Boolean, required: true },
    free: { type: Number, required: true },
    extraAllowed: { type: Boolean, required: true },
    fee: { type: Number, required: true },
  },
  { _id: false }
);

/* -----------------------------------------------------------
   Option selection and grouping sub-schemas
-------------------------------------------------------------*/
const OptionSelectionSchema = new Schema<{ label: string; price: Cents }>(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OptionGroupSchema = new Schema<{
  title: string;
  selections: { label: string; price: Cents }[];
}>(
  {
    title: { type: String, required: true },
    selections: { type: [OptionSelectionSchema], default: [] },
  },
  { _id: false }
);

const AddonSchema = new Schema<{ label: string; price: Cents }>(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

/* -----------------------------------------------------------
   GeneralOptions as explicit sub-schema (no Mixed)
-------------------------------------------------------------*/
const GeneralOptionsSchema = new Schema<{
  optionGroups?: (typeof OptionGroupSchema)[];
  addons?: (typeof AddonSchema)[];
  questions?: string[];
}>(
  {
    optionGroups: { type: [OptionGroupSchema], default: [] },
    addons: { type: [AddonSchema], default: [] },
    questions: { type: [String], default: [] },
  },
  { _id: false }
);

/* -----------------------------------------------------------
   SubjectOptions sub-schema (custom flow)
-------------------------------------------------------------*/
const SubjectOptionGroupSchema = new Schema<{
  title: string;
  selections: { label: string; price: Cents }[];
}>(
  {
    title: { type: String, required: true },
    selections: { type: [OptionSelectionSchema], default: [] },
  },
  { _id: false }
);

const SubjectOptionsSchema = new Schema<{
  title: string;
  limit: number;
  discount?: number;
  optionGroups?: (typeof SubjectOptionGroupSchema)[];
  addons?: (typeof AddonSchema)[];
  questions?: string[];
}>(
  {
    title: { type: String, required: true },
    limit: { type: Number, required: true, default: 1 },
    discount: { type: Number, default: 0 },
    optionGroups: { type: [SubjectOptionGroupSchema], default: [] },
    addons: { type: [AddonSchema], default: [] },
    questions: { type: [String], default: [] },
  },
  { _id: false }
);

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
  thumbnailIdx: number;
  samples: string[];

  // ─── Admin / state flags ─────────────────────────────────
  isActive: boolean;
  isDeleted: boolean;

  // ─── Capacity ────────────────────────────────────────────
  slots: number; // −1 = unlimited
  slotsUsed: number; // active + pending orders

  tos: string; // link to TOS page / doc

  // ─── Classification ─────────────────────────────────────
  type: "template" | "custom";
  flow: "standard" | "milestone";

  // ─── Timing / rush ───────────────────────────────────────
  deadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number; // days
    max: number; // days
    rushFee?: { kind: "flat" | "perDay"; amount: Cents };
  };

  // ─── Financial guardrails ───────────────────────────────
  basePrice: Cents; // Changed from optional to required
  price: { min: Cents; max: Cents }; // calculated from basePrice + options
  cancelationFee: { kind: "flat" | "percentage"; amount: number }; // Changed 'type' to 'kind'
  latePenaltyPercent?: number; // hardcode 10%
  graceDays?: number; // hardcode 7 days
  currency: string; // ISO‑4217, default "IDR"

  // ─── Client‑side edit toggles ────────────────────────────
  allowContractChange: boolean;
  changeable?: Array<
    | "deadline"
    | "generalOptions"
    | "subjectOptions"
    | "description"
    | "generalDescription"
    | "referenceImages"
  >;

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
    questions?: string[]; // extra questions not tied to group
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
    questions?: string[]; // extra questions, e.g. "Describe chracter's pose"
  }>;

  /* ----- Aggregated reviews (read‑only) ------------------ */
  reviewsSummary: { avg: number; count: number };

  createdAt: ISODate;
  updatedAt: ISODate;
}

/* -----------------------------------------------------------
   2. Mongoose Schema
-------------------------------------------------------------*/

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
    thumbnailIdx: { type: Number, required: true },
    samples: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    slots: { type: Number, default: -1 },
    slotsUsed: { type: Number, default: 0 },

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
        kind: { // Changed from 'type' to 'kind'
          type: String,
          enum: ["flat", "perDay"],
          required: function () {
            return this.deadline.mode === "withRush";
          },
        },
        amount: {
          type: Number,
          required: function () {
            return this.deadline.mode === "withRush";
          },
        },
      },
    },

    basePrice: { type: Number, default: 0, required: true },

    price: {
      min: { type: Number, required: true, default: 0 }, // calculated from basePrice + cheapest options
      max: { type: Number, required: true, default: 0 }, // calculated from basePrice + most expensive options + all possible addons
    },

    cancelationFee: {
      kind: { type: String, enum: ["flat", "percentage"], required: true }, // Changed from 'type' to 'kind'
      amount: { type: Number, required: true },
    },
    latePenaltyPercent: { type: Number, default: 10 },
    graceDays: { type: Number, default: 7 },
    currency: { type: String, default: "IDR" },

    allowContractChange: { type: Boolean, default: true },
    changeable: { type: [String], default: [] },

    revisions: {
      type: {
        type: String,
        enum: ["none", "standard", "milestone"],
        default: "none",
      },
      policy: {
        type: RevisionPolicySchema,
        required: function () {
          return this.revisions?.type === "standard";
        },
        validate: {
          validator: function(value: any) {
            // Reject policy if type is 'none' or 'milestone'
            return this.revisions?.type === "standard" || !value;
          },
          message: "Revision policy should only be provided when type is 'standard'"
        }
      },
    },
    milestones: [
      new Schema<{ title: string; percent: number; policy?: RevisionPolicy }>(
        {
          title: { type: String, required: true },
          percent: { type: Number, required: true, min: 0, max: 100 },
          policy: RevisionPolicySchema,
        },
        { _id: false }
      ),
    ],
    generalOptions: { type: GeneralOptionsSchema, default: () => ({}) },
    subjectOptions: { type: [SubjectOptionsSchema], default: [] },
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