// GET /api/quiz/chapters?subject_id=1&level_id=7
// Liste les chapitres d'une (matière, niveau) avec le nb de questions validées.

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = Number(searchParams.get("subject_id"));
  const levelId = Number(searchParams.get("level_id"));

  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return error("subject_id requis (entier positif)");
  }
  if (!Number.isInteger(levelId) || levelId <= 0) {
    return error("level_id requis (entier positif)");
  }

  const rows = await sql<
    {
      id: number;
      title: string;
      description: string | null;
      nb_questions: number;
      nb_facile: number;
      nb_moyen: number;
      nb_difficile: number;
    }[]
  >`
    SELECT
      ch.id,
      ch.title,
      ch.description,
      COUNT(q.id)::int AS nb_questions,
      COUNT(q.id) FILTER (WHERE q.difficulty = 'facile')::int    AS nb_facile,
      COUNT(q.id) FILTER (WHERE q.difficulty = 'moyen')::int     AS nb_moyen,
      COUNT(q.id) FILTER (WHERE q.difficulty = 'difficile')::int AS nb_difficile
    FROM chapters ch
    LEFT JOIN questions q ON q.chapter_id = ch.id AND q.validated = TRUE
    WHERE ch.subject_id = ${subjectId}
      AND ch.level_id = ${levelId}
    GROUP BY ch.id
    ORDER BY ch.title
  `;

  return json(rows);
}
