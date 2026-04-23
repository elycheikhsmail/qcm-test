import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await parseJson<{ title?: string; description?: string; subject_id?: number; level_id?: number }>(req);
  if (!body) return error("Corps invalide", 400);

  const [row] = await sql`
    UPDATE chapters SET
      title       = COALESCE(${body.title ?? null}, title),
      description = COALESCE(${body.description ?? null}, description),
      subject_id  = COALESCE(${body.subject_id ?? null}, subject_id),
      level_id    = COALESCE(${body.level_id ?? null}, level_id)
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row) return error("Chapitre introuvable", 404);
  return NextResponse.json({ ok: true, data: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const [row] = await sql`DELETE FROM chapters WHERE id = ${Number(id)} RETURNING id`;
  if (!row) return error("Chapitre introuvable", 404);
  return NextResponse.json({ ok: true });
}
