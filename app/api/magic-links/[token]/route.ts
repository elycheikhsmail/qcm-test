// GET /api/magic-links/[token]
// Valide un token magic link (expires_at, use_count < max_uses).
// Public : c'est l'élève anonyme qui hit ce endpoint quand il clique.

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";

type MagicLinkRow = {
  id: number;
  token: string;
  level_id: number | null;
  classe_id: number | null;
  expires_at: Date;
  max_uses: number;
  use_count: number;
};

// Next.js 15+ : params est un Promise
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // UUID format — reject early pour ne pas échouer côté DB
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return error("Token invalide", 400);
  }

  const rows = await sql<MagicLinkRow[]>`
    SELECT id, token, level_id, classe_id, expires_at, max_uses, use_count
    FROM magic_links
    WHERE token = ${token}::uuid
    LIMIT 1
  `;
  if (!rows.length) return error("Lien introuvable", 404);

  const link = rows[0];
  if (link.expires_at.getTime() < Date.now()) {
    return error("Lien expiré", 410);
  }
  if (link.use_count >= link.max_uses) {
    return error("Lien épuisé (max_uses atteint)", 410);
  }

  return json({
    token: link.token,
    level_id: link.level_id,
    classe_id: link.classe_id,
    expires_at: link.expires_at,
    remaining_uses: link.max_uses - link.use_count,
  });
}
