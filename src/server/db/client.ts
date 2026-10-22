import mongoose from "mongoose";
import { env } from "@/server/config/env";

// Reuse one connection across hot reloads in development and across requests in production.
const globalForDb = globalThis as unknown as { __umaMongo?: Promise<typeof mongoose> };

/**
 * Connects to MongoDB once and returns the shared Mongoose instance.
 * Every service awaits this before touching a model, so nothing connects at build time.
 */
export function connectDb(): Promise<typeof mongoose> {
  if (!globalForDb.__umaMongo) {
    globalForDb.__umaMongo = mongoose
      .connect(env.mongodbUri, {
        // Fail fast with a clear error instead of hanging when MongoDB is not running.
        serverSelectionTimeoutMS: 5000,
        autoIndex: true,
      })
      .catch((error) => {
        globalForDb.__umaMongo = undefined;
        throw error;
      });
  }
  return globalForDb.__umaMongo;
}

export async function disconnectDb() {
  if (globalForDb.__umaMongo) {
    await (await globalForDb.__umaMongo).disconnect();
    globalForDb.__umaMongo = undefined;
  }
}
