import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get("subject_id");
  const levelId = searchParams.get("level_id");

  const rows = await sql`
    SELECT c.id, c.title, c.description, c.subject_id, c.level_id,
           s.name AS subject_name, l.name AS level_name
    FROM chapters c
    JOIN subjects s ON c.subject_id = s.id
    JOIN levels  l ON c.level_id   = l.id
    WHERE TRUE
      ${subjectId ? sql`AND c.subject_id = ${Number(subjectId)}` : sql``}
      ${levelId   ? sql`AND c.level_id   = ${Number(levelId)}`   : sql``}
    ORDER BY s.name, l.name, c.title
  `;
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const body = await parseJson<{ title: string; subject_id: number; level_id: number; description?: string }>(req);
  if (!body?.title || !body.subject_id || !body.level_id) {
    return error("title, subject_id et level_id requis", 400);
  }

  const [row] = await sql`
    INSERT INTO chapters (title, subject_id, level_id, description)
    VALUES (${body.title.trim()}, ${body.subject_id}, ${body.level_id}, ${body.description ?? null})
    ON CONFLICT (subject_id, level_id, title) DO NOTHING
    RETURNING *
  `;
  if (!row) return error("Chapitre déjà existant", 409);
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
