/**
 * Initialise la base de données de test (qcm_db_test) :
 * 1. Applique db/schema.sql (idempotent)
 * 2. Applique tous les fichiers db/migrations/*.sql dans l'ordre
 *
 * Usage : bun --env-file=.env.test run scripts/setup-test-db.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("❌ DATABASE_URL manquante"); process.exit(1); }

const sql = postgres(url, { max: 1, connect_timeout: 10 });

try {
  // ── Schema principal ──────────────────────────────────────────────────────
  console.log("→ Application de db/schema.sql…");
  const schemaPath = resolve(process.cwd(), "db/schema.sql");
  await sql.unsafe(readFileSync(schemaPath, "utf8"));
  console.log("  ✅ schema.sql OK");

  // ── Migrations ────────────────────────────────────────────────────────────
  const migrationsDir = resolve(process.cwd(), "db/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`→ Migration ${file}…`);
    const migSql = readFileSync(resolve(migrationsDir, file), "utf8");
    await sql.unsafe(migSql);
    console.log(`  ✅ ${file} OK`);
  }

  console.log("\n✅ DB de test prête.");
} catch (err) {
  console.error("❌ Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await sql.end();
}
