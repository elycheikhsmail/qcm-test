import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireDirecteur, canAccessClasse, isNextResponse } from "@/lib/auth-guard";
import { error } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; test_id: string }> }) {
  const auth = await requireDirecteur();
  if (isNextResponse(auth)) return auth;
  const { user } = auth;

  const { id, test_id } = await params;
  const classeId = Number(id);
  const testId = Number(test_id);

  if (!(await canAccessClasse(user.id, classeId))) {
    return error("Classe non assignée à ce directeur", 403);
  }

  const [test] = await sql`SELECT id, COALESCE(title,'Test #'||id) AS title, question_count FROM tests WHERE id = ${testId}`;
  if (!test) return error("Test introuvable", 404);

  // Stats par question pour les élèves de cette classe
  const questionStats = await sql`
    SELECT q.id, q.content, q.difficulty,
           COUNT(*) AS nb_reponses,
           COUNT(*) FILTER (WHERE a.is_correct) AS nb_correct,
           ROUND(COUNT(*) FILTER (WHERE a.is_correct)::float / NULLIF(COUNT(*),0) * 100, 1) AS taux_reussite,
           ROUND(AVG(a.time_spent_seconds) FILTER (WHERE a.time_spent_seconds IS NOT NULL), 1) AS temps_moyen
    FROM test_questions tq
    JOIN questions q ON q.id = tq.question_id
    LEFT JOIN answers a ON a.question_id = q.id
      AND a.session_id IN (
        SELECT id FROM sessions
        WHERE test_id = ${testId}
          AND eleve_id IN (SELECT eleve_id FROM classe_eleves WHERE classe_id = ${classeId} AND status = 'active')
          AND submitted_at IS NOT NULL
      )
    WHERE tq.test_id = ${testId}
    GROUP BY q.id, tq."order"
    ORDER BY tq."order"
  `;

  // Liste élèves avec note
  const eleves = await sql`
    SELECT u.id, u.first_name, u.last_name,
           s.score,
           ROUND(s.score::float / ${test.question_count} * 20, 1) AS score_sur_20,
           s.submitted_at
    FROM classe_eleves ce
    JOIN users u ON u.id = ce.eleve_id
    LEFT JOIN sessions s ON s.eleve_id = ce.eleve_id AND s.test_id = ${testId} AND s.submitted_at IS NOT NULL
    WHERE ce.classe_id = ${classeId} AND ce.status = 'active'
    ORDER BY u.last_name, u.first_name
  `;

  return NextResponse.json({ ok: true, data: { test, questionStats, eleves } });
}
