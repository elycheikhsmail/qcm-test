import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireDirecteur, canAccessClasse, isNextResponse } from "@/lib/auth-guard";
import { error } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireDirecteur();
  if (isNextResponse(auth)) return auth;
  const { user } = auth;

  const { id } = await params;
  const classeId = Number(id);

  if (!(await canAccessClasse(user.id, classeId))) {
    return error("Classe non assignée à ce directeur", 403);
  }

  const [classe] = await sql`
    SELECT c.id, c.nom, c.niveau, c.filiere, c.annee_scolaire,
           COUNT(ce.eleve_id) FILTER (WHERE ce.status = 'active') AS nb_eleves
    FROM classes c
    LEFT JOIN classe_eleves ce ON ce.classe_id = c.id
    WHERE c.id = ${classeId}
    GROUP BY c.id
  `;
  if (!classe) return error("Classe introuvable", 404);

  // Tests assignés à cette classe avec stats agrégées
  const tests = await sql`
    SELECT t.id, COALESCE(t.title, 'Test #' || t.id) AS title,
           t.question_count, t.created_at,
           COUNT(s.id) FILTER (WHERE s.submitted_at IS NOT NULL) AS nb_soumis,
           ROUND(AVG(s.score::float / t.question_count * 20) FILTER (WHERE s.submitted_at IS NOT NULL), 1) AS moyenne,
           ROUND(MIN(s.score::float / t.question_count * 20) FILTER (WHERE s.submitted_at IS NOT NULL), 1) AS min_score,
           ROUND(MAX(s.score::float / t.question_count * 20) FILTER (WHERE s.submitted_at IS NOT NULL), 1) AS max_score
    FROM test_assignments ta
    JOIN tests t ON t.id = ta.test_id
    LEFT JOIN sessions s ON s.test_id = t.id
      AND s.eleve_id IN (
        SELECT eleve_id FROM classe_eleves WHERE classe_id = ${classeId} AND status = 'active'
      )
    WHERE ta.target_type = 'classe' AND ta.target_id = ${classeId}
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `;

  return NextResponse.json({ ok: true, data: { classe, tests } });
}
