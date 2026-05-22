import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await parseJson<{ name?: string; order?: number; cycle?: string; branche?: string | null }>(req);
  if (!body) return error("Corps invalide", 400);
  if (body.cycle && !["fondamental","college","lycee"].includes(body.cycle)) return error("cycle invalide", 400);
  if (body.branche && !["C","D","A","O"].includes(body.branche)) return error("branche invalide (C | D | A | O)", 400);

  const hasBranche = Object.prototype.hasOwnProperty.call(body, "branche");

  const [row] = hasBranche
    ? await sql`
        UPDATE levels SET
          name    = COALESCE(${body.name ?? null}, name),
          "order" = COALESCE(${body.order ?? null}, "order"),
          cycle   = COALESCE(${body.cycle ?? null}, cycle),
          branche = ${body.branche ?? null}
        WHERE id = ${Number(id)}
        RETURNING *
      `
    : await sql`
        UPDATE levels SET
          name    = COALESCE(${body.name ?? null}, name),
          "order" = COALESCE(${body.order ?? null}, "order"),
          cycle   = COALESCE(${body.cycle ?? null}, cycle)
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
