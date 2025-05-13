// src/lib/test/helpers/mongodb.ts
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ensureModelsRegistered } from "@/lib/db/models";

let mongoServer: MongoMemoryServer;

/**
 * Connect to the in-memory database.
 */
export const connectToMockDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set the connection string environment variable
  process.env.MONGO_URI = uri;

  await mongoose.connect(uri, {
    dbName: "testdb",
  });

  // Ensure all models are registered
  ensureModelsRegistered();
};

/**
 * Drop database, close the connection and stop mongod.
 */
export const closeMockDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Remove all data from collections.
 */
export const clearDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
