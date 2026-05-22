// POST /api/quiz/answers
// Enregistre la réponse d'une question pour une session.
// Évaluation is_correct côté serveur — comparaison JSON stable (arrays inclus).
//
// Body JSON :
// { "session_id": number, "question_id": number, "given_answer": unknown }
//
// Upsert sur (session_id, question_id) : la dernière réponse écrase la précédente.

import { sql } from "@/lib/db";
import { json, error, parseJson, answersEqual } from "@/lib/api";

type Body = {
  session_id: number;
  question_id: number;
  given_answer: unknown;
};

export async function POST(req: Request) {
  const body = await parseJson<Body>(req);
  if (!body || typeof body !== "object") return error("Body JSON invalide");
  const { session_id, question_id, given_answer } = body;

  if (!Number.isInteger(session_id) || session_id <= 0) {
    return error("session_id invalide");
  }
  if (!Number.isInteger(question_id) || question_id <= 0) {
    return error("question_id invalide");
  }
  if (given_answer === undefined) return error("given_answer manquant");

  // Session doit exister, ne pas être soumise, et contenir la question dans son test snapshot
  const [session] = await sql<
    { test_id: number | null; submitted_at: Date | null }[]
  >`
    SELECT test_id, submitted_at FROM sessions WHERE id = ${session_id} LIMIT 1
  `;
  if (!session) return error("Session introuvable", 404);
  if (session.submitted_at) return error("Session déjà soumise", 409);
  if (!session.test_id) return error("Session sans test attaché", 500);

  const [belongs] = await sql<{ ok: boolean }[]>`
    SELECT TRUE AS ok
    FROM test_questions
    WHERE test_id = ${session.test_id} AND question_id = ${question_id}
    LIMIT 1
  `;
  if (!belongs) return error("Question absente de cette session", 400);

  const [q] = await sql<{ correct_answer: unknown }[]>`
    SELECT correct_answer FROM questions WHERE id = ${question_id} LIMIT 1
  `;
  if (!q) return error("Question introuvable", 404);

  const correctAnswer =
    typeof q.correct_answer === "string" ? JSON.parse(q.correct_answer) : q.correct_answer;
  const isCorrect = answersEqual(given_answer, correctAnswer);
  const givenJson = JSON.stringify(given_answer);

  await sql`
    INSERT INTO answers (session_id, question_id, given_answer, is_correct)
    VALUES (${session_id}, ${question_id}, ${givenJson}::jsonb, ${isCorrect})
    ON CONFLICT (session_id, question_id) DO UPDATE SET
      given_answer = EXCLUDED.given_answer,
      is_correct   = EXCLUDED.is_correct,
      answered_at  = NOW()
  `;

  return json({ is_correct: isCorrect });
}
