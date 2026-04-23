import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireDirecteur, isNextResponse } from "@/lib/auth-guard";

export async function GET() {
  const auth = await requireDirecteur();
  if (isNextResponse(auth)) return auth;
  const { user } = auth;

  const rows = await sql`
    SELECT c.id, c.nom, c.niveau, c.filiere, c.annee_scolaire,
           COUNT(ce.eleve_id) FILTER (WHERE ce.status = 'active') AS nb_eleves
    FROM classes c
    JOIN directeur_classes dc ON dc.classe_id = c.id
    LEFT JOIN classe_eleves ce ON ce.classe_id = c.id
    WHERE dc.directeur_id = ${user.id}
    GROUP BY c.id
    ORDER BY c.nom
  `;

  return NextResponse.json({ ok: true, data: rows });
}
