// POST /api/magic-links — crée un lien magique (admin-only)
//
// Body JSON :
// {
//   "level_id":   number  (optionnel — permet de pré-filtrer le quiz)
//   "classe_id":  number  (optionnel)
//   "expires_in": number  (heures, défaut 24)
//   "max_uses":   number  (défaut 1)
// }
//
// Renvoie : { token, url, expires_at, max_uses }

import { sql } from "@/lib/db";
import { json, error, parseJson, requireAdmin } from "@/lib/api";

type Body = {
  level_id?: number;
  classe_id?: number;
  expires_in?: number; // heures
  max_uses?: number;
};

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = (await parseJson<Body>(req)) ?? {};
  const expiresInH = body.expires_in ?? 24;
  const maxUses = body.max_uses ?? 1;

  if (expiresInH <= 0 || expiresInH > 24 * 30) {
    return error("expires_in doit être entre 1 et 720 heures");
  }
  if (maxUses < 1 || maxUses > 1000) {
    return error("max_uses doit être entre 1 et 1000");
  }

  // Récupère l'id admin seed
  const [admin] = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE role = 'admin_tech' ORDER BY id LIMIT 1
  `;

  const expiresAt = new Date(Date.now() + expiresInH * 3600 * 1000);

  const [row] = await sql<
    { id: number; token: string; expires_at: Date; max_uses: number }[]
  >`
    INSERT INTO magic_links (created_by, level_id, classe_id, expires_at, max_uses)
    VALUES (
      ${admin?.id ?? null},
      ${body.level_id ?? null},
      ${body.classe_id ?? null},
      ${expiresAt},
      ${maxUses}
    )
    RETURNING id, token, expires_at, max_uses
  `;

  return json(
    {
      token: row.token,
      url: `/quiz/${row.token}`,
      expires_at: row.expires_at,
      max_uses: row.max_uses,
    },
    201,
  );
}
