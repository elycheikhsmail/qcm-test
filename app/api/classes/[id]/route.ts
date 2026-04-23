// GET /api/classes/:id — détails d'une classe (enseignant ou élève membre)

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireAuth, canManageClasse, isNextResponse } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id } = await params;
  const classeId = parseInt(id, 10);
  if (isNaN(classeId)) return error("Identifiant invalide");

  // Vérifie accès : enseignant de la classe OU élève membre
  const isEnseignant = ["enseignant", "admin_tech", "admin_ped"].includes(user.role);

  if (isEnseignant) {
    const ok = await canManageClasse(user.id, classeId);
    if (!ok) return error("Classe introuvable ou accès refusé", 404);
  } else {
    const [membership] = await sql`
      SELECT 1 FROM classe_eleves
      WHERE classe_id = ${classeId} AND eleve_id = ${user.id}
    `;
    if (!membership) return error("Classe introuvable ou accès refusé", 404);
  }

  const [classe] = await sql`
    SELECT
      c.id, c.nom, c.niveau, c.filiere, c.annee_scolaire, c.created_at,
      e.nom AS etablissement_nom
    FROM classes c
    LEFT JOIN etablissements e ON e.id = c.etablissement_id
    WHERE c.id = ${classeId}
  `;
  if (!classe) return error("Classe introuvable", 404);

  // Élèves actifs
  const eleves = await sql`
    SELECT
      u.id, u.first_name, u.last_name, u.email,
      ce.status, ce.joined_at
    FROM classe_eleves ce
    JOIN users u ON u.id = ce.eleve_id
    WHERE ce.classe_id = ${classeId}
    ORDER BY u.last_name, u.first_name
  `;

  // Enseignants de la classe
  const enseignants = await sql`
    SELECT u.id, u.first_name, u.last_name, u.email
    FROM classe_enseignants ens
    JOIN users u ON u.id = ens.enseignant_id
    WHERE ens.classe_id = ${classeId}
  `;

  return json({ ...classe, eleves, enseignants });
}
