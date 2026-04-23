import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { parseJson, error } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const [q] = await sql`
    SELECT q.*, c.title AS chapter_title, s.name AS subject_name, l.name AS level_name
    FROM questions q
    JOIN chapters c ON q.chapter_id = c.id
    JOIN subjects s ON c.subject_id = s.id
    JOIN levels  l ON c.level_id   = l.id
    WHERE q.id = ${Number(id)}
  `;
  if (!q) return error("Question introuvable", 404);
  return NextResponse.json({ ok: true, data: q });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await parseJson<{
    content?: string;
    options?: unknown;
    correct_answer?: unknown;
    difficulty?: string;
    chapter_id?: number;
  }>(req);
  if (!body) return error("Corps invalide", 400);

  const { content, options, correct_answer, difficulty, chapter_id } = body;

  const [q] = await sql`
    UPDATE questions SET
      content        = COALESCE(${content ?? null}, content),
      options        = COALESCE(${options != null ? JSON.stringify(options) : null}::jsonb, options),
      correct_answer = COALESCE(${correct_answer != null ? JSON.stringify(correct_answer) : null}::jsonb, correct_answer),
      difficulty     = COALESCE(${difficulty ?? null}, difficulty),
      chapter_id     = COALESCE(${chapter_id ?? null}, chapter_id)
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!q) return error("Question introuvable", 404);
  return NextResponse.json({ ok: true, data: q });
}
