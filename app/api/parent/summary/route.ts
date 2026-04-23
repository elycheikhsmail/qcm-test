import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth, isNextResponse } from "@/lib/auth-guard";
import { error } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;
  const { user } = auth;

  if (!["eleve", "parent"].includes(user.role)) {
    return error("Accès réservé", 403);
  }

  const eleveId = user.id;

  // Moyenne globale + nb tests
  const [agg] = await sql`
    SELECT ROUND(AVG(s.score::float / t.question_count * 20), 1) AS moyenne_globale,
           COUNT(*) AS nb_tests
    FROM sessions s
    JOIN tests t ON t.id = s.test_id
    WHERE s.eleve_id = ${eleveId} AND s.submitted_at IS NOT NULL
  `;

  // 5 derniers tests
  const recent = await sql`
    SELECT s.id AS session_id, COALESCE(t.title, 'Test #' || t.id) AS test_title,
           t.question_count, s.score,
           ROUND(s.score::float / t.question_count * 20, 1) AS score_sur_20,
           s.submitted_at,
           sub.name AS subject_name
    FROM sessions s
    JOIN tests t ON t.id = s.test_id
    LEFT JOIN subjects sub ON sub.id = t.subject_id
    WHERE s.eleve_id = ${eleveId} AND s.submitted_at IS NOT NULL
    ORDER BY s.submitted_at DESC
    LIMIT 5
  `;

  // Indicateurs par matière (moyenne /20)
  const bySubject = await sql`
    SELECT sub.name AS subject_name,
           ROUND(AVG(s.score::float / t.question_count * 20), 1) AS moyenne
    FROM sessions s
    JOIN tests t ON t.id = s.test_id
    LEFT JOIN subjects sub ON sub.id = t.subject_id
    WHERE s.eleve_id = ${eleveId} AND s.submitted_at IS NOT NULL
      AND sub.name IS NOT NULL
    GROUP BY sub.name
    ORDER BY sub.name
  `;

  return NextResponse.json({ ok: true, data: { ...agg, recent, bySubject } });
}
