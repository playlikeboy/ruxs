import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import * as schema from "./schema";

/**
 * Returns a Drizzle database instance connected via Cloudflare Hyperdrive.
 * Hyperdrive connection pool uses maxUses: 1 per request as recommended by OpenNext.
 */
export const getDb = cache(() => {
  let connectionString: string | undefined;
  try {
    const ctx = getCloudflareContext();
    connectionString = ctx.env.HYPERDRIVE?.connectionString;
  } catch {
    // In test / script environments outside of Cloudflare Worker runtime
    connectionString = process.env.DATABASE_URL;
  }

  if (!connectionString) {
    connectionString = process.env.DATABASE_URL;
  }

  const pool = new Pool({
    connectionString,
    maxUses: 1,
  });
  return drizzle({ client: pool, schema });
});
