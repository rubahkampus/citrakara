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
export const RevisionPolicySchema = new Schema<RevisionPolicy>(
  {
    limit: { type: Boolean, required: true },
    free: { type: Number, required: true },
    extraAllowed: { type: Boolean, required: true },
    fee: { type: Number, required: true },
  },
  { _id: false }
);

// -----------------------------------------------------------
//   Option selection and grouping sub-schemas
// -----------------------------------------------------------
export type ID = number;

export interface ISelection {
  id: ID;
  label: string;
  price: Cents;
}
export interface IOptionGroup {
  id: ID;
  title: string;
  selections: ISelection[];
}
export interface IAddon {
  id: ID;
  label: string;
  price: Cents;
}
export interface IQuestion {
  id: ID;
  text: string;
}

export const SelectionSchema = new Schema<ISelection>(
  { id: Number, label: String, price: Number },
  { _id: false }
);

export const OptionGroupSchema = new Schema<IOptionGroup>(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    selections: { type: [SelectionSchema], default: [] },
  },
  { _id: false }
);

export const AddonSchema = new Schema<IAddon>(
  { id: Number, label: String, price: Number },
  { _id: false }
);

export const QuestionSchema = new Schema<IQuestion>(
  { id: Number, text: String },
  { _id: false }
);

/* -----------------------------------------------------------
   GeneralOptions as explicit sub-schema (no Mixed)
-------------------------------------------------------------*/
const GeneralOptionsSchema = new Schema<{
  optionGroups?: {
    id: ID;
    title: string;
    selections: { id: ID; label: string; price: Cents }[];
  }[];
  addons?: { id: ID; label: string; price: Cents }[];
  questions?: { id: ID; text: string }[];
}>(
  {
    optionGroups: { type: [OptionGroupSchema], default: [] },
    addons: { type: [AddonSchema], default: [] },
    questions: { type: [QuestionSchema], default: [] },
  },
  { _id: false }
);

/* -----------------------------------------------------------
   SubjectOptions sub-schema (custom flow)
-------------------------------------------------------------*/
const SubjectOptionSchema = new Schema<{
  id: ID;
  title: string;
  limit: number;
  discount?: number;
  optionGroups?: {
    id: ID;
    title: string;
    selections: { id: ID; label: string; price: Cents }[];
  }[];
  addons?: { id: ID; label: string; price: Cents }[];
  questions?: { id: ID; text: string }[];
}>(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    limit: { type: Number, required: true, default: 1 },
    discount: { type: Number, default: 0 },
    optionGroups: { type: [OptionGroupSchema], default: [] },
    addons: { type: [AddonSchema], default: [] },
    questions: { type: [QuestionSchema], default: [] },
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
    mode:
      | "standard" // Deadline will always be baseDate (calculated based on the latest deadline in all of the artist active contracts) + max + 14 days
      | "withDeadline" // Deadline can be choosen as long as it does not fall behind baseDate + min
      | "withRush"; // Deadline can be choosen and it can fall behind baseDate + min, but fee will apply
    min: number; // minimum days to complete order
    max: number; // maximum days to complete order
    rushFee?: {
      kind:
        | "flat" // fee is flat
        | "perDay"; // fee is counted based on amount * days behind baseDate + min
      amount: Cents;
    }; // For mode == "withRush"
  };

  // ─── Financial guardrails ───────────────────────────────
  basePrice: Cents; // base price of commission, can be 0
  price: { min: Cents; max: Cents }; // calculated from basePrice + options
  cancelationFee: {
    kind:
      | "flat" // Amount is IDR of fee
      | "percentage"; // Amount is 0-100 (percentage)
    amount: number;
  }; // Changed 'type' to 'kind'

  latePenaltyPercent?: number; // 0-100, For now it's hardcoded to 10%
  graceDays?: number; // For now it's hardcode 7 days
  currency: string; // ISO‑4217, default "IDR"

  // ─── Client‑side edit toggles ────────────────────────────
  allowContractChange: boolean;
  // List of changeable stuff on the proposal that can be changed while contract is underway
  changeable?: Array<
    | "deadline"
    | "generalDescription"
    | "referenceImages"
    | "generalOptions"
    | "subjectOptions" 
  >;

  // ─── Revision policy snapshot ────────────────────────────
  revisions?: {
    type: 
    "none" // No revision 
    | "standard" // Revision is standard, can be in flow == milestone | standard, policy apply to the whole contract as a whole, ( e.g. using a slot in any step of the milestone will subtract the available slot as a whole)
    | "milestone"; // Only in flow == milestone, every milestone steps has its own policy
    policy?: RevisionPolicy; // if revision type = standard only
  };

  // ─── Milestone template (flow = milestone) ──────────────
  milestones?: Array<{
    id: ID;
    title: string; // e.g. "Sketch", "Lineart", "Color"
    percent: number; // 0-100
    policy?: RevisionPolicy; // if revision type = milestone only
  }>;

  /* ---------------- OPTION MATRIX ------------------------ */
  /** Meta / off‑canvas add‑ons */
  // ALL IDs HERE STARTS FROM 1
  // General options
  generalOptions?: {
    optionGroups?: Array<{
      id: ID;
      title: string; // e.g. "Copyright", "Commercial use", "NSFW"
      selections: Array<{ id: ID; label: string; price: Cents }>; // e.g. "Full rights", "Partial rights", "No rights"
    }>;
    addons?: Array<{ id: ID; label: string; price: Cents }>; // e.g. "Stream my commission"
    questions?: Array<{ id: ID; text: string }>; // extra questions 
  };

  /** On‑canvas pricing such as characters, backgrounds … */
  // Only if flow = custom
  // Subject options
  subjectOptions?: Array<{
    id: ID;
    title: string; // e.g. "Character", "Background", "Props"
    limit: number; // default 1, -1 = unlimited
    discount?: number; // e.g. 10% off for 2+ characters, will always apply starting from the secon instance of every subject
    optionGroups?: Array<{
      id: ID;
      title: string; // e.g. "Cropping"
      selections: Array<{ id: ID; label: string; price: Cents }>; // e.g. "Full body", "Half body", "Bust"
    }>;
    addons?: Array<{ id: ID; label: string; price: Cents }>; // e.g. "Add Clothing"
    questions?: Array<{ id: ID; text: string }>; // extra questions, e.g. "Describe character's pose"
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
        kind: {
          // Changed from 'type' to 'kind'
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
          validator: function (value: any) {
            // Reject policy if type is 'none' or 'milestone'
            return this.revisions?.type === "standard" || !value;
          },
          message:
            "Revision policy should only be provided when type is 'standard'",
        },
      },
    },
    milestones: [
      new Schema<{
        id: ID;
        title: string;
        percent: number;
        policy?: RevisionPolicy;
      }>(
        {
          id: { type: Number, required: true },
          title: { type: String, required: true },
          percent: { type: Number, required: true, min: 0, max: 100 },
          policy: RevisionPolicySchema,
        },
        { _id: false }
      ),
    ],
    generalOptions: { type: GeneralOptionsSchema, default: () => ({}) },
    subjectOptions: { type: [SubjectOptionSchema], default: [] },
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
