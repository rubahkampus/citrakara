// src/lib/models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
