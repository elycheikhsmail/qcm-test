// GET /api/tests/assigned
// Retourne les tests assignés à l'élève (directement ou via ses classes actives)
// Exclut les tests déjà soumis par cet élève

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireAuth, isNextResponse } from "@/lib/auth-guard";

export async function GET() {
  const guard = await requireAuth();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const rows = await sql`
    SELECT DISTINCT ON (t.id)
      t.id,
      t.title,
      t.time_mode,
      t.duration_minutes,
      t.deadline_at,
      t.question_count,
      t.difficulty,
      t.created_at,
      s.name  AS subject_name,
      l.name  AS level_name,
      u.first_name AS enseignant_first_name,
      u.last_name  AS enseignant_last_name,
      ta.target_type,
      ta.assigned_at,
      -- test déjà commencé / soumis ?
      sess.id           AS session_id,
      sess.submitted_at AS session_submitted_at,
      sess.started_at   AS session_started_at
    FROM test_assignments ta
    JOIN tests t ON t.id = ta.test_id
    LEFT JOIN subjects  s ON s.id = t.subject_id
    LEFT JOIN levels    l ON l.id = t.level_id
    LEFT JOIN users     u ON u.id = t.created_by
    LEFT JOIN sessions sess
           ON sess.test_id = t.id
          AND sess.eleve_id = ${user.id}
          AND sess.is_anonymous = FALSE
    WHERE
      -- assigné directement à cet élève
      (ta.target_type = 'eleve' AND ta.target_id = ${user.id})
      OR
      -- assigné à une classe dont l'élève est actif
      (ta.target_type = 'classe' AND ta.target_id IN (
        SELECT classe_id FROM classe_eleves
        WHERE eleve_id = ${user.id} AND status = 'active'
      ))
    ORDER BY t.id, ta.assigned_at DESC
  `;

  return json(rows);
}
