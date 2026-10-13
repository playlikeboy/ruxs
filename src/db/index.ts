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
  const { env } = getCloudflareContext();
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString,
    maxUses: 1,
  });
  return drizzle({ client: pool, schema });
});
