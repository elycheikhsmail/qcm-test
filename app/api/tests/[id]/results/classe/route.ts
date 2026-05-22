import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireEnseignant, isNextResponse, canManageClasse } from "@/lib/auth-guard";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) return error("id invalide");

  const url = new URL(req.url);
  const classeIdStr = url.searchParams.get("classe_id");
  const classeId = classeIdStr ? Number(classeIdStr) : null;

  const [test] = await sql`
    SELECT t.id, t.title, t.question_count, t.created_by
    FROM tests t WHERE t.id = ${testId}
  `;
  if (!test) return error("Test introuvable", 404);

  const isAdmin = ["admin_tech", "admin_ped"].includes(user.role);
  if (!isAdmin && test.created_by !== user.id) {
    return error("Accès refusé — ce test ne vous appartient pas", 403);
  }

  if (classeId) {
    const ok = await canManageClasse(user.id, classeId);
    if (!ok && !isAdmin) return error("Accès refusé — cette classe ne vous appartient pas", 403);
  }

  const classeFilter = classeId
    ? sql`AND s.eleve_id IN (SELECT eleve_id FROM classe_eleves WHERE classe_id = ${classeId} AND status = 'active')`
    : sql``;

  const [agg] = await sql`
    SELECT
      COUNT(*)::int AS nb_eleves,
      ROUND((AVG(s.score::float / ${test.question_count} * 20))::numeric, 2) AS moyenne,
      ROUND((MIN(s.score::float / ${test.question_count} * 20))::numeric, 2) AS min_score,
      ROUND((MAX(s.score::float / ${test.question_count} * 20))::numeric, 2) AS max_score
    FROM sessions s
    WHERE s.test_id = ${testId}
      AND s.submitted_at IS NOT NULL
      ${classeFilter}
  `;

  const distRows = await sql`
    SELECT
      LEAST(FLOOR(s.score::float / ${test.question_count} * 4), 3)::int AS bucket,
      COUNT(*)::int AS count
    FROM sessions s
    WHERE s.test_id = ${testId} AND s.submitted_at IS NOT NULL
      ${classeFilter}
    GROUP BY bucket ORDER BY bucket
  `;

  const LABELS = ["0–5", "5–10", "10–15", "15–20"];
  const distribution = [0, 1, 2, 3].map((b) => ({
    bucket: b,
    label: LABELS[b],
    count: (distRows as unknown as { bucket: number; count: number }[]).find((r) => r.bucket === b)?.count ?? 0,
  }));

  const eleves = await sql`
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      s.score,
      ROUND((s.score::float / ${test.question_count} * 20)::numeric, 2) AS score_sur_20,
      s.submitted_at,
      EXTRACT(EPOCH FROM (s.submitted_at - s.started_at))::int AS duration_seconds
    FROM sessions s
    JOIN users u ON u.id = s.eleve_id
    WHERE s.test_id = ${testId} AND s.submitted_at IS NOT NULL
      ${classeFilter}
    ORDER BY s.score DESC, s.submitted_at ASC
  `;

  return json({
    test: { id: test.id, title: test.title, question_count: test.question_count },
    aggregate: agg,
    distribution,
    eleves,
  });
}
