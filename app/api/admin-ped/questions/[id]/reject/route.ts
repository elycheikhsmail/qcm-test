import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminPed, isNextResponse } from "@/lib/auth-guard";
import { error } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPed();
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const [q] = await sql`DELETE FROM questions WHERE id = ${Number(id)} RETURNING id`;
  if (!q) return error("Question introuvable", 404);
  return NextResponse.json({ ok: true, message: "Question rejetée et supprimée" });
}
