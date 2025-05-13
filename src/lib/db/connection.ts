import mongoose from "mongoose";
import { ensureModelsRegistered } from "./models";

// Cache mongoose connection across hot reloads in development
declare global {
  var _mongoose: {
    conn: typeof mongoose.connection | null;
    promise: Promise<typeof mongoose.connection> | null;
  };
}

if (!global._mongoose) {
  global._mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using the MONGO_URI env var.
 * Caches the connection promise for reuse.
 */
export async function connectDB(): Promise<typeof mongoose.connection> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGO_URI environment variable inside .env or your test setup"
    );
  }

  // Reuse existing connection
  if (global._mongoose.conn && global._mongoose.conn.readyState === 1) {
    ensureModelsRegistered();
    return global._mongoose.conn;
  }

  // Wait for in-flight connection
  if (global._mongoose.promise) {
    await global._mongoose.promise;
    ensureModelsRegistered();
    return global._mongoose.conn!;
  }

  // Establish a new connection
  global._mongoose.promise = mongoose
    .connect(uri, { dbName: "komis" })
    .then((mongooseInstance) => {
      global._mongoose.conn = mongooseInstance.connection;
      return mongooseInstance.connection;
    })
    .catch((err) => {
      global._mongoose.promise = null;
      throw err;
    });

  const conn = await global._mongoose.promise;
  ensureModelsRegistered();
  return conn;
}

/**
 * Disconnects from MongoDB and clears cached connection.
 */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  global._mongoose = { conn: null, promise: null };
}
