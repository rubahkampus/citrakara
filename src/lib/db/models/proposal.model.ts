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
  listingSnapshot: ICommissionListing

  /* ---- lifecycle status ---- */
  status:
    | "pendingArtist" // client submitted proposal
    | "pendingClient" // if artist proposed discount or surcharge
    | "accepted" // artist accepted the proposal
    | "rejectedArtist" // artist rejected the proposal -> end of lifecycle
    | "rejectedClient" // if artist proposed discount or surcharge and client rejected -> not end of lifecycle
    | "expired"; // -> end of lifecycle
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
  // General options store client's answers to general questions and selections
  generalOptions?: {
    // groupTitle → selectedLabel and price
    optionGroups?: Record<
      string,
      {
        selectedLabel: string;
        price: Cents;
      }
    >;
    // addon label → price
    addons?: Record<string, Cents>;
    // question text → client's answer
    answers?: Record<string, string>;
  };

  // Subject options store client's answers per subject (e.g., Character, Background)
  subjectOptions?: {
    [subjectTitle: string]: {
      // e.g., "Character", "Background"
      // For each character / background instance if multiple are allowed
      instances: Array<{
        // optionGroup title → selected label and price
        optionGroups?: Record<
          string,
          {
            selectedLabel: string;
            price: Cents;
          }
        >;
        // addon label → price
        addons?: Record<string, Cents>;
        // question text → client's answer
        answers?: Record<string, string>;
      }>;
    };
  };

  /* ---- price computation ---- */
  calculatedPrice: {
    base: Cents;
    optionGroups: Cents;
    addons: Cents;
    rush: Cents;
    discount: Cents; // client-side coupons + subject-specific discounts
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
const GeneralOptionsSelectionSchema = new Schema(
  {
    selectedLabel: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const GeneralOptionsSchema = new Schema(
  {
    optionGroups: {
      type: Map,
      of: GeneralOptionsSelectionSchema,
      default: {},
    },
    addons: {
      type: Map,
      of: Number, // price in cents
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

const SubjectInstanceSchema = new Schema(
  {
    optionGroups: {
      type: Map,
      of: GeneralOptionsSelectionSchema,
      default: {},
    },
    addons: {
      type: Map,
      of: Number, // price in cents
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

const SubjectOptionGroupSchema = new Schema(
  {
    instances: { type: [SubjectInstanceSchema], required: true },
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
        "pendingArtist",
        "pendingClient",
        "accepted",
        "rejectedArtist",
        "rejectedClient",
        "expired",
      ],
      default: "pendingArtist",
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
      of: SubjectOptionGroupSchema,
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
  { partialFilterExpression: { status: { $in: ["pendingArtist"] } } }
);

export default models.Proposal || model<IProposal>("Proposal", ProposalSchema);
