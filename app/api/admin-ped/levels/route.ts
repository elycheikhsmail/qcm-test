import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function GET() {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const rows = await sql`SELECT id, name, "order", cycle, branche FROM levels ORDER BY cycle, "order" NULLS LAST, name`;
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const body = await parseJson<{ name: string; order?: number; cycle: string; branche?: string }>(req);
  if (!body?.name) return error("name requis", 400);
  if (!body?.cycle || !["fondamental","college","lycee"].includes(body.cycle)) return error("cycle requis (fondamental | college | lycee)", 400);
  if (body.branche && !["C","D","A","O"].includes(body.branche)) return error("branche invalide (C | D | A | O)", 400);
  if (body.cycle !== "lycee" && body.branche) return error("branche uniquement pour le cycle lycée", 400);

  const [row] = await sql`
    INSERT INTO levels (name, "order", cycle, branche)
    VALUES (${body.name.trim()}, ${body.order ?? null}, ${body.cycle}, ${body.branche ?? null})
    ON CONFLICT (name) DO NOTHING
    RETURNING *
  `;
  if (!row) return error("Niveau déjà existant", 409);
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
