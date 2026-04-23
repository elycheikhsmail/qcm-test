// GET  /api/etablissements — liste tous les établissements
// POST /api/etablissements — crée un établissement (enseignant ou admin)

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { requireEnseignant, isNextResponse } from "@/lib/auth-guard";

type Body = { nom: string; wilaya: string; ville?: string };

export async function GET() {
  const rows = await sql`
    SELECT id, nom, wilaya, ville FROM etablissements ORDER BY nom
  `;
  return json(rows);
}

export async function POST(req: Request) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;

  const body = await parseJson<Body>(req);
  if (!body?.nom?.trim() || !body?.wilaya?.trim()) {
    return error("nom et wilaya sont obligatoires");
  }

  const [existing] = await sql`
    SELECT id FROM etablissements WHERE nom = ${body.nom.trim()} AND wilaya = ${body.wilaya.trim()}
  `;
  if (existing) return json(existing, 200);

  const [row] = await sql`
    INSERT INTO etablissements (nom, wilaya, ville)
    VALUES (${body.nom.trim()}, ${body.wilaya.trim()}, ${body.ville?.trim() ?? null})
    RETURNING id, nom, wilaya, ville
  `;
  return json(row, 201);
}
