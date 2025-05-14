// src/lib/db/models/user.model.ts
import { Schema, Document, model, models } from "mongoose";
import { defaultUserConfig } from "@/config";
import type { ObjectId, ISODate, Cents } from "@/types/common";

export interface IUser extends Document {
  _id: ObjectId;

  // Identity & auth
  email: string;
  username: string;
  password: string;
  roles: ("user" | "admin")[];

  // Profile
  displayName: string;
  bio: string;
  profilePicture: string;
  banner: string;
  tags: string[];
  socials: { label: string; url: string }[];

  // Gallery settings
  galleries: ObjectId[]; // ref => Gallery[]

  // Artist settings
  openForCommissions: boolean;
  defaultCurrency: "IDR" | "USD" | string;

  // Linked references
  tosEntries: ObjectId[]; // reference to all their TOS documents
  wallet: ObjectId; // reference to user's wallet document

  // Bookmarks
  commissionBookmarks: ObjectId[]; // reference to bookmarked commission listings
  artistBookmarks: ObjectId[]; // reference to bookmarked artists

  // Stats (read-only)
  rating: { avg: number; count: number };
  completedOrders: number;

  // Admin/safety flags
  isDeleted: boolean;
  isSuspended: boolean;
  emailVerified: boolean;

  // Timestamps
  createdAt: ISODate;
  updatedAt: ISODate;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },

    roles: { type: [String], enum: ["user", "admin"], default: ["user"] },

    displayName: { type: String, required: true },
    bio: { type: String, default: "" },
    profilePicture: {
      type: String,
      default: defaultUserConfig.profilePicture,
    },
    banner: {
      type: String,
      default: defaultUserConfig.banner,
    },
    tags: { type: [String], default: [] },
    socials: {
      type: [
        {
          label: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
      default: [],
    },

    galleries: [{ type: Schema.Types.ObjectId, ref: "Gallery", default: [] }],

    openForCommissions: { type: Boolean, default: false },
    defaultCurrency: { type: String, default: "IDR" },

    tosEntries: [{ type: Schema.Types.ObjectId, ref: "Tos", default: [] }],
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },

    // Bookmarks
    commissionBookmarks: [
      { type: Schema.Types.ObjectId, ref: "CommissionListing", default: [] },
    ],
    artistBookmarks: [
      { type: Schema.Types.ObjectId, ref: "User", default: [] },
    ],

    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    completedOrders: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ roles: 1 });
UserSchema.index({ tags: 1 });
UserSchema.index({ commissionBookmarks: 1 });
UserSchema.index({ artistBookmarks: 1 });

export default models.User || model<IUser>("User", UserSchema);
