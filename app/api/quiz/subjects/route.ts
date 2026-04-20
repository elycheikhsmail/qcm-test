// GET /api/quiz/subjects — liste des matières actives (= au moins 1 chapitre avec questions).
// Utilisé par le parcours élève anonyme pour le sélecteur de matière.

import { sql } from "@/lib/db";
import { json } from "@/lib/api";

export async function GET() {
  const rows = await sql<
    { id: number; name: string; language: string; nb_questions: number }[]
  >`
    SELECT
      s.id,
      s.name,
      s.language,
      COUNT(q.id)::int AS nb_questions
    FROM subjects s
    LEFT JOIN chapters ch ON ch.subject_id = s.id
    LEFT JOIN questions q ON q.chapter_id = ch.id AND q.validated = TRUE
    GROUP BY s.id
    ORDER BY s.name
  `;
  return json(rows);
}
