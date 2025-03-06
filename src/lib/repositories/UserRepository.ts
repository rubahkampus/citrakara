// src/lib/repositories/UserRepository.ts
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

/** Return user by email */
export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email });
}

export async function findUserByUsername(username: string) {
  await connectDB();
  return User.findOne({ username });
}

/** Create a new user */
export async function createUser(data: { email: string; username: string; password: string }) {
  await connectDB();
  return User.create(data);
}
