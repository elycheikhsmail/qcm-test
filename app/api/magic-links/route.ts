// POST /api/magic-links — crée un lien magique
//
// Deux modes d'authentification acceptés :
//   1. Header X-Admin-Token (claude code / CLI / scripts)
//   2. Session authentifiée admin_tech ou admin_ped
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
import { json, error, parseJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

type Body = {
  level_id?: number;
  classe_id?: number;
  expires_in?: number; // heures
  max_uses?: number;
};

export async function POST(req: Request) {
  // Auth : X-Admin-Token OU session admin_tech/admin_ped
  const expectedToken = process.env.ADMIN_TOKEN;
  const headerToken = req.headers.get("x-admin-token");
  const hasAdminToken =
    !!expectedToken && !!headerToken && headerToken === expectedToken;

  let createdBy: number | null = null;

  if (hasAdminToken) {
    const [admin] = await sql<{ id: number }[]>`
      SELECT id FROM users WHERE role = 'admin_tech' ORDER BY id LIMIT 1
    `;
    createdBy = admin?.id ?? null;
  } else {
    const user = await getCurrentUser();
    if (!user) return error("Accès refusé : token admin ou session requise", 401);
    if (!["admin_tech", "admin_ped"].includes(user.role)) {
      return error("Accès réservé aux administrateurs", 403);
    }
    createdBy = user.id;
  }

  const body = (await parseJson<Body>(req)) ?? {};
  const expiresInH = body.expires_in ?? 24;
  const maxUses = body.max_uses ?? 1;

  if (expiresInH <= 0 || expiresInH > 24 * 30) {
    return error("expires_in doit être entre 1 et 720 heures");
  }
  if (maxUses < 1 || maxUses > 1000) {
    return error("max_uses doit être entre 1 et 1000");
  }

  const expiresAt = new Date(Date.now() + expiresInH * 3600 * 1000);

  const [row] = await sql<
    { id: number; token: string; expires_at: Date; max_uses: number }[]
  >`
    INSERT INTO magic_links (created_by, level_id, classe_id, expires_at, max_uses)
    VALUES (
      ${createdBy},
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
      url: `/?token=${row.token}`,
      expires_at: row.expires_at,
      max_uses: row.max_uses,
    },
    201,
  );
}
