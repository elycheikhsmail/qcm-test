// GET  /api/classes — mes classes (enseignant : ses classes ; élève : ses classes actives)
// POST /api/classes — crée une classe (enseignant uniquement)

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { requireAuth, requireEnseignant, isNextResponse } from "@/lib/auth-guard";

type CreateBody = {
  nom: string;
  niveau: string;
  filiere?: string;
  annee_scolaire?: string;
  etablissement_id?: number;
};

export async function GET() {
  const guard = await requireAuth();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  if (["enseignant", "admin_tech", "admin_ped"].includes(user.role)) {
    // Enseignant : toutes les classes où il est dans classe_enseignants
    const rows = await sql`
      SELECT
        c.id, c.nom, c.niveau, c.filiere, c.annee_scolaire,
        c.created_at,
        e.nom AS etablissement_nom,
        COUNT(ce.eleve_id) FILTER (WHERE ce.status = 'active')::int  AS nb_eleves,
        COUNT(ce.eleve_id) FILTER (WHERE ce.status = 'pending')::int AS nb_pending
      FROM classes c
      JOIN classe_enseignants ens ON ens.classe_id = c.id AND ens.enseignant_id = ${user.id}
      LEFT JOIN etablissements e ON e.id = c.etablissement_id
      LEFT JOIN classe_eleves ce ON ce.classe_id = c.id
      GROUP BY c.id, e.nom
      ORDER BY c.created_at DESC
    `;
    return json(rows);
  }

  // Élève : classes où il est actif ou en attente
  const rows = await sql`
    SELECT
      c.id, c.nom, c.niveau, c.filiere, c.annee_scolaire,
      e.nom AS etablissement_nom,
      ce.status,
      ce.joined_at
    FROM classe_eleves ce
    JOIN classes c ON c.id = ce.classe_id
    LEFT JOIN etablissements e ON e.id = c.etablissement_id
    WHERE ce.eleve_id = ${user.id}
    ORDER BY ce.joined_at DESC
  `;
  return json(rows);
}

export async function POST(req: Request) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const body = await parseJson<CreateBody>(req);
  if (!body?.nom?.trim() || !body?.niveau?.trim()) {
    return error("nom et niveau sont obligatoires");
  }

  const annee = body.annee_scolaire?.trim() ?? "2025-2026";

  // Vérifie doublon
  const [dup] = await sql`
    SELECT id FROM classes
    WHERE nom = ${body.nom.trim()} AND annee_scolaire = ${annee} AND created_by = ${user.id}
  `;
  if (dup) return error("Une classe avec ce nom existe déjà pour cette année", 409);

  const [classe] = await sql`
    INSERT INTO classes (nom, niveau, filiere, annee_scolaire, etablissement_id, created_by)
    VALUES (
      ${body.nom.trim()},
      ${body.niveau.trim()},
      ${body.filiere?.trim() ?? null},
      ${annee},
      ${body.etablissement_id ?? null},
      ${user.id}
    )
    RETURNING id, nom, niveau, filiere, annee_scolaire, etablissement_id, created_at
  `;

  // Ajoute l'enseignant créateur dans classe_enseignants
  await sql`
    INSERT INTO classe_enseignants (classe_id, enseignant_id)
    VALUES (${classe.id}, ${user.id})
    ON CONFLICT DO NOTHING
  `;

  return json(classe, 201);
}
