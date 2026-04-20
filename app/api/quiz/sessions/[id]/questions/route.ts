// GET /api/quiz/sessions/[id]/questions
// Renvoie les questions du snapshot (sans correct_answer) pour jouer le quiz.

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

type Row = {
  id: number;
  type: "qcm" | "true_false" | "matching" | "fill_blank";
  content: string;
  options: unknown | null;
  difficulty: "facile" | "moyen" | "difficile";
  order: number;
};

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
    { id: number; test_id: number | null; submitted_at: Date | null }[]
  >`
    SELECT id, test_id, submitted_at FROM sessions WHERE id = ${sessionId} LIMIT 1
  `;
  if (!session) return error("Session introuvable", 404);
  if (!session.test_id) return error("Session sans test attaché", 500);

  const rows = await sql<Row[]>`
    SELECT q.id, q.type, q.content, q.options, q.difficulty, tq."order"
    FROM test_questions tq
    JOIN questions q ON q.id = tq.question_id
    WHERE tq.test_id = ${session.test_id}
    ORDER BY tq."order"
  `;

  return json({
    session_id: session.id,
    submitted: session.submitted_at !== null,
    questions: rows,
  });
}
