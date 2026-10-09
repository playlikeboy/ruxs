import { neon } from "@neondatabase/serverless";
import * as fs from "node:fs";
import * as path from "node:path";

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL...");
  const sql = neon(databaseUrl);

  // 1. Ensure migrations tracking table exists
  await sql`
    CREATE TABLE IF NOT EXISTS __ruxs_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  const appliedRows = await sql`SELECT name FROM __ruxs_migrations`;
  const appliedSet = new Set(appliedRows.map((r: any) => r.name));

  const drizzleDir = path.resolve(process.cwd(), "drizzle");
  if (!fs.existsSync(drizzleDir)) {
    console.log("No drizzle directory found.");
    return;
  }

  const files = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files in drizzle/`);

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`- Skipping already applied migration: ${file}`);
      continue;
    }

    console.log(`Applying migration: ${file}...`);
    const filePath = path.join(drizzleDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        // Execute raw SQL statement using sql.query
        await (sql as any).query(stmt);
      } catch (err: any) {
        // If table or column already exists, log and proceed safely
        const msg = String(err?.message || err);
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          msg.includes("does not exist")
        ) {
          console.warn(`  [Notice] ${msg.split("\n")[0]}`);
        } else {
          console.error(`Error executing statement in ${file}:`, stmt);
          console.error(err);
          throw err;
        }
      }
    }

    await sql`INSERT INTO __ruxs_migrations (name) VALUES (${file}) ON CONFLICT (name) DO NOTHING`;
    console.log(`✓ Migration applied successfully: ${file}`);
  }

  console.log("All migrations successfully processed.");
}

runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
