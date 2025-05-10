// src/lib/db/models/contract.model.ts
import { Schema, Document, model, models } from "mongoose";
import type { ObjectId, ISODate, Cents } from "@/types/common";
import {
  ProposalGeneralOptionsSchema,
  ProposalSubjectSchema,
  type IProposal,
  type ProposalGeneralOptions,
  type ProposalSubjectOptions,
} from "./proposal.model";
import { type RevisionPolicy, RevisionPolicySchema } from "./commissionListing.model";
import type {
  ICancelTicket,
  IRevisionTicket,
  IChangeTicket,
  IResolutionTicket,
} from "./ticket.model";
import type {
  IProgressUploadStandard,
  IProgressUploadMilestone,
  IRevisionUpload,
  IFinalUpload,
} from "./upload.model";

export interface IMilestone {
  index: number; // 0‑based order
  title: string; // label shown to both parties

  status: "pending" | "inProgress" | "submitted" | "accepted" | "rejected";

  percent: number; // share of total price (0‑100)

  // If revision type == milestone
  revisionDone?: number; // how many revision done - If revision type == milestone
  revisionPolicy?: RevisionPolicy; // per‑milestone revision - If revision type == milestone

  startedAt?: ISODate; // first time artist worked, for first milestone is upon contract creation, for the next is upon previous completion
  createdAt?: ISODate; // artist flagged final upload
  completedAt?: ISODate; // client accepted

  acceptedUploadId?: ObjectId; // ProgressUploadMilestone that closed this step
}

export interface IContract extends Document {
  /* — IDs & contractVersion —*/
  _id: ObjectId;
  contractVersion: number;

  /* — Relationships —*/
  clientId: ObjectId;
  artistId: ObjectId;
  listingId: ObjectId;
  proposalId: ObjectId;

  /* — Immutable snapshot —*/
  proposalSnapshot: IProposal;

  contractTerms: Array<{
    // Lifted from IProposal for the first one
    contractVersion: number;
    generalDescription: string;
    referenceImages: string[];
    generalOptions?: ProposalGeneralOptions;
    subjectOptions?: ProposalSubjectOptions;
  }>;

  /* — Final macro status —*/
  status:
    | "active" // When a proposal is paid, contract is created and will always be active
    | "completed" // EOL | full payment to artist
    | "completedLate" // EOL | artist => total - total * latePenalty/100 | client => total * latePenalty/100
    | "cancelledClient" // EOL | artist => total * workPercentage + cancellationFee | client => total - total * workPercentage - cancellationFee (if a calculation becomes negative, that just means the party does not receive anything and the other receives the total)
    | "cancelledClientLate" // EOL | artist => total * workPercentage - total * latePenalty/100  | client => total - total * workPercentage + total * latePenalty/100 (no cancellation fee for client in this case)
    | "cancelledArtist" // EOL | artist => total * workPercentage - cancellationFee | client => total - total * workPercentage + cancellationFee
    | "cancelledArtistLate" // EOL | artist => total * workPercentage - total * latePenalty/100 - cancellationFee  | client => total - total * workPercentage + total * latePenalty/100 + cancellationFee (cancellation fee for artist in this case)
    | "notCompleted"; // EOL | full refund to client, client don't extend contract, and artist failed to submit any final work before graceEndsAt
  statusHistory: Array<{ event: IContract["status"]; at: ISODate }>;

  /* — Milestone data (only if flow = milestone) —*/
  workPercentage: number;
  // workPercentage is set to 0 at the start
  // in milestone flow, it will always be updated along the ways
  // in standard flow, it will go straight to 100 upon completion
  // in cancellation, artist must determine the workPercentage level and it must be accepted by client, if they use milestone, the default value is all the percentages from completed milestones

  // If revision type == standard
  revisionDone?: number; // how many revision done - If revision type == standard
  revisionPolicy?: RevisionPolicy; // global revision - If revision type == standard

