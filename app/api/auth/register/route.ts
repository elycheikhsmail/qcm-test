import { hash } from "@node-rs/argon2";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { parseJson, error } from "@/lib/api";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

type Body = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export async function POST(req: Request) {
  const body = await parseJson<Body>(req);
  if (!body) return error("Corps de requête invalide", 400);

  const { email, password, first_name, last_name } = body;

  if (!email || !password || !first_name || !last_name) {
    return error("email, password, first_name et last_name sont obligatoires", 400);
  }
  if (password.length < 8) {
    return error("Le mot de passe doit contenir au moins 8 caractères", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Email invalide", 400);
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length) return error("Un compte existe déjà avec cet email", 409);

  const passwordHash = await hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 1 });

  const [user] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, auth_method, is_active)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${first_name.trim()}, ${last_name.trim()}, 'eleve', 'email', TRUE)
    RETURNING id, email, first_name, last_name, role
  `;

  const sessionId = await createSession(user.id as number);
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  return NextResponse.json(
    { ok: true, data: { user } },
    {
      status: 201,
      headers: {
        "Set-Cookie": `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`,
      },
    },
  );
}
