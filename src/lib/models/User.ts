// src/lib/models/User.ts
import mongoose, { Schema, Document } from "mongoose";
import { defaultUserConfig } from "@/config";

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  bio?: string;
  profilePicture?: string;
  banner?: string;
  isDeleted?: boolean;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  profilePicture: { type: String, default: defaultUserConfig.profilePicture },
  banner: { type: String, default: defaultUserConfig.banner },
  isDeleted: { type: Boolean, default: false },
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
