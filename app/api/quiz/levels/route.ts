// GET /api/quiz/levels?subject_id=1
// Liste des niveaux ayant au moins une question validée
// (optionnellement filtrés par matière).

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectIdRaw = searchParams.get("subject_id");
  const subjectId = subjectIdRaw ? Number(subjectIdRaw) : null;

  if (subjectIdRaw !== null && (!Number.isInteger(subjectId) || subjectId! <= 0)) {
    return error("subject_id doit être un entier positif");
  }

  const rows = subjectId
    ? await sql<{ id: number; name: string; order: number; nb_questions: number }[]>`
        SELECT
          l.id,
          l.name,
          l."order",
          COUNT(q.id)::int AS nb_questions
        FROM levels l
        LEFT JOIN chapters ch ON ch.level_id = l.id AND ch.subject_id = ${subjectId}
        LEFT JOIN questions q ON q.chapter_id = ch.id AND q.validated = TRUE
        GROUP BY l.id
        HAVING COUNT(q.id) > 0
        ORDER BY l."order"
      `
    : await sql<{ id: number; name: string; order: number; nb_questions: number }[]>`
        SELECT
          l.id,
          l.name,
          l."order",
          COUNT(q.id)::int AS nb_questions
        FROM levels l
        LEFT JOIN chapters ch ON ch.level_id = l.id
        LEFT JOIN questions q ON q.chapter_id = ch.id AND q.validated = TRUE
        GROUP BY l.id
        ORDER BY l."order"
      `;

  return json(rows);
}
