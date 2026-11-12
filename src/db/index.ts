import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import * as schema from "./schema";

/** Hyperdrive inside the Worker; DATABASE_URL in tests and scripts outside it. */
function resolveConnectionString(): string {
  let connectionString: string | undefined;
  try {
    connectionString = getCloudflareContext().env.HYPERDRIVE?.connectionString;
  } catch {
    // getCloudflareContext throws outside the Cloudflare Worker request scope.
  }
  connectionString ||= process.env.DATABASE_URL;
  if (!connectionString) {
    // Without this, pg silently falls back to localhost:5432 and fails later with a less useful error.
    throw new Error("No database connection: HYPERDRIVE binding and DATABASE_URL are both missing");
  }
  return connectionString;
}

/**
 * Returns a Drizzle database instance connected via Cloudflare Hyperdrive.
 * Hyperdrive connection pool uses maxUses: 1 per request as recommended by OpenNext.
 */
export const getDb = cache(() => {
  const pool = new Pool({
    connectionString: resolveConnectionString(),
    maxUses: 1,
  });
  return drizzle({ client: pool, schema });
});
