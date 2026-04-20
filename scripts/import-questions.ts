// Import un fichier JSON intermédiaire (v1.1) dans PostgreSQL.
// Seules les questions { validation.status: "approved" } sont insérées.
//
// Usage :
//   bun run db:import <chemin.json> [--subject "Mathématiques"] [--dry-run]
//
// Flux :
//   1. Lit + parse le JSON
//   2. Upsert subject (défaut "Mathématiques") + level (depuis meta.niveau_code)
//   3. Upsert chapter (subject_id, level_id, meta.chapitre_titre)
//   4. Pour chaque question "approved" :
//        - mapping difficulty 1/2/3 → facile/moyen/difficile
//        - dédoublonnage par (chapter_id, normalize(content))
//        - INSERT validated=true, source=meta.source_file, created_by=meta.generated_by
//   5. Transaction : tout ou rien par fichier

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

// ─── Types (miroir de spec/format_questions_schema.ts) ────────────────────────
type Difficulty = 1 | 2 | 3;
type QType = "qcm" | "true_false" | "fill_blank" | "matching";

interface JsonQuestion {
  id: string;
  type: QType;
  langue: "fr" | "ar";
  content: string;
  options: string[] | null;
  correct_answer: string;
  difficulty: Difficulty;
  page_source: number | null;
  enrichissement: unknown;
  validation: {
    status: "pending" | "approved" | "rejected";
    confidence: "high" | "medium" | "low";
    reviewer_notes?: string;
  };
}

interface JsonBatch {
  _version: string;
  meta: {
    generated_at: string;
    generated_by: string;
    source_file: string;
    niveau_code: string;
    chapitre_titre: string;
    chapitre_numero: number;
    langue_principale: "fr" | "ar";
  };
  questions: JsonQuestion[];
}

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith("--"));
if (!filePath) {
  console.error("Usage : bun run db:import <chemin.json> [--subject \"Maths\"] [--dry-run]");
  process.exit(1);
}
const subjIdx = args.indexOf("--subject");
const subjectName = subjIdx !== -1 ? args[subjIdx + 1] : "Mathématiques";
const dryRun = args.includes("--dry-run");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquante.");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIFFICULTY_MAP: Record<Difficulty, "facile" | "moyen" | "difficile"> = {
  1: "facile",
  2: "moyen",
  3: "difficile",
};

function normalizeContent(s: string): string {
  // Dédoublonnage tolérant aux espaces multiples et fins de ligne
  return s.replace(/\s+/g, " ").trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const abs = resolve(process.cwd(), filePath);
console.log(`→ Lecture : ${abs}`);

let batch: JsonBatch;
try {
  batch = JSON.parse(readFileSync(abs, "utf8"));
} catch (err) {
  console.error(`❌ JSON invalide : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

const approved = batch.questions.filter((q) => q.validation.status === "approved");
const pending = batch.questions.filter((q) => q.validation.status === "pending").length;
const rejected = batch.questions.filter((q) => q.validation.status === "rejected").length;

console.log(
  `   ${batch.questions.length} questions | approved: ${approved.length} | pending: ${pending} | rejected: ${rejected}`,
);

if (approved.length === 0) {
  console.log("ℹ️  Aucune question 'approved' — rien à importer.");
  process.exit(0);
}

if (dryRun) {
  console.log("🔍 DRY RUN — aucune écriture en base.");
}

const sql = postgres(url, { max: 1, connect_timeout: 10 });

try {
  const result = await sql.begin(async (tx) => {
    // 1. Subject
    await tx`
      INSERT INTO subjects (name, language)
      VALUES (${subjectName}, ${batch.meta.langue_principale})
      ON CONFLICT DO NOTHING
    `;
    const [{ id: subjectId }] = await tx<{ id: number }[]>`
      SELECT id FROM subjects WHERE name = ${subjectName}
    `;

    // 2. Level
    const levelRows = await tx<{ id: number }[]>`
      SELECT id FROM levels WHERE name = ${batch.meta.niveau_code}
    `;
    if (!levelRows.length) {
      throw new Error(
        `Niveau "${batch.meta.niveau_code}" introuvable — lance 'bun run db:seed' d'abord.`,
      );
    }
    const levelId = levelRows[0].id;

    // 3. Chapter (upsert)
    await tx`
      INSERT INTO chapters (subject_id, level_id, title)
      VALUES (${subjectId}, ${levelId}, ${batch.meta.chapitre_titre})
      ON CONFLICT (subject_id, level_id, title) DO NOTHING
    `;
    const [{ id: chapterId }] = await tx<{ id: number }[]>`
      SELECT id FROM chapters
      WHERE subject_id = ${subjectId}
        AND level_id = ${levelId}
        AND title = ${batch.meta.chapitre_titre}
    `;

    console.log(
      `   subject_id=${subjectId} level_id=${levelId} chapter_id=${chapterId}`,
    );

    // 4. Existing contents (pour dédoublonnage)
    const existing = await tx<{ content: string }[]>`
      SELECT content FROM questions WHERE chapter_id = ${chapterId}
    `;
    const existingNorm = new Set(existing.map((r) => normalizeContent(r.content)));

    // 5. Insertion
    let inserted = 0;
    let duplicates = 0;
    for (const q of approved) {
      const norm = normalizeContent(q.content);
      if (existingNorm.has(norm)) {
        duplicates++;
        continue;
      }

      // correct_answer + options → JSONB
      const correctAnswerJson = JSON.stringify(q.correct_answer);
      const optionsJson = q.options ? JSON.stringify(q.options) : null;

      await tx`
        INSERT INTO questions
          (chapter_id, type, content, options, correct_answer, difficulty, source, created_by, validated)
        VALUES
          (${chapterId},
           ${q.type},
           ${q.content},
           ${optionsJson}::jsonb,
           ${correctAnswerJson}::jsonb,
           ${DIFFICULTY_MAP[q.difficulty]},
           ${batch.meta.source_file},
           ${batch.meta.generated_by},
           TRUE)
      `;
      existingNorm.add(norm);
      inserted++;
    }

    if (dryRun) {
      console.log(`🔍 DRY RUN : ${inserted} seraient insérées, ${duplicates} doublons`);
      throw new Error("__DRY_RUN__"); // rollback
    }

    return { subjectId, levelId, chapterId, inserted, duplicates };
  });

  console.log(
    `\n✅ Import OK : ${result.inserted} insérée(s), ${result.duplicates} doublon(s) ignoré(s)`,
  );
} catch (err) {
  if (err instanceof Error && err.message === "__DRY_RUN__") {
    console.log("✅ DRY RUN terminé — aucun changement persisté.");
  } else {
    console.error(`❌ Import échoué : ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
} finally {
  await sql.end();
}
