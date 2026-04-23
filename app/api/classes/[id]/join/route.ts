// POST /api/classes/:id/join — élève envoie une demande d'adhésion (status=pending)
// Réservé aux élèves authentifiés

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireAuth, isNextResponse } from "@/lib/auth-guard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  if (user.role !== "eleve") {
    return error("Réservé aux élèves", 403);
  }

  const { id } = await params;
  const classeId = parseInt(id, 10);
  if (isNaN(classeId)) return error("Identifiant invalide");

  // Vérifie que la classe existe
  const [classe] = await sql`SELECT id, nom FROM classes WHERE id = ${classeId}`;
  if (!classe) return error("Classe introuvable", 404);

  // Vérifie doublon
  const [existing] = await sql`
    SELECT status FROM classe_eleves
    WHERE classe_id = ${classeId} AND eleve_id = ${user.id}
  `;
  if (existing) {
    return error(
      existing.status === "pending"
        ? "Demande déjà envoyée, en attente de validation"
        : existing.status === "active"
          ? "Vous êtes déjà membre de cette classe"
          : "Vous avez été retiré de cette classe",
      409,
    );
  }

  await sql`
    INSERT INTO classe_eleves (classe_id, eleve_id, status)
    VALUES (${classeId}, ${user.id}, 'pending')
  `;

  return json({ classe_id: classeId, status: "pending" }, 201);
}
