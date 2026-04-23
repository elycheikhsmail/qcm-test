import { getCurrentUser } from "@/lib/auth";
import { json, error, parseJson } from "@/lib/api";
import { sql } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Non authentifié", 401);
  return json(user);
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Non authentifié", 401);

  const body = await parseJson<{ first_name?: string; last_name?: string }>(req);
  if (!body) return error("Corps invalide", 400);

  const firstName = body.first_name?.trim();
  const lastName = body.last_name?.trim();

  if (!firstName || !lastName) {
    return error("Prénom et nom sont obligatoires", 400);
  }

  const [updated] = await sql`
    UPDATE users
    SET first_name = ${firstName}, last_name = ${lastName}
    WHERE id = ${user.id}
    RETURNING id, email, first_name, last_name, role
  `;
  return json(updated);
}
