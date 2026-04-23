import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get("subject_id");
  const levelId = searchParams.get("level_id");
  const chapterId = searchParams.get("chapter_id");
  const validated = searchParams.get("validated"); // "true"|"false"|null

  const rows = await sql`
    SELECT q.id, q.content, q.type, q.difficulty, q.validated, q.created_at,
           c.title AS chapter_title,
           s.name  AS subject_name,
           l.name  AS level_name
    FROM questions q
    JOIN chapters c ON q.chapter_id = c.id
    JOIN subjects s ON c.subject_id = s.id
    JOIN levels  l ON c.level_id   = l.id
    WHERE TRUE
      ${subjectId  ? sql`AND s.id = ${Number(subjectId)}`  : sql``}
      ${levelId    ? sql`AND l.id = ${Number(levelId)}`    : sql``}
      ${chapterId  ? sql`AND c.id = ${Number(chapterId)}`  : sql``}
      ${validated === "true"  ? sql`AND q.validated = true`  : sql``}
      ${validated === "false" ? sql`AND q.validated = false` : sql``}
    ORDER BY q.created_at DESC
    LIMIT 200
  `;

  return NextResponse.json({ ok: true, data: rows });
}
