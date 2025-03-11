// src/lib/utils/db.ts
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable inside .env");
}

export async function connectDB() {
  // If already connected, do nothing
  if (mongoose.connection.readyState === 1) return;

  // Otherwise, connect
  await mongoose.connect(MONGO_URI as string, {
    dbName: "komis",  // ✅ Explicitly specify database name
  });
}
