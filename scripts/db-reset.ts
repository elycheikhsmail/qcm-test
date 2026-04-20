// ⚠️  DESTRUCTIF — efface toute la base et repart de zéro.
// Réservé au développement local.
// Usage : bun run db:reset

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquante.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.error("❌ db:reset interdit en production (NODE_ENV=production).");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 10 });

try {
  console.log("⚠️  Suppression du schéma public...");
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("✅ Schéma recréé");
} finally {
  await sql.end();
}

// Lance migrate puis seed via spawnSync pour garder l'env.
const { spawnSync } = await import("node:child_process");

console.log("\n→ Migration...");
const migrate = spawnSync("bun", ["run", "db:migrate"], {
  stdio: "inherit",
  env: process.env,
});
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

console.log("\n→ Seed...");
const seed = spawnSync("bun", ["run", "db:seed"], {
  stdio: "inherit",
  env: process.env,
});
if (seed.status !== 0) process.exit(seed.status ?? 1);

console.log("\n✅ db:reset terminé — base propre avec données de référence.");
