// POST /api/magic-links/classe
// Enseignant génère un magic link rattaché à l'une de ses classes (ENS-04)
// Permet une évaluation ponctuelle anonyme via token.
//
// Body JSON :
// {
//   "classe_id":  number  (obligatoire)
//   "level_id":   number  (optionnel — pré-filtre le quiz)
//   "expires_in": number  (heures, défaut 24, max 720)
//   "max_uses":   number  (défaut 30)
// }

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { requireEnseignant, canManageClasse, isNextResponse } from "@/lib/auth-guard";

type Body = {
  classe_id: number;
  level_id?: number;
  expires_in?: number;
  max_uses?: number;
};

export async function POST(req: Request) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const body = await parseJson<Body>(req);
  if (!body?.classe_id) return error("classe_id est obligatoire");

  const classeId = Number(body.classe_id);
  if (isNaN(classeId)) return error("classe_id invalide");

  // Vérifie que l'enseignant gère cette classe
  const ok = await canManageClasse(user.id, classeId);
  if (!ok) return error("Classe introuvable ou accès refusé", 404);

  const expiresInH = body.expires_in ?? 24;
  const maxUses = body.max_uses ?? 30;

  if (expiresInH <= 0 || expiresInH > 720) {
    return error("expires_in doit être entre 1 et 720 heures");
  }
  if (maxUses < 1 || maxUses > 1000) {
    return error("max_uses doit être entre 1 et 1000");
  }

  const expiresAt = new Date(Date.now() + expiresInH * 3600 * 1000);

  const [row] = await sql<
    { id: number; token: string; expires_at: Date; max_uses: number }[]
  >`
    INSERT INTO magic_links (created_by, classe_id, level_id, expires_at, max_uses)
    VALUES (
      ${user.id},
      ${classeId},
      ${body.level_id ?? null},
      ${expiresAt},
      ${maxUses}
    )
    RETURNING id, token, expires_at, max_uses
  `;

  return json(
    {
      token: row.token,
      url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/?token=${row.token}`,
      expires_at: row.expires_at,
      max_uses: row.max_uses,
      classe_id: classeId,
    },
    201,
  );
}
