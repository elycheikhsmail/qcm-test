// POST /api/quiz/sessions/[id]/submit
// Finalise la session : compte les bonnes réponses, stocke le score,
// met submitted_at. Idempotent : renvoie le score existant si déjà soumise.

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

export async function POST(
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
  if (!session.test_id) return error("Session sans test attaché", 500);

  if (session.submitted_at) {
    // idempotent
    return json({
      session_id: session.id,
      score: session.score,
      submitted_at: session.submitted_at,
      already_submitted: true,
    });
  }

  const [{ total }] = await sql<{ total: number }[]>`
    SELECT COUNT(*)::int AS total
    FROM test_questions WHERE test_id = ${session.test_id}
  `;
  const [{ correct }] = await sql<{ correct: number }[]>`
    SELECT COUNT(*)::int AS correct
    FROM answers
    WHERE session_id = ${sessionId} AND is_correct = TRUE
  `;

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [updated] = await sql<
    { id: number; submitted_at: Date; score: number }[]
  >`
    UPDATE sessions
       SET submitted_at = NOW(),
           score = ${score}
     WHERE id = ${sessionId}
    RETURNING id, submitted_at, score
  `;

  return json({
    session_id: updated.id,
    score: updated.score,
    correct,
    total,
    submitted_at: updated.submitted_at,
    already_submitted: false,
  });
}
