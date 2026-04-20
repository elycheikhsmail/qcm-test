// Helpers partagés pour les routes API (S4+).
// Objectif : réponses cohérentes (ok/error), parsing JSON défensif,
// et garde admin basée sur l'en-tête X-Admin-Token.

import { NextResponse } from "next/server";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; details?: unknown };

export function json<T>(data: T, init?: number | ResponseInit): NextResponse {
  const res: ApiOk<T> = { ok: true, data };
  return NextResponse.json(res, typeof init === "number" ? { status: init } : init);
}

export function error(
  message: string,
  status = 400,
  details?: unknown,
): NextResponse {
  const res: ApiErr = { ok: false, error: message };
  if (details !== undefined) res.details = details;
  return NextResponse.json(res, { status });
}

/**
 * Parse le body JSON d'une requête. Retourne `null` si vide ou invalide —
 * laisser l'appelant décider de la réponse (souvent 400 + message adapté).
 */
export async function parseJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Vérifie le header X-Admin-Token contre ADMIN_TOKEN côté serveur.
 * Retourne une NextResponse 401/500 à renvoyer directement si refusé,
 * ou `null` si l'accès est autorisé.
 */
export function requireAdmin(req: Request): NextResponse | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return error("ADMIN_TOKEN non configuré côté serveur", 500);
  }
  const got = req.headers.get("x-admin-token");
  if (!got || got !== expected) {
    return error("Accès admin refusé", 401);
  }
  return null;
}

/** Compare deux valeurs JSON de façon stable (ordre-indépendant pour les tableaux). */
export function answersEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sa = [...a].map((x) => JSON.stringify(x)).sort();
    const sb = [...b].map((x) => JSON.stringify(x)).sort();
    return sa.every((v, i) => v === sb[i]);
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