  milestones?: IMilestone[]; // So
  currentMilestoneIndex?: number;

  /* — Deadline, Lateness , and Extensions —*/
  deadlineAt: ISODate; // The deadline of the contract, the contract is considered late if it exceeds this date
  graceEndsAt: ISODate; // The contract is terminated and cannot be interacted after if client does not extend or artist didn't complete the contract

  lateExtensions?: Array<{
    requestedAt: ISODate;
    previousDeadlineAt: ISODate;
    previousGraceEndsAt: ISODate;
    newDeadlineAt: ISODate;
    newGraceEndsAt: ISODate;
  }>; // By client when contract is between deadlineAt and graceEndsAt, contract is auto change and don't need artist approval to extend deadline

  // finance & payment
  finance: {
    // Calculated on contract creation
    basePrice: Cents; // core price from listing
    optionFees: Cents; // option add‑ons total
    addons: Cents; // manual add‑on total
    rushFee: Cents; // rush surcharge
    discount: Cents; // discount applied
    surcharge: Cents; // extra on top (tax, etc.)

    // Calculated while the contract is running
    runtimeFees: Cents; // paid revisions / changes in contract done while contract is running

    // Totals
    total: Cents; // The total of the contract as a whole
    totalPaid: Cents; // The total paid so far by client

    // For payment or refund (capped to 0, cannot go further down, that just means that the party does not rightfully owed any payment and the other party rightfully owed the total)
    totalOwnedByArtist: Cents; // total * workPercentage - total * latePenalty (if late)
    totalOwnedByClient: Cents; // total - total * workPercentage + latePenalty (if late)
  };

  escrowTxnId: ObjectId; // Initial payment at the creation of contract referencing the escrow transaction

  /* — Ticketed negotiation flows —*/
  cancelTickets: ObjectId[]; // zero or many cancellation attempts
  revisionTickets: ObjectId[]; // revision requests
  changeTickets: ObjectId[]; // spec/price changes
  resolutionTickets: ObjectId[]; // admin dispute cases

  /* — Uploads (immutable artifacts) —*/
  progressUploadsStandard: ObjectId[];
  progressUploadsMilestone: ObjectId[];
  revisionUploads: ObjectId[];
  finalUploads: ObjectId[];

  /* — Post‑project feedback —*/
  completion?: {
    percentComplete: number; // 0‑100 visual on dashboard
    clientRating?: number; // 1‑5 stars
    artistRating?: number; // 1‑5 stars (if implemented)
    reviewId?: ObjectId; // pointer to review document
  };

  /* — Outcome of any cancellation —*/
  cancelSummary?: {
    by: "client" | "artist"; // who initiated final cancel
    at: ISODate; // timestamp
    isLate: boolean;
    workPercentage: number; // agreed % completed
    artistPayout: Cents; // paid to artist
    clientPayout: Cents; // refunded to client
    escrowTxnIds: ObjectId[]; // refund / release txn ids
  };
}

// Schema for Milestone
const MilestoneSchema = new Schema<IMilestone>({
  index: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "inProgress", "submitted", "accepted", "rejected"],
    required: true,
    default: "pending",
  },
  percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  revisionDone: {
    type: Number,
  },
  revisionPolicy: {
    type: RevisionPolicySchema, 
  },
  startedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  acceptedUploadId: {
    type: Schema.Types.ObjectId,
    ref: "ProgressUploadMilestone",
  },
});

