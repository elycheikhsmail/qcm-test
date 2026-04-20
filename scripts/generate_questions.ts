/**
 * generate_questions.ts
 *
 * Lit un PDF de manuel scolaire mauritanien et génère des questions
 * pédagogiques via l'API Claude, au format JSON intermédiaire défini dans
 * spec/format_questions_schema.ts.
 *
 * Usage :
 *   bun run scripts/generate_questions.ts \
 *     --pdf ./src_pedagogique/maths/Fondamental/1AF/Math_1AP_Manuel_eleve.pdf \
 *     --niveau 1AF \
 *     --chapitre-num 1 \
 *     --chapitre-titre "Les nombres de 0 à 10" \
 *     [--pages 12-24] \
 *     [--langue fr|ar] \
 *     [--option C|D] \
 *     [--count 15] \
 *     [--enrich] \
 *     [--model claude-opus-4-6]
 *
 * Variables d'env requises :
 *   ANTHROPIC_API_KEY
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { existsSync } from "fs";
import { basename } from "path";

// ---------------------------------------------------------------------------
// Types (alignés sur spec/format_questions_schema.ts)
// ---------------------------------------------------------------------------

type QuestionType   = "qcm" | "true_false" | "fill_blank";
type ValidationStatus = "pending" | "approved" | "rejected";
type Confidence     = "high" | "medium" | "low";
type Langue         = "fr" | "ar";
type GeneratedBy    = "claude_code" | "claude_cowork";
type Cycle          = "Fondamental" | "Secondaire 1er cycle" | "Secondaire 2ème cycle";
type NiveauCode     = "1AF"|"2AF"|"3AF"|"4AF"|"5AF"|"6AF"
                    | "1AS"|"2AS"|"3AS"|"4AS"
                    | "5AS"|"6AS"|"7AS";

interface QuestionEnrichissement {
  explication: string;
  indice: string;
  tags: string[];
  enrichi_par: GeneratedBy;
  enrichi_at: string;
}

interface QuestionValidation {
  status: ValidationStatus;
  confidence: Confidence;
  reviewer_notes: string;
}

interface Question {
  id: string;
  type: QuestionType;
  langue: Langue;
  content: string;
  options: string[] | null;
  correct_answer: string;
  difficulty: 1 | 2 | 3;
  page_source: number | null;
  enrichissement: QuestionEnrichissement | null;
  validation: QuestionValidation;
}

interface QuestionBatchMeta {
  generated_at: string;
  generated_by: GeneratedBy;
  source_file: string;
  niveau_code: NiveauCode;
  niveau_label: string;
  cycle: Cycle;
  option: "C" | "D" | null;
  chapitre_titre: string;
  chapitre_numero: number;
  langue_principale: Langue;
  total_questions: number;
}

interface QuestionBatch {
  _comment: string;
  _version: string;
  _doc: string;
  meta: QuestionBatchMeta;
  questions: Question[];
}

// ---------------------------------------------------------------------------
// Dérivation niveau_label / cycle depuis niveau_code
// ---------------------------------------------------------------------------

const NIVEAU_INFO: Record<NiveauCode, { label: string; cycle: Cycle }> = {
  "1AF": { label: "1ère année Fondamentale",             cycle: "Fondamental" },
  "2AF": { label: "2ème année Fondamentale",             cycle: "Fondamental" },
  "3AF": { label: "3ème année Fondamentale",             cycle: "Fondamental" },
  "4AF": { label: "4ème année Fondamentale",             cycle: "Fondamental" },
  "5AF": { label: "5ème année Fondamentale",             cycle: "Fondamental" },
  "6AF": { label: "6ème année Fondamentale",             cycle: "Fondamental" },
  "1AS": { label: "1ère année Secondaire",               cycle: "Secondaire 1er cycle" },
  "2AS": { label: "2ème année Secondaire",               cycle: "Secondaire 1er cycle" },
  "3AS": { label: "3ème année Secondaire",               cycle: "Secondaire 1er cycle" },
  "4AS": { label: "4ème année Secondaire",               cycle: "Secondaire 1er cycle" },
  "5AS": { label: "5ème année Secondaire",               cycle: "Secondaire 2ème cycle" },
  "6AS": { label: "6ème année Secondaire",               cycle: "Secondaire 2ème cycle" },
  "7AS": { label: "7ème année Secondaire (Terminale)",   cycle: "Secondaire 2ème cycle" },
};

function niveauInfo(code: string): { label: string; cycle: Cycle } {
  const info = NIVEAU_INFO[code as NiveauCode];
  if (!info) {
    console.error(`Niveau inconnu : "${code}". Valeurs valides : ${Object.keys(NIVEAU_INFO).join(", ")}`);
    process.exit(1);
  }
  return info;
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        args[key] = argv[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function requireArg(args: Record<string, string | boolean>, key: string): string {
  const val = args[key];
  if (!val || typeof val !== "string") {
    console.error(`Erreur : --${key} est requis.`);
    process.exit(1);
  }
  return val;
}

// ---------------------------------------------------------------------------
// Prompt système — génération
// ---------------------------------------------------------------------------

function buildGenerationPrompt(
  niveauCode: string,
  niveauLabel: string,
  chapTitre: string,
  langue: Langue,
  count: number,
  option: string | null
): string {
  const langueInstr = langue === "ar"
    ? "Rédige toutes les questions et réponses en arabe (script arabe)."
    : "Rédige toutes les questions et réponses en français.";

  return `Tu es un expert en pédagogie mauritanienne, spécialisé en mathématiques.
Tu génères des questions d'auto-évaluation depuis des manuels scolaires officiels mauritaniens.

CONTEXTE :
- Niveau : ${niveauLabel} (${niveauCode}${option ? `, option ${option}` : ""})
- Chapitre : ${chapTitre}
- ${langueInstr}

RÈGLES STRICTES :
1. Génère exactement ${count} questions basées UNIQUEMENT sur le contenu du PDF fourni.
2. Ne jamais inventer de faits, chiffres ou définitions absents du texte.
3. Répartition obligatoire : au moins 40 % QCM, 20 % true_false, 20 % fill_blank.
4. Chaque QCM a exactement 4 options, une seule bonne réponse, des distracteurs plausibles.
5. Chaque fill_blank a UN SEUL blanc (marqué ___), la réponse est un mot ou courte expression.
6. Confidence :
   - "high"   → réponse univoque, directement citée dans le texte
   - "medium" → reformulation ou réponse partiellement inférée
   - "low"    → implique des chiffres, formules ou calculs — à vérifier impérativement
7. Difficulté :
   - 1 → application directe du cours
   - 2 → raisonnement en une étape
   - 3 → raisonnement multi-étapes
8. page_source : numéro de page estimé dans le PDF, ou null si incertain.

FORMAT DE RÉPONSE — OBLIGATOIRE :
Réponds UNIQUEMENT avec un bloc <json>...</json> contenant un tableau JSON.
Aucun texte avant ou après les balises.

Structure attendue :
<json>
[
  {
    "type": "qcm",
    "content": "Texte de la question ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "difficulty": 1,
    "page_source": 12,
    "confidence": "high"
  },
  {
    "type": "true_false",
    "content": "Affirmation à évaluer.",
    "options": null,
    "correct_answer": "true",
    "difficulty": 1,
    "page_source": 14,
    "confidence": "high"
  },
  {
    "type": "fill_blank",
    "content": "La ___ est la base du système décimal.",
    "options": null,
    "correct_answer": "dizaine",
    "difficulty": 2,
    "page_source": null,
    "confidence": "medium"
  }
]
</json>`;
}

// ---------------------------------------------------------------------------
// Prompt système — enrichissement
// ---------------------------------------------------------------------------

function buildEnrichPrompt(langue: Langue): string {
  const langInstr = langue === "ar"
    ? "Réponds en arabe pour explication et indice."
    : "Réponds en français pour explication et indice.";

  return `Tu enrichis des questions pédagogiques avec des métadonnées d'apprentissage.
${langInstr}

Pour chaque question reçue, fournis :
- "explication" : pourquoi la réponse est correcte (1-2 phrases, affiché après correction).
- "indice" : aide courte pour un élève bloqué (1 phrase).
- "tags" : 2-4 mots-clés des notions couvertes (tableau de strings).

FORMAT DE RÉPONSE — OBLIGATOIRE :
Réponds UNIQUEMENT avec <json>...</json>, tableau dans le même ordre que l'entrée.

<json>
[
  { "explication": "...", "indice": "...", "tags": ["notion1", "notion2"] }
]
</json>`;
}

// ---------------------------------------------------------------------------
// Extraction du JSON depuis la réponse Claude
// ---------------------------------------------------------------------------

function extractJson<T>(text: string, context: string): T {
  const match = text.match(/<json>([\s\S]*?)<\/json>/);
  if (!match) {
    console.error(`\n[${context}] Réponse Claude sans bloc <json>...</json> :`);
    console.error(text.slice(0, 2000));
    process.exit(1);
  }
  try {
    return JSON.parse(match[1].trim()) as T;
  } catch {
    console.error(`\n[${context}] JSON invalide dans la réponse Claude :`);
    console.error(match[1].slice(0, 2000));
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Appel Claude — génération brute
// ---------------------------------------------------------------------------

interface RawQuestion {
  type: QuestionType;
  content: string;
  options: string[] | null;
  correct_answer: string;
  difficulty: 1 | 2 | 3;
  page_source: number | null;
  confidence: Confidence;
}

async function callGenerateQuestions(
  client: Anthropic,
  pdfBase64: string,
  pdfFilename: string,
  niveauCode: string,
  niveauLabel: string,
  chapTitre: string,
  pages: string | null,
  langue: Langue,
  option: string | null,
  count: number,
  model: string
): Promise<RawQuestion[]> {
  const pagesContext = pages ? `\n\nConcentre-toi sur les pages ${pages} du PDF.` : "";

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: buildGenerationPrompt(niveauCode, niveauLabel, chapTitre, langue, count, option),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
            title: `${pdfFilename} — ${niveauLabel}`,
          },
          {
            type: "text",
            text: `Génère ${count} questions sur le chapitre "${chapTitre}" de ce manuel.${pagesContext}`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJson<RawQuestion[]>(text, "génération");
}

// ---------------------------------------------------------------------------
// Appel Claude — enrichissement
// ---------------------------------------------------------------------------

interface EnrichResult {
  explication: string;
  indice: string;
  tags: string[];
}

async function callEnrichQuestions(
  client: Anthropic,
  questions: Question[],
  langue: Langue,
  model: string
): Promise<EnrichResult[]> {
  const payload = questions.map((q) => ({
    type: q.type,
    content: q.content,
    correct_answer: q.correct_answer,
  }));

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: buildEnrichPrompt(langue),
    messages: [
      {
        role: "user",
        content: `Enrichis ces ${questions.length} questions :\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJson<EnrichResult[]>(text, "enrichissement");
}

// ---------------------------------------------------------------------------
// Construction de l'id temporaire : tmp_{niveau}_ch{nn}_{xxx}
// ---------------------------------------------------------------------------

function buildTempId(niveauCode: string, chapNum: number, index: number): string {
  const chap = String(chapNum).padStart(2, "0");
  const idx  = String(index + 1).padStart(3, "0");
  return `tmp_${niveauCode}_ch${chap}_${idx}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const pdfPath    = requireArg(args, "pdf");
  const niveauCode = requireArg(args, "niveau");
  const chapNumStr = requireArg(args, "chapitre-num");
  const chapTitre  = requireArg(args, "chapitre-titre");
  const langue     = ((args.langue as string) ?? "fr") as Langue;
  const option     = (args.option as string) ?? null;
  const pages      = (args.pages as string) ?? null;
  const count      = parseInt((args.count as string) ?? "15", 10);
  const doEnrich   = args.enrich === true;
  const model      = (args.model as string) ?? "claude-opus-4-6";
  const chapNum    = parseInt(chapNumStr, 10);

  if (isNaN(chapNum) || chapNum < 1) {
    console.error("--chapitre-num doit être un entier positif.");
    process.exit(1);
  }

  const { label: niveauLabel, cycle } = niveauInfo(niveauCode);

  // --- Lecture PDF ---
  if (!existsSync(pdfPath)) {
    console.error(`PDF introuvable : ${pdfPath}`);
    process.exit(1);
  }
  const pdfFilename = basename(pdfPath);
  console.log(`PDF : ${pdfPath}`);
  const pdfBase64 = readFileSync(pdfPath).toString("base64");

  // --- Client Anthropic ---
  const client = new Anthropic(); // lit ANTHROPIC_API_KEY depuis l'env

  // --- Génération ---
  console.log(`Génération de ${count} questions (${model})…`);
  const rawQuestions = await callGenerateQuestions(
    client, pdfBase64, pdfFilename,
    niveauCode, niveauLabel, chapTitre,
    pages, langue, option, count, model
  );
  console.log(`  ${rawQuestions.length} questions générées.`);

  // --- Assemblage ---
  const now = new Date();

  let questions: Question[] = rawQuestions.map((raw, i) => ({
    id: buildTempId(niveauCode, chapNum, i),
    type: raw.type,
    langue,
    content: raw.content,
    options: raw.options ?? null,
    correct_answer: raw.correct_answer,
    difficulty: raw.difficulty,
    page_source: raw.page_source ?? null,
    enrichissement: null,
    validation: {
      status: "pending",
      confidence: raw.confidence,
      reviewer_notes: "",
    },
  }));

  // --- Enrichissement (optionnel) ---
  if (doEnrich) {
    console.log("Enrichissement des questions…");
    const enrichResults = await callEnrichQuestions(client, questions, langue, model);
    if (enrichResults.length !== questions.length) {
      console.warn(
        `Warning : ${enrichResults.length} enrichissements pour ${questions.length} questions.`
      );
    }
    const enrichedAt = new Date().toISOString();
    questions = questions.map((q, i) => ({
      ...q,
      enrichissement: enrichResults[i]
        ? {
            ...enrichResults[i],
            enrichi_par: "claude_code" as GeneratedBy,
            enrichi_at: enrichedAt,
          }
        : null,
    }));
    console.log("  Enrichissement terminé.");
  }

  // --- Construction du batch ---
  const chapSlug = chapTitre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 30);

  const dateStr = now.toISOString().slice(0, 10);
  const outputFileName = `${niveauCode}_ch${String(chapNum).padStart(2, "0")}_${chapSlug}_${dateStr}.json`;
  const outputDir = "output";

  const batch: QuestionBatch = {
    _comment: "Format JSON intermédiaire — questions mathématiques en attente de validation",
    _version: "1.1",
    _doc: "Un fichier = un chapitre. Le script d'import ne traite que les questions { validation.status: 'approved' }.",
    meta: {
      generated_at: now.toISOString(),
      generated_by: "claude_code",
      source_file: pdfFilename,
      niveau_code: niveauCode as NiveauCode,
      niveau_label: niveauLabel,
      cycle,
      option: option as "C" | "D" | null,
      chapitre_titre: chapTitre,
      chapitre_numero: chapNum,
      langue_principale: langue,
      total_questions: questions.length,
    },
    questions,
  };

  // --- Écriture ---
  mkdirSync(outputDir, { recursive: true });
  const outputPath = `${outputDir}/${outputFileName}`;

  if (existsSync(outputPath)) {
    console.warn(`Warning : écrasement du fichier existant → ${outputPath}`);
  }

  writeFileSync(outputPath, JSON.stringify(batch, null, 2), "utf-8");

  console.log(`\nFichier écrit : ${outputPath}`);
  console.log(`  ${questions.length} questions — status: pending`);
  if (!doEnrich) {
    console.log(`  Enrichissement non fait (relancer avec --enrich si souhaité)`);
  }
  console.log(`\nProchaine étape :`);
  console.log(`  bun run scripts/validate_questions.ts --file ${outputPath}`);
}

main().catch((err) => {
  console.error("Erreur fatale :", (err as Error).message ?? err);
  process.exit(1);
});
