// POST /api/tests/:id/assignments — assigne un test à une classe ou un élève

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { requireEnseignant, isNextResponse } from "@/lib/auth-guard";

type Body = {
  target_type: "classe" | "eleve";
  target_id: number;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) return error("id invalide");

  const body = await parseJson<Body>(req);
  if (!body?.target_type || !body?.target_id) {
    return error("target_type et target_id sont requis");
  }
  if (!["classe", "eleve"].includes(body.target_type)) {
    return error("target_type invalide");
  }
  if (!Number.isInteger(body.target_id) || body.target_id <= 0) {
    return error("target_id invalide");
  }

  // Vérifier que le test appartient à cet enseignant
  const [test] = await sql`
    SELECT id FROM tests WHERE id = ${testId} AND created_by = ${user.id}
  `;
  if (!test) return error("Test introuvable ou accès refusé", 404);

  // Vérifier que la cible existe
  if (body.target_type === "classe") {
    const [classe] = await sql`SELECT id FROM classes WHERE id = ${body.target_id}`;
    if (!classe) return error("Classe introuvable", 404);
  } else {
    const [eleve] = await sql`
      SELECT id FROM users WHERE id = ${body.target_id} AND role = 'eleve'
    `;
    if (!eleve) return error("Élève introuvable", 404);
  }

  const [assignment] = await sql`
    INSERT INTO test_assignments (test_id, target_type, target_id)
    VALUES (${testId}, ${body.target_type}, ${body.target_id})
    ON CONFLICT (test_id, target_type, target_id) DO NOTHING
    RETURNING id, test_id, target_type, target_id, assigned_at
  `;

  if (!assignment) {
    return json({ message: "Déjà assigné" }, 200);
  }
  return json(assignment, 201);
}
