// Applique db/schema.sql sur la base ciblée par DATABASE_URL.
// Idempotent — peut être relancé sans danger.
// Usage : bun run db:migrate

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquante — charge .env.local d'abord.");
  process.exit(1);
}

const schemaPath = resolve(process.cwd(), "db/schema.sql");
const schemaSql = readFileSync(schemaPath, "utf8");

const sql = postgres(url, { max: 1, connect_timeout: 10 });

try {
  console.log("→ Connexion à la base...");
  await sql.unsafe(schemaSql);
  console.log("✅ Migration appliquée — toutes les tables sont prêtes.");
} catch (err) {
  console.error("❌ Migration échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await sql.end();
}
