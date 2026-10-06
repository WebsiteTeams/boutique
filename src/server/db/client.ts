import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { env } from "@/server/config/env";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __umaDb?: { client: Client; db: Database } };

function connect() {
  const url = env.databaseUrl;
  if (url.startsWith("file:")) {
    mkdirSync(path.dirname(path.resolve(url.slice("file:".length))), { recursive: true });
  }
  const client = createClient({ url, authToken: env.databaseAuthToken });
  return { client, db: drizzle(client, { schema }) };
}

export function getDb(): Database {
  if (!globalForDb.__umaDb) globalForDb.__umaDb = connect();
  return globalForDb.__umaDb.db;
}

/** Lazy proxy so importing this module never opens a connection at build time. */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
