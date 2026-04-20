/**
 * validate_questions.ts
 *
 * Outil de relecture CLI pour les fichiers JSON intermédiaires.
 * Affiche chaque question "pending" et permet de l'approuver ou rejeter.
 *
 * Usage :
 *   bun run scripts/validate_questions.ts --file output/1AF_ch01_nombres_2026-04-10.json
 *
 * Touches :
 *   a → approved   r → rejected   s → skip (reste pending)   q → quit (sauvegarde)
 */

import { readFileSync, writeFileSync } from "fs";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Types (mirror de generate_questions.ts)
// ---------------------------------------------------------------------------

type ValidationStatus = "pending" | "approved" | "rejected";

interface Question {
  id: string;
  type: string;
  langue: string;
  content: string;
  options: string[] | null;
  correct_answer: string;
  difficulty: number;
  page_source: number | null;
  validation: { status: ValidationStatus; confidence: string; note: string | null };
  enrichissement: unknown;
  meta: { option: string | null };
}

interface OutputFile {
  meta: Record<string, unknown>;
  questions: Question[];
}

// ---------------------------------------------------------------------------
// Helpers d'affichage
// ---------------------------------------------------------------------------

function clearLine() {
  process.stdout.write("\x1B[2J\x1B[0f");
}

function confidenceColor(c: string): string {
  if (c === "high")   return "\x1b[32m"; // vert
  if (c === "medium") return "\x1b[33m"; // jaune
  return "\x1b[31m";                      // rouge (low)
}

const RESET = "\x1b[0m";
const BOLD  = "\x1b[1m";
const DIM   = "\x1b[2m";

function displayQuestion(q: Question, idx: number, total: number) {
  clearLine();
  console.log(`${BOLD}─── Question ${idx + 1} / ${total} ───${RESET}  [${q.id.slice(0, 8)}]`);
  console.log(`${DIM}Type: ${q.type}  |  Difficulté: ${q.difficulty}  |  Page: ${q.page_source ?? "?"}  |  Confiance: ${confidenceColor(q.validation.confidence)}${q.validation.confidence}${RESET}`);
  console.log();
  console.log(`${BOLD}Question :${RESET}`);
  console.log(`  ${q.content}`);
  console.log();

  if (q.options) {
    console.log(`${BOLD}Options :${RESET}`);
    q.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const marker = opt === q.correct_answer ? " ✓" : "";
      console.log(`  ${letter}. ${opt}${marker}`);
    });
  } else {
    console.log(`${BOLD}Réponse attendue :${RESET} ${q.correct_answer}`);
  }

  console.log();
  console.log(`${DIM}[a] Approuver  [r] Rejeter  [s] Passer  [n] Ajouter note  [q] Quitter${RESET}`);
}

// ---------------------------------------------------------------------------
// Saisie d'une note
// ---------------------------------------------------------------------------

async function promptNote(rl: readline.Interface): Promise<string> {
  return new Promise((resolve) => {
    rl.question("Note de rejet : ", (answer) => resolve(answer.trim()));
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  if (fileIdx === -1 || !args[fileIdx + 1]) {
    console.error("Usage : bun run scripts/validate_questions.ts --file <chemin.json>");
    process.exit(1);
  }
  const filePath = args[fileIdx + 1];

  let data: OutputFile;
  try {
    data = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    console.error(`Impossible de lire : ${filePath}`);
    process.exit(1);
  }

  const pending = data.questions.filter((q) => q.validation.status === "pending");
  const total   = data.questions.length;

  console.log(`Fichier : ${filePath}`);
  console.log(`${total} questions total — ${pending.length} en attente de validation\n`);

  if (pending.length === 0) {
    console.log("Aucune question pending. Rien à faire.");
    process.exit(0);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // Active le mode raw pour capturer les touches une par une
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
  }

  let i = 0;
  let changed = 0;

  const processNext = (): Promise<void> => {
    return new Promise((resolve) => {
      if (i >= pending.length) {
        resolve();
        return;
      }

      const q = pending[i];
      displayQuestion(q, i, pending.length);

      const onKey = async (key: Buffer) => {
        const k = key.toString();

        if (k === "q" || k === "\u0003") {         // q ou Ctrl+C
          process.stdin.removeListener("data", onKey);
          resolve();
          return;
        }

        if (k === "a") {
          q.validation.status = "approved";
          changed++;
          i++;
        } else if (k === "r") {
          process.stdin.removeListener("data", onKey);
          if (process.stdin.setRawMode) process.stdin.setRawMode(false);
          const note = await promptNote(rl);
          if (process.stdin.setRawMode) process.stdin.setRawMode(true);
          q.validation.status = "rejected";
          q.validation.note = note || null;
          changed++;
          i++;
          process.stdin.once("data", () => {}); // flush
          process.stdin.on("data", onKey);
          await processNext();
          process.stdin.removeListener("data", onKey);
          resolve();
          return;
        } else if (k === "s") {
          i++; // reste pending
        } else if (k === "n") {
          process.stdin.removeListener("data", onKey);
          if (process.stdin.setRawMode) process.stdin.setRawMode(false);
          const note = await promptNote(rl);
          if (process.stdin.setRawMode) process.stdin.setRawMode(true);
          q.validation.note = note || null;
          process.stdin.once("data", () => {});
          process.stdin.on("data", onKey);
          displayQuestion(q, i, pending.length);
          return;
        } else {
          return; // touche non reconnue, on ignore
        }

        process.stdin.removeListener("data", onKey);
        await processNext();
        resolve();
      };

      process.stdin.on("data", onKey);
    });
  };

  await processNext();

  if (process.stdin.setRawMode) process.stdin.setRawMode(false);
  rl.close();

  // Sauvegarde
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  const approved = data.questions.filter((q) => q.validation.status === "approved").length;
  const rejected = data.questions.filter((q) => q.validation.status === "rejected").length;
  const stillPending = data.questions.filter((q) => q.validation.status === "pending").length;

  clearLine();
  console.log(`\nSauvegardé → ${filePath}`);
  console.log(`  approved : ${approved}  |  rejected : ${rejected}  |  pending : ${stillPending}`);
  console.log(`  ${changed} question(s) modifiée(s) cette session.`);
}

main().catch((err) => {
  console.error("Erreur :", err.message ?? err);
  process.exit(1);
});
