import { NextResponse } from "next/server";
import { getCurrentUser, SessionUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { error } from "@/lib/api";

export type AuthResult = { user: SessionUser } | NextResponse;

export async function requireAuth(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) return error("Non authentifié", 401);
  return { user };
}

export async function requireEnseignant(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) return error("Non authentifié", 401);
  if (!["enseignant", "admin_tech", "admin_ped"].includes(user.role)) {
    return error("Accès réservé aux enseignants", 403);
  }
  return { user };
}

export async function canManageClasse(
  userId: number,
  classeId: number,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM classe_enseignants
    WHERE classe_id = ${classeId} AND enseignant_id = ${userId}
  `;
  return rows.length > 0;
}

export function isNextResponse(v: AuthResult): v is NextResponse {
  return v instanceof NextResponse;
}
