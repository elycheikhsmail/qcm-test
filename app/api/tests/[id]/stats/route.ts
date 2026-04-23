import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireEnseignant, isNextResponse } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) return error("id invalide");

  const [test] = await sql`
    SELECT t.id, t.title, t.question_count, t.created_by
    FROM tests t WHERE t.id = ${testId}
  `;
  if (!test) return error("Test introuvable", 404);

  const isAdmin = ["admin_tech", "admin_ped"].includes(user.role);
  if (!isAdmin && test.created_by !== user.id) {
    return error("Accès refusé", 403);
  }

  const questions = await sql`
    SELECT
      q.id,
      q.content,
      tq."order",
      COUNT(a.id)::int AS nb_reponses,
      COUNT(a.id) FILTER (WHERE a.is_correct)::int AS nb_correctes,
      CASE
        WHEN COUNT(a.id) = 0 THEN 0
        ELSE ROUND(COUNT(a.id) FILTER (WHERE a.is_correct) * 100.0 / COUNT(a.id), 1)
      END AS taux_reussite
    FROM test_questions tq
    JOIN questions q ON q.id = tq.question_id
    LEFT JOIN answers a ON a.question_id = q.id
      AND a.session_id IN (
        SELECT id FROM sessions WHERE test_id = ${testId} AND submitted_at IS NOT NULL
      )
    WHERE tq.test_id = ${testId}
    GROUP BY q.id, q.content, tq."order"
    ORDER BY tq."order"
  `;

  return json({
    test: { id: test.id, title: test.title, question_count: test.question_count },
    questions,
  });
}
