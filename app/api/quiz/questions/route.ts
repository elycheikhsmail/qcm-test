// GET /api/quiz/questions?chapter_id=1&difficulty=moyen&limit=10
// Renvoie N questions aléatoires validées (sans correct_answer).

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

type Row = {
  id: number;
  type: "qcm" | "true_false" | "matching" | "fill_blank";
  content: string;
  options: unknown | null;
  difficulty: "facile" | "moyen" | "difficile";
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const chapterId = Number(searchParams.get("chapter_id"));
  if (!Number.isInteger(chapterId) || chapterId <= 0) {
    return error("chapter_id requis (entier positif)");
  }

  const difficultyParam = searchParams.get("difficulty");
  const validDifficulties = ["facile", "moyen", "difficile"] as const;
  type Difficulty = (typeof validDifficulties)[number];
  if (difficultyParam && !validDifficulties.includes(difficultyParam as Difficulty)) {
    return error("difficulty invalide : facile | moyen | difficile");
  }
  const difficulty = difficultyParam as Difficulty | null;

  const limitParam = Number(searchParams.get("limit") ?? "10");
  if (!Number.isInteger(limitParam) || limitParam < 1 || limitParam > 100) {
    return error("limit doit être entre 1 et 100");
  }

  const rows = await sql<Row[]>`
    SELECT id, type, content, options, difficulty
    FROM questions
    WHERE chapter_id = ${chapterId}
      AND validated = TRUE
      ${difficulty ? sql`AND difficulty = ${difficulty}` : sql``}
    ORDER BY random()
    LIMIT ${limitParam}
  `;

  return json(rows);
}
