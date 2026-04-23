import { verify } from "@node-rs/argon2";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { parseJson, error } from "@/lib/api";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

type Body = { email: string; password: string };

export async function POST(req: Request) {
  const body = await parseJson<Body>(req);
  if (!body) return error("Corps de requête invalide", 400);

  const { email, password } = body;
  if (!email || !password) return error("email et password requis", 400);

  const [user] = await sql`
    SELECT id, email, password_hash, first_name, last_name, role, is_active
    FROM users
    WHERE email = ${email.toLowerCase()} AND auth_method = 'email'
  `;

  if (!user || !user.is_active) {
    return error("Email ou mot de passe incorrect", 401);
  }

  const valid = await verify(user.password_hash as string, password);
  if (!valid) return error("Email ou mot de passe incorrect", 401);

  const sessionId = await createSession(user.id as number);
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { password_hash: _, ...safeUser } = user;
  return NextResponse.json(
    { ok: true, data: { user: safeUser } },
    {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`,
      },
    },
  );
}
