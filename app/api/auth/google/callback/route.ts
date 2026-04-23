import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", req.nextUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=oauth_token", req.nextUrl));
  }

  const { access_token } = await tokenRes.json();

  // Fetch user info
  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!infoRes.ok) {
    return NextResponse.redirect(new URL("/login?error=oauth_userinfo", req.nextUrl));
  }

  const { id: googleId, email, given_name, family_name } = await infoRes.json();

  // Find or create user
  let [user] = await sql`
    SELECT id, is_active FROM users WHERE google_id = ${googleId}
  `;

  if (!user && email) {
    // Maybe they registered by email — link accounts
    [user] = await sql`
      SELECT id, is_active FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (user) {
      await sql`UPDATE users SET google_id = ${googleId}, auth_method = 'google' WHERE id = ${user.id}`;
    }
  }

  if (!user) {
    [user] = await sql`
      INSERT INTO users (email, google_id, auth_method, first_name, last_name, role)
      VALUES (${email?.toLowerCase() ?? null}, ${googleId}, 'google', ${given_name ?? ""}, ${family_name ?? ""}, 'eleve')
      RETURNING id, is_active
    `;
  }

  if (!user.is_active) {
    return NextResponse.redirect(new URL("/login?error=account_disabled", req.nextUrl));
  }

  const sessionId = await createSession(user.id as number);
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const res = NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    expires,
    path: "/",
  });
  res.cookies.delete("oauth_state");
  return res;
}
