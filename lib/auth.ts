import { sql } from "@/lib/db";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION_DAYS = 30;

export type SessionUser = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const [row] = await sql`
    INSERT INTO auth_sessions (user_id, expires_at)
    VALUES (${userId}, ${expiresAt})
    RETURNING id
  `;
  return row.id as string;
}

export async function getSessionUser(
  sessionId: string,
): Promise<SessionUser | null> {
  const rows = await sql`
    SELECT u.id, u.email, u.first_name, u.last_name, u.role
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
  `;
  if (!rows.length) return null;

  // Sliding expiration
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + SESSION_DURATION_DAYS);
  await sql`
    UPDATE auth_sessions SET expires_at = ${newExpiry} WHERE id = ${sessionId}
  `;

  return rows[0] as SessionUser;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM auth_sessions WHERE id = ${sessionId}`;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return getSessionUser(sessionId);
}

export function setSessionCookie(res: Response, sessionId: string): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`,
  );
}

export { SESSION_COOKIE };
