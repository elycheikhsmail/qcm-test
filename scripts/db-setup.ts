// Crée la base qcm_db et le rôle qcm_app via le superuser postgres.
// Usage (depuis la racine du projet) :
//   PGPASSWORD=xxx bun run scripts/db-setup.ts
// ou interactif : bun run scripts/db-setup.ts  (psql demandera le mot de passe)
//
// Prérequis : psql.exe accessible. Sur Windows avec PG 18 installé via l'installeur officiel :
//   C:\Program Files\PostgreSQL\18\bin\psql.exe
// On tente d'abord `psql` (PATH), puis ce chemin par défaut.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const APP_PASSWORD = process.env.QCM_APP_PASSWORD ?? "qcm_dev_password";
const SUPERUSER = process.env.PG_SUPERUSER ?? "postgres";
const SETUP_SQL = resolve(process.cwd(), "db/setup.sql");

function findPsql(): string {
  const candidates = [
    "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const test = spawnSync("psql", ["--version"]);
  if (test.status === 0) return "psql";
  console.error("❌ psql introuvable. Installe PostgreSQL ou ajoute psql au PATH.");
  process.exit(1);
}

const psql = findPsql();
console.log(`→ psql: ${psql}`);
console.log(`→ superuser: ${SUPERUSER}`);
console.log(`→ fichier: ${SETUP_SQL}`);
console.log();

const result = spawnSync(
  psql,
  [
    "-U",
    SUPERUSER,
    "-d",
    "postgres",
    "-v",
    `app_password=${APP_PASSWORD}`,
    "-f",
    SETUP_SQL,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  console.error(`\n❌ db-setup a échoué (code ${result.status})`);
  process.exit(result.status ?? 1);
}

console.log("\n✅ base qcm_db + rôle qcm_app prêts.");
console.log("   Mets à jour .env.local :");
console.log(`   DATABASE_URL=postgres://qcm_app:${APP_PASSWORD}@localhost:5432/qcm_db`);
