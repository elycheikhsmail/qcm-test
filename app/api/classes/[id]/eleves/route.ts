// POST /api/classes/:id/eleves — ajoute un élève à la classe (par email ou bulk)
// Body : { email: string } OU { emails: string[] }
// Réservé à l'enseignant de la classe

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { requireEnseignant, canManageClasse, isNextResponse } from "@/lib/auth-guard";

type Body = { email?: string; emails?: string[] };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id } = await params;
  const classeId = parseInt(id, 10);
  if (isNaN(classeId)) return error("Identifiant invalide");

  const ok = await canManageClasse(user.id, classeId);
  if (!ok) return error("Classe introuvable ou accès refusé", 404);

  const body = await parseJson<Body>(req);
  if (!body) return error("Corps de requête invalide");

  // Normalise en tableau d'emails
  const rawEmails: string[] = [];
  if (body.email) rawEmails.push(body.email);
  if (body.emails?.length) rawEmails.push(...body.emails);

  const emails = [...new Set(rawEmails.map((e) => e.trim().toLowerCase()))].filter(Boolean);
  if (!emails.length) return error("Au moins un email est requis");

  const results: { email: string; status: string; eleve_id?: number }[] = [];

  for (const email of emails) {
    const [eleve] = await sql<{ id: number }[]>`
      SELECT id FROM users WHERE email = ${email} AND role = 'eleve' AND is_active = TRUE
    `;
    if (!eleve) {
      results.push({ email, status: "not_found" });
      continue;
    }

    const [existing] = await sql`
      SELECT status FROM classe_eleves
      WHERE classe_id = ${classeId} AND eleve_id = ${eleve.id}
    `;
    if (existing) {
      results.push({ email, status: existing.status as string, eleve_id: eleve.id });
      continue;
    }

    await sql`
      INSERT INTO classe_eleves (classe_id, eleve_id, status)
      VALUES (${classeId}, ${eleve.id}, 'active')
    `;
    results.push({ email, status: "added", eleve_id: eleve.id });
  }

  return json({ results }, 201);
}
