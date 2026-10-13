import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set for script-client");
}

export const scriptPool = new Pool({ connectionString });
export const scriptDb = drizzle({ client: scriptPool, schema });
