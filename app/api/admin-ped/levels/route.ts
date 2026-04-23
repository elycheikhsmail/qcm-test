import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function GET() {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const rows = await sql`SELECT id, name, "order" FROM levels ORDER BY "order" NULLS LAST, name`;
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const body = await parseJson<{ name: string; order?: number }>(req);
  if (!body?.name) return error("name requis", 400);

  const [row] = await sql`
    INSERT INTO levels (name, "order")
    VALUES (${body.name.trim()}, ${body.order ?? null})
    ON CONFLICT (name) DO NOTHING
    RETURNING *
  `;
  if (!row) return error("Niveau déjà existant", 409);
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
