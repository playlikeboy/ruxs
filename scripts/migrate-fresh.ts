/**
 * Applies every migration in the journal, in order, to an EMPTY database.
 * Used by CI and local test setup. Refuses to run against a database that
 * already has RUXs tables, so it can never touch production.
 *
 *   DATABASE_URL=postgres://localhost/ruxs_test bun run db:migrate:fresh
 */
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: url });
const { rows } = await pool.query("select to_regclass('public.vendors') as t");
if (rows[0]?.t) {
  await pool.end();
  throw new Error("Refusing to run: this database already has RUXs tables. migrate-fresh is for empty test databases only.");
}
await pool.query("create schema if not exists drizzle; create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)");
await pool.end();

const journal = JSON.parse(fs.readFileSync(path.join(import.meta.dir, "../src/db/migrations/meta/_journal.json"), "utf8")) as { entries: { tag: string }[] };
const proc = Bun.spawnSync(["bun", path.join(import.meta.dir, "apply-sql-migrations.ts"), ...journal.entries.map((e) => e.tag)], {
  env: process.env,
  stdout: "inherit",
  stderr: "inherit",
});
process.exit(proc.exitCode ?? 1);
