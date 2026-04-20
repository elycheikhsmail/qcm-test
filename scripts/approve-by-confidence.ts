// Helper : passe à "approved" toutes les questions "pending" dont la confidence
// atteint le seuil demandé. Utile pour auto-valider les questions "high confidence"
// sans passer par la relecture interactive.
//
// Usage :
//   bun run db:approve <chemin.json> [--min-confidence high|medium] [--dry-run]
//
// Défaut : --min-confidence high  (seuil le plus strict)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Confidence = "high" | "medium" | "low";
const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith("--"));
if (!filePath) {
  console.error("Usage : bun run db:approve <chemin.json> [--min-confidence high|medium] [--dry-run]");
  process.exit(1);
}
const minIdx = args.indexOf("--min-confidence");
const minConfidence = (minIdx !== -1 ? args[minIdx + 1] : "high") as Confidence;
const dryRun = args.includes("--dry-run");

if (!(minConfidence in RANK)) {
  console.error(`❌ --min-confidence doit valoir 'low', 'medium' ou 'high' (reçu: ${minConfidence})`);
  process.exit(1);
}

const abs = resolve(process.cwd(), filePath);
const data = JSON.parse(readFileSync(abs, "utf8"));

let touched = 0;
for (const q of data.questions) {
  if (q.validation.status !== "pending") continue;
  if (RANK[q.validation.confidence as Confidence] >= RANK[minConfidence]) {
    q.validation.status = "approved";
    if (!q.validation.reviewer_notes) {
      q.validation.reviewer_notes = `auto-approved (confidence=${q.validation.confidence})`;
    }
    touched++;
  }
}

const approved = data.questions.filter((q: { validation: { status: string } }) => q.validation.status === "approved").length;
const pending = data.questions.filter((q: { validation: { status: string } }) => q.validation.status === "pending").length;
const rejected = data.questions.filter((q: { validation: { status: string } }) => q.validation.status === "rejected").length;

console.log(`→ Fichier : ${abs}`);
console.log(`   confidence ≥ ${minConfidence} : ${touched} question(s) passée(s) à 'approved'`);
console.log(`   total: ${data.questions.length} | approved: ${approved} | pending: ${pending} | rejected: ${rejected}`);

if (dryRun) {
  console.log("🔍 DRY RUN — fichier non modifié.");
} else {
  writeFileSync(abs, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Sauvegardé.`);
}
