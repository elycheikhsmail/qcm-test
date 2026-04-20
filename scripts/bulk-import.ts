// Importe tous les fichiers JSON du dossier output/ en appelant import-questions.ts
// pour chacun. Utile quand on a généré plusieurs chapitres d'un coup.
//
// Usage :
//   bun run db:bulk-import [--dir output/] [--subject "Mathématiques"]

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const dirIdx = args.indexOf("--dir");
const dir = dirIdx !== -1 ? args[dirIdx + 1] : "output";
const subjIdx = args.indexOf("--subject");
const subject = subjIdx !== -1 ? args[subjIdx + 1] : "Mathématiques";

const absDir = resolve(process.cwd(), dir);
const files = readdirSync(absDir).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.log(`ℹ️  Aucun .json dans ${absDir}`);
  process.exit(0);
}

console.log(`→ ${files.length} fichier(s) à importer depuis ${absDir}\n`);

let success = 0;
let failed = 0;
for (const f of files) {
  const full = join(absDir, f);
  console.log(`\n═══ ${f} ═══`);
  const r = spawnSync(
    "bun",
    ["--env-file=.env.local", "run", "scripts/import-questions.ts", full, "--subject", subject],
    { stdio: "inherit", env: process.env },
  );
  if (r.status === 0) success++;
  else failed++;
}

console.log(`\n════════════════════════════════`);
console.log(`✅ ${success} fichier(s) OK  |  ❌ ${failed} échec(s)`);
process.exit(failed > 0 ? 1 : 0);
