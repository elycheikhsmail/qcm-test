// GET /api/tests/:id — détails d'un test + questions snapshot

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireAuth, isNextResponse } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (isNextResponse(guard)) return guard;

  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) return error("id invalide");

  const [test] = await sql`
    SELECT
      t.id,
      t.title,
      t.time_mode,
      t.duration_minutes,
      t.deadline_at,
      t.question_count,
      t.difficulty,
      t.created_by,
      t.created_at,
      s.name  AS subject_name,
      l.name  AS level_name,
      ch.title AS chapter_title
    FROM tests t
    LEFT JOIN subjects  s  ON s.id = t.subject_id
    LEFT JOIN levels    l  ON l.id = t.level_id
    LEFT JOIN chapters  ch ON ch.id = t.chapter_id
    WHERE t.id = ${testId}
  `;
  if (!test) return error("Test introuvable", 404);

  const questions = await sql`
    SELECT
      q.id,
      q.type,
      q.content,
      q.options,
      q.difficulty,
      tq."order"
    FROM test_questions tq
    JOIN questions q ON q.id = tq.question_id
    WHERE tq.test_id = ${testId}
    ORDER BY tq."order"
  `;

  const assignments = await sql`
    SELECT id, target_type, target_id, assigned_at
    FROM test_assignments
    WHERE test_id = ${testId}
    ORDER BY assigned_at DESC
  `;

  return json({ ...test, questions, assignments });
}
