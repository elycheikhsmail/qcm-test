import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await parseJson<{ name?: string; order?: number }>(req);
  if (!body) return error("Corps invalide", 400);

  const [row] = await sql`
    UPDATE levels SET
      name    = COALESCE(${body.name ?? null}, name),
      "order" = COALESCE(${body.order ?? null}, "order")
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return error("Niveau introuvable", 404);
  return NextResponse.json({ ok: true, data: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const [row] = await sql`DELETE FROM levels WHERE id = ${Number(id)} RETURNING id`;
  if (!row) return error("Niveau introuvable", 404);
  return NextResponse.json({ ok: true });
}
