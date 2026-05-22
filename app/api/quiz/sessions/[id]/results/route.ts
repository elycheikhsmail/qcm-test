// GET /api/quiz/sessions/[id]/results
// Renvoie les corrections d'une session soumise :
// pour chaque question : content, options, ta réponse, bonne réponse, is_correct.

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionId = Number(id);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return error("session id invalide");
  }

  const [session] = await sql<
    { id: number; test_id: number | null; submitted_at: Date | null; score: number | null }[]
  >`
    SELECT id, test_id, submitted_at, score FROM sessions WHERE id = ${sessionId} LIMIT 1
  `;
  if (!session) return error("Session introuvable", 404);
  if (!session.submitted_at) return error("Session non soumise", 409);

  const items = await sql<
    {
      question_id: number;
      type: string;
      content: string;
      options: unknown | null;
      difficulty: string;
      order: number;
      correct_answer: unknown;
      given_answer: unknown | null;
      is_correct: boolean | null;
    }[]
  >`
    SELECT
      q.id AS question_id,
      q.type,
      q.content,
      q.options,
      q.difficulty,
      tq."order",
      q.correct_answer,
      a.given_answer,
      a.is_correct
    FROM test_questions tq
    JOIN questions q ON q.id = tq.question_id
    LEFT JOIN answers a ON a.session_id = ${sessionId} AND a.question_id = q.id
    WHERE tq.test_id = ${session.test_id}
    ORDER BY tq."order"
  `;

  const parseJsonb = (v: unknown) =>
    typeof v === "string" ? JSON.parse(v) : v;

  const normalized = items.map((i) => ({
    ...i,
    options: parseJsonb(i.options),
    correct_answer: parseJsonb(i.correct_answer),
    given_answer: parseJsonb(i.given_answer),
  }));

  const correct = normalized.filter((i) => i.is_correct).length;

  return json({
    session_id: session.id,
    score: session.score,
    correct,
    total: normalized.length,
    submitted_at: session.submitted_at,
    items: normalized,
  });
}