// Contract terms schema
const ContractTermsSchema = new Schema({
  contractVersion: {
    type: Number,
    required: true,
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
});

// Status history schema
const StatusHistorySchema = new Schema({
  event: {
    type: String,
    enum: [
      "active",
      "completed",
      "completedLate",
      "cancelledClient",
      "cancelledClientLate",
      "cancelledArtist",
      "cancelledArtistLate",
      "notCompleted",
    ],
    required: true,
  },
  at: {
    type: Date,
    required: true,
  },
});

// Late extensions schema
const LateExtensionSchema = new Schema({
  requestedAt: {
    type: Date,
    required: true,
  },
  previousDeadlineAt: {
    type: Date,
    required: true,
  },
  previousGraceEndsAt: {
    type: Date,
    required: true,
  },
  newDeadlineAt: {
    type: Date,
    required: true,
  },
  newGraceEndsAt: {
    type: Date,
    required: true,
  },
});

// Finance schema
const FinanceSchema = new Schema({
  basePrice: {
    type: Number,
    required: true,
  },
  optionFees: {
    type: Number,
    required: true,
    default: 0,
  },
  addons: {
    type: Number,
    required: true,
    default: 0,
  },
  rushFee: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    required: true,
    default: 0,
  },
  surcharge: {
    type: Number,
    required: true,
    default: 0,
  },
  runtimeFees: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  totalPaid: {
    type: Number,
    required: true,
    default: 0,
  },
  totalOwnedByArtist: {
    type: Number,
    required: true,
    default: 0,
  },
  totalOwnedByClient: {
    type: Number,
    required: true,
    default: 0,
  },
});

// Completion schema
const CompletionSchema = new Schema({
  percentComplete: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  clientRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  artistRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: "Review",
  },
});

// Cancel summary schema
const CancelSummarySchema = new Schema({
  by: {
    type: String,
    enum: ["client", "artist"],
    required: true,
  },
  at: {
    type: Date,
    required: true,
  },
  isLate: {
    type: Boolean,
    required: true,
  },
  workPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  artistPayout: {
    type: Number,
    required: true,
  },
  clientPayout: {
    type: Number,
    required: true,
  },
  escrowTxnIds: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Escrow",
  },
});

// Schema for Contract
const ContractSchema = new Schema<IContract>(
  {
    contractVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    // Relationships
    clientId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    artistId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    listingId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "CommissionListing",
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Proposal",
    },
    // Immutable snapshot
    proposalSnapshot: {
      type: Schema.Types.Mixed, // Since IProposal might be complex
      required: true,
    },
    contractTerms: {
      type: [ContractTermsSchema],
      required: true,
    },
    // Final macro status
    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "completedLate",
        "cancelledClient",
        "cancelledClientLate",
        "cancelledArtist",
        "cancelledArtistLate",
        "notCompleted",
      ],
      default: "active",
      required: true,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
      required: true,
    },
    // Milestone data
    workPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    revisionDone: {
      type: Number,
    },
    revisionPolicy: {
      type: Schema.Types.Mixed, // Assuming RevisionPolicy is a complex type
    },
    milestones: {
      type: [MilestoneSchema],
    },
    currentMilestoneIndex: {
      type: Number,
    },
    // Deadline, Lateness, and Extensions
    deadlineAt: {
      type: Date,
      required: true,
    },
    graceEndsAt: {
      type: Date,
      required: true,
    },
    lateExtensions: {
      type: [LateExtensionSchema],
    },
    // Finance & payment
    finance: {
      type: FinanceSchema,
      required: true,
    },
    escrowTxnId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Escrow",
    },
    // Ticketed negotiation flows
    cancelTickets: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "CancelTicket",
    },
    revisionTickets: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "RevisionTicket",
    },
    changeTickets: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "ChangeTicket",
    },
    resolutionTickets: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "ResolutionTicket",
    },
    // Uploads
    progressUploadsStandard: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "ProgressUploadStandard",
    },
    progressUploadsMilestone: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "ProgressUploadMilestone",
    },
    revisionUploads: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "RevisionUpload",
    },
    finalUploads: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "FinalUpload",
    },
    // Post-project feedback
    completion: {
      type: CompletionSchema,
    },
    // Outcome of any cancellation
    cancelSummary: {
      type: CancelSummarySchema,
    },
  },
  { timestamps: true }
);

// Create and export the model
export default models.Contract || model<IContract>("Contract", ContractSchema);
