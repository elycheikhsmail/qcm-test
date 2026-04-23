import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireDirecteur, isNextResponse } from "@/lib/auth-guard";
import { error } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireDirecteur();
  if (isNextResponse(auth)) return auth;
  const { user } = auth;

  const { id } = await params;
  const eleveId = Number(id);

  // Vérifier que l'élève appartient à une classe du directeur
  const [access] = await sql`
    SELECT 1 FROM classe_eleves ce
    JOIN directeur_classes dc ON dc.classe_id = ce.classe_id
    WHERE ce.eleve_id = ${eleveId} AND dc.directeur_id = ${user.id} AND ce.status = 'active'
  `;
  if (!access) return error("Élève non accessible", 403);

  const [eleve] = await sql`
    SELECT id, first_name, last_name, email FROM users WHERE id = ${eleveId}
  `;
  if (!eleve) return error("Élève introuvable", 404);

  // Tous ses tests avec scores
  const sessions = await sql`
    SELECT s.id AS session_id, s.test_id,
           COALESCE(t.title, 'Test #' || t.id) AS test_title,
           t.question_count,
           s.score,
           ROUND(s.score::float / t.question_count * 20, 1) AS score_sur_20,
           s.submitted_at,
           s.started_at,
           sub.name AS subject_name
    FROM sessions s
    JOIN tests t ON t.id = s.test_id
    LEFT JOIN subjects sub ON sub.id = t.subject_id
    WHERE s.eleve_id = ${eleveId} AND s.submitted_at IS NOT NULL
    ORDER BY s.submitted_at DESC
    LIMIT 50
  `;

  // Moyenne globale
  const [agg] = await sql`
    SELECT ROUND(AVG(s.score::float / t.question_count * 20), 1) AS moyenne_globale,
           COUNT(*) AS nb_tests
    FROM sessions s
    JOIN tests t ON t.id = s.test_id
    WHERE s.eleve_id = ${eleveId} AND s.submitted_at IS NOT NULL
  `;

  return NextResponse.json({ ok: true, data: { eleve, sessions, ...agg } });
}
