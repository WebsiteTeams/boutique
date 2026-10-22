/**
 * Creates or updates the MongoDB indexes declared in src/server/db/models.ts
 * (unique emails, slugs, tokens and the lookup indexes). Safe to re-run.
 * Run with: npm run db:migrate
 */
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../src/server/db/client";
import "../src/server/db/models";

async function main() {
  await connectDb();
  for (const model of Object.values(mongoose.models)) {
    await model.createCollection().catch(() => {});
    await model.syncIndexes();
  }
  console.log(`MongoDB indexes are up to date for ${Object.keys(mongoose.models).length} collections.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
