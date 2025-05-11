// src/lib/db/connection.ts
import mongoose from "mongoose";
// Import the function that ensures all models are registered
import { ensureModelsRegistered } from "./models";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially.
 */
let globalWithMongoose = global as typeof global & {
  mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
};

// Initialize the cached connection
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  // If already connected, ensure models are registered and return
  if (
    mongoose.connection.readyState === 1 ||
    (globalWithMongoose.mongoose.conn &&
      globalWithMongoose.mongoose.conn.readyState === 1)
  ) {
    // Make sure all models are registered even when reusing the connection
    ensureModelsRegistered();
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (globalWithMongoose.mongoose.promise) {
    await globalWithMongoose.mongoose.promise;
    // Ensure models are registered after connection
    ensureModelsRegistered();
    return mongoose.connection;
  }

  // Otherwise, create a new connection
  await mongoose.connect(MONGO_URI as string, {
    dbName: "komis", // ✅ Explicitly specify database name
  });

  try {
    await globalWithMongoose.mongoose.promise;
    globalWithMongoose.mongoose.conn = mongoose.connection;

    // Ensure all models are registered after establishing connection
    ensureModelsRegistered();

    return mongoose.connection;
  } catch (e) {
    console.error("MongoDB connection error:", e);
    globalWithMongoose.mongoose.promise = null;
    throw e;
  }
}
