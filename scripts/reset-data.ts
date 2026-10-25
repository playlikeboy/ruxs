/**
 * Empties every RUXs data table and drops public tables the app no longer
 * defines. Keeps the schema, the migration history and the platform's own
 * reference data (categories, localities, settings, admins).
 *
 *   bun --env-file=.env.local scripts/reset-data.ts          # dry run: prints the plan
 *   bun --env-file=.env.local scripts/reset-data.ts --yes    # does it, in one transaction
 *
 * Irreversible. Take a Neon branch or snapshot first.
 */
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const KEEP = new Set(["categories", "kids_categories", "localities", "platform_settings", "platform_admins"]);

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const execute = process.argv.includes("--yes");

const defined = new Set(Object.values(schema).filter((v) => is(v, PgTable)).map((t) => getTableName(t as PgTable)));
const pool = new Pool({ connectionString: url });
const { rows } = await pool.query<{ name: string }>(
  "select table_name as name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1"
);
const existing = rows.map((r) => r.name);
const drop = existing.filter((t) => !defined.has(t));
const wipe = existing.filter((t) => defined.has(t) && !KEEP.has(t));
const quote = (t: string) => `"${t.replaceAll('"', '""')}"`;

console.log(`Database: ${new URL(url).host}`);
console.log(`Drop (not defined in src/db/schema): ${drop.join(", ") || "none"}`);
console.log(`Empty (${wipe.length}): ${wipe.join(", ")}`);
console.log(`Keep rows: ${existing.filter((t) => KEEP.has(t)).join(", ")}`);

if (!execute) {
  console.log("\nDry run. Re-run with --yes to apply.");
} else {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const t of drop) await client.query(`drop table if exists ${quote(t)} cascade`);
    // No CASCADE: if a kept table pointed at a wiped one, fail instead of silently emptying it.
    if (wipe.length) await client.query(`truncate table ${wipe.map(quote).join(", ")} restart identity`);
    await client.query("commit");
    console.log(`\nDone: dropped ${drop.length}, emptied ${wipe.length}.`);
  } catch (err) {
    await client.query("rollback");
    console.error("Reset failed, nothing changed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}
await pool.end();
