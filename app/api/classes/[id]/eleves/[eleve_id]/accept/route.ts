// POST /api/classes/:id/eleves/:eleve_id/accept
// Enseignant valide une demande d'adhésion (pending → active)

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireEnseignant, canManageClasse, isNextResponse } from "@/lib/auth-guard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; eleve_id: string }> },
) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id, eleve_id } = await params;
  const classeId = parseInt(id, 10);
  const eleveId = parseInt(eleve_id, 10);
  if (isNaN(classeId) || isNaN(eleveId)) return error("Identifiant invalide");

  const ok = await canManageClasse(user.id, classeId);
  if (!ok) return error("Classe introuvable ou accès refusé", 404);

  const [membership] = await sql`
    SELECT status FROM classe_eleves
    WHERE classe_id = ${classeId} AND eleve_id = ${eleveId}
  `;
  if (!membership) return error("Demande introuvable", 404);
  if (membership.status === "active") return error("Élève déjà actif", 409);

  await sql`
    UPDATE classe_eleves
    SET status = 'active'
    WHERE classe_id = ${classeId} AND eleve_id = ${eleveId}
  `;

  return json({ classe_id: classeId, eleve_id: eleveId, status: "active" });
}
