import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireEnseignant, isNextResponse } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; eleve_id: string }> },
) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id, eleve_id } = await params;
  const testId = Number(id);
  const eleveId = Number(eleve_id);
  if (!Number.isInteger(testId) || testId <= 0) return error("test id invalide");
  if (!Number.isInteger(eleveId) || eleveId <= 0) return error("eleve id invalide");

  const [test] = await sql`
    SELECT t.id, t.title, t.question_count, t.created_by
    FROM tests t WHERE t.id = ${testId}
  `;
  if (!test) return error("Test introuvable", 404);

  const isAdmin = ["admin_tech", "admin_ped"].includes(user.role);
  if (!isAdmin && test.created_by !== user.id) {
    return error("Accès refusé", 403);
  }

  const [eleve] = await sql`
    SELECT id, first_name, last_name, email FROM users WHERE id = ${eleveId}
  `;
  if (!eleve) return error("Élève introuvable", 404);

  const [session] = await sql`
    SELECT
      s.id,
      s.score,
      ROUND((s.score::float / ${test.question_count} * 20)::numeric, 2) AS score_sur_20,
      s.started_at,
      s.submitted_at,
      EXTRACT(EPOCH FROM (s.submitted_at - s.started_at))::int AS duration_seconds
    FROM sessions s
    WHERE s.test_id = ${testId} AND s.eleve_id = ${eleveId} AND s.submitted_at IS NOT NULL
    ORDER BY s.submitted_at DESC
    LIMIT 1
  `;
  if (!session) return error("Aucune session soumise pour cet élève", 404);

  const answers = await sql`
    SELECT
      q.id AS question_id,
      q.content,
      q.type,
      q.options,
      q.correct_answer,
      a.given_answer,
      a.is_correct,
      a.answered_at,
      tq."order"
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    JOIN test_questions tq ON tq.question_id = q.id AND tq.test_id = ${testId}
    WHERE a.session_id = ${session.id}
    ORDER BY tq."order"
  `;

  return json({
    test: { id: test.id, title: test.title, question_count: test.question_count },
    session,
    eleve,
    answers,
  });
}
