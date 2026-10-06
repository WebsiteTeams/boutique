/**
 * Applies pending SQL migrations from ./drizzle to the configured database.
 * Run with: npm run db:migrate
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDb } from "../src/server/db/client";

async function main() {
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
