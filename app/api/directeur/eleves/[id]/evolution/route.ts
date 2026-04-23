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

  const [access] = await sql`
    SELECT 1 FROM classe_eleves ce
    JOIN directeur_classes dc ON dc.classe_id = ce.classe_id
    WHERE ce.eleve_id = ${eleveId} AND dc.directeur_id = ${user.id} AND ce.status = 'active'
  `;
  if (!access) return error("Élève non accessible", 403);

  // Évolution hebdomadaire par matière — 12 dernières semaines
  const rows = await sql`
    SELECT DATE_TRUNC('week', s.submitted_at)::date AS semaine,
           sub.name AS subject_name,
           ROUND(AVG(s.score::float / t.question_count * 20)::numeric, 1) AS moyenne
    FROM sessions s
    JOIN tests t ON t.id = s.test_id
    LEFT JOIN subjects sub ON sub.id = t.subject_id
    WHERE s.eleve_id = ${eleveId}
      AND s.submitted_at IS NOT NULL
      AND s.submitted_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY semaine, sub.name
    ORDER BY semaine, sub.name
  `;

  // Grouper par matière pour le graphique
  const bySubject: Record<string, { semaine: string; moyenne: number }[]> = {};
  for (const r of rows) {
    const key = r.subject_name ?? "Autre";
    if (!bySubject[key]) bySubject[key] = [];
    bySubject[key].push({ semaine: r.semaine, moyenne: Number(r.moyenne) });
  }

  return NextResponse.json({ ok: true, data: bySubject });
}
