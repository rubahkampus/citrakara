// src/lib/db/models/proposal.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";

type ID = number;

export type ProposalSelection = {
  id: ID;
  groupId: ID;
  selectedSelectionID: ID;
  selectedSelectionLabel: string;
  price: Cents;
};

export type ProposalAddon = {
  id: ID;
  addonId: ID;
  price: Cents;
};

export type ProposalAnswer = {
  id: ID;
  questionId: ID;
  answer: string;
};

export type ProposalGeneralOptions = {
  optionGroups?: ProposalSelection[];
  addons?: ProposalAddon[];
  answers?: ProposalAnswer[];
};

export type ProposalSubjectInstance = {
  id: ID;
  optionGroups?: ProposalSelection[];
  addons?: ProposalAddon[];
  answers?: ProposalAnswer[];
};

export type ProposalSubjectOptions = Array<{
  subjectId: ID;
  instances: ProposalSubjectInstance[];
}>;

// ----- Interfaces -----
export interface IProposal extends Document {
  _id: ObjectId;

  /* ---- relationships ---- */
  clientId: ObjectId;
  artistId: ObjectId;
  listingId: ObjectId;

  /* ---- immutable listing snapshot ---- */
  listingSnapshot: ICommissionListing;

  /* ---- lifecycle status ---- */
  status:
    | "pendingArtist" // client submitted proposal, artist needs to accept/reject
    | "pendingClient" // if artist proposed discount or surcharge, client needs to accept/reject
    | "accepted" // artist accepted the proposal
    | "rejectedArtist" // artist rejected the proposal -> end of lifecycle
    | "rejectedClient" // if artist proposed discount or surcharge and client rejected -> not end of lifecycle, functionally the same as "pendingArtist" but it tells the artist that the client rejected the proposed price
    | "expired" // -> end of lifecycle, functionally we're never going to use this status, but it's here for completeness, since we have expiredAt field and we don't have cron jobs to clean up expired proposals
    | "paid"; // -> end of lifecycle, functionally we're never going to use this status, but it's here for completeness, since we have paidAt field and we don't have cron jobs to clean up paid proposals
  expiresAt?: ISODate; // present in pending / negotiating

  /* ---- prediction base date ---- */
  baseDate: ISODate; // when availability was computed

  /* ---- dynamic availability window ---- */
  availability: {
    earliestDate: ISODate; // dynamicMin
    latestDate: ISODate; // dynamicMax
  };
  deadline: ISODate; // chosen by client, if standard, it's two weeks from baseDate

  /* ---- rush details ---- */
  rush?: {
    days: number; // number of rushed days from latestDate, latestDate - deadline, negatve if deadline in the future (e.g. standard always be two weeks, then days = -14)
    paidDays?: number; // number of rushed days from earliest date, earliestDate - deadline
    fee?: Cents; // added to price
  };

  /* ---- brief & refs ---- */
  generalDescription: string;
  referenceImages: string[]; // ≤ 5

  /* ---- option selections ---- */
  generalOptions?: ProposalGeneralOptions;
  subjectOptions?: ProposalSubjectOptions;

  /* ---- price computation ---- */
  calculatedPrice: {
    base: Cents;
    optionGroups: Cents;
    addons: Cents;
    rush: Cents;
    discount: Cents;
    surcharge: Cents;
    total: Cents;
  };

  /* ---- artist adjustments ---- */
  artistAdjustments?: {
    proposedSurcharge?: Cents;
    proposedDiscount?: Cents;
    proposedDate?: ISODate;
    acceptedDate?: ISODate;
    acceptedSurcharge?: Cents;
    acceptedDiscount?: Cents;
  };

  rejectionReason?: string;

  /* ---- timestamps ---- */
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** ---- Sub-schemas for clearer validation ---- */
const ProposalSelectionSchema = new Schema(
  {
    id: { type: Number, required: true },
    groupId: { type: Number, required: true },
    selectedSelectionID: { type: Number, required: true },
    selectedSelectionLabel: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ProposalAddonSchema = new Schema(
  {
    id: { type: Number, required: true },
    addonId: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ProposalAnswerSchema = new Schema(
  {
    id: { type: Number, required: true },
    questionId: { type: Number, required: true },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const ProposalGeneralOptionsSchema = new Schema(
  {
    optionGroups: { type: [ProposalSelectionSchema], default: [] },
    addons: { type: [ProposalAddonSchema], default: [] },
    answers: { type: [ProposalAnswerSchema], default: [] },
  },
  { _id: false }
);

const ProposalSubjectInstanceSchema = new Schema(
  {
    id: { type: Number, required: true },
    optionGroups: { type: [ProposalSelectionSchema], default: [] },
    addons: { type: [ProposalAddonSchema], default: [] },
    answers: { type: [ProposalAnswerSchema], default: [] },
  },
  { _id: false }
);

const ProposalSubjectSchema = new Schema(
  {
    subjectId: { type: Number, required: true },
    instances: { type: [ProposalSubjectInstanceSchema], required: true },
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
        "paid",
      ],
      default: "pendingArtist",
    },
    expiresAt: { type: Date },

    /* listing snapshot */
    listingSnapshot: { type: Schema.Types.Mixed, required: true },

    /* prediction base date */
    baseDate: { type: Date, required: true },

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
    generalOptions: { type: ProposalGeneralOptionsSchema, default: {} },
    subjectOptions: { type: [ProposalSubjectSchema], default: [] },

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

    /* artist adjustments */
    artistAdjustments: {
      proposedSurcharge: { type: Number },
      proposedDiscount: { type: Number },
      proposedDate: { type: Date },
      acceptedDate: { type: Date },
      acceptedSurcharge: { type: Number },
      acceptedDiscount: { type: Number },
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

ProposalSchema.pre('save', function(next) {
  if (this.subjectOptions && this.listingSnapshot) {
    this.subjectOptions.forEach(subjectOption => {
      const subjectTemplate = this.listingSnapshot.subjectOptions?.find(
        s => s.id === subjectOption.subjectId
      );
      
      if (subjectTemplate) {
        subjectOption.instances.forEach(instance => {
          (instance.optionGroups ?? []).forEach(group => {
            const optGroupTemplate = subjectTemplate.optionGroups?.find(
              g => g.id === group.groupId
            );
            
            if (optGroupTemplate) {
              const selection = optGroupTemplate.selections.find(
                s => s.id === group.selectedSelectionID
              );
              
              if (selection && !group.selectedSelectionLabel) {
                group.selectedSelectionLabel = selection.label;
              }
            }
          });
        });
      }
    });
  }
  
  next();
});

export default models.Proposal || model<IProposal>("Proposal", ProposalSchema);
