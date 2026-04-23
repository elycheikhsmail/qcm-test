import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function GET() {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const rows = await sql`SELECT id, name, language FROM subjects ORDER BY name`;
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const body = await parseJson<{ name: string; language?: string }>(req);
  if (!body?.name) return error("name requis", 400);

  const [row] = await sql`
    INSERT INTO subjects (name, language)
    VALUES (${body.name.trim()}, ${body.language ?? "fr"})
    ON CONFLICT (name, language) DO NOTHING
    RETURNING *
  `;
  if (!row) return error("Matière déjà existante", 409);
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
