/**
 * Applies hand-written SQL migrations that drizzle-kit can't run (plpgsql
 * bodies, data copies) inside one transaction each, and records them in
 * drizzle.__drizzle_migrations so `bun run db:migrate` skips them later.
 *
 *   bun --env-file=.env scripts/apply-sql-migrations.ts 0013_vendor_type_tables
 *   bun --env-file=.env scripts/apply-sql-migrations.ts --record-only 0010_dual_delivery_and_support_tickets
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const dir = path.join(import.meta.dir, "../src/db/migrations");
const journal = JSON.parse(fs.readFileSync(path.join(dir, "meta/_journal.json"), "utf8")) as {
  entries: { tag: string; when: number }[];
};

const args = process.argv.slice(2);
const recordOnly = args.includes("--record-only");
const tags = args.filter((a) => !a.startsWith("--"));
if (tags.length === 0) throw new Error("Pass at least one migration tag");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
for (const tag of tags) {
  const entry = journal.entries.find((e) => e.tag === tag);
  if (!entry) throw new Error(`${tag} is not in meta/_journal.json`);
  const sql = fs.readFileSync(path.join(dir, tag + ".sql"), "utf8");
  const hash = crypto.createHash("sha256").update(sql).digest("hex");

  const client = await pool.connect();
  try {
    const done = await client.query("select 1 from drizzle.__drizzle_migrations where created_at = $1", [entry.when]);
    if (done.rowCount) {
      console.log(`${tag}: already recorded, skipped`);
      continue;
    }
    await client.query("begin");
    if (!recordOnly) await client.query(sql.replaceAll("--> statement-breakpoint", ""));
    await client.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)", [hash, entry.when]);
    await client.query("commit");
    console.log(`${tag}: ${recordOnly ? "recorded" : "applied"}`);
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
await pool.end();
