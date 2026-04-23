/**
 * Utilitaires partagés pour tous les tests API
 * Usage : import { api, login, BASE_URL } from "./setup"
 */

export const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

type FetchOptions = {
  method?: string;
  body?: unknown;
  cookie?: string;
  token?: string;
};

export async function api(path: string, opts: FetchOptions = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.cookie) headers["Cookie"] = opts.cookie;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });

  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const raw = await res.json() as any;
    // Auto-unwrap {ok, data} envelope used by all API routes
    data = raw && typeof raw === "object" && "ok" in raw && "data" in raw ? raw.data : raw;
  }

  return { status: res.status, data, headers: res.headers };
}

/** Crée un compte et retourne le cookie de session */
export async function register(email: string, password = "Test1234!") {
  const res = await api("/api/auth/register", {
    method: "POST",
    body: { email, password, first_name: "Test", last_name: "User" },
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/session_id=[^;]+/);
  return { cookie: match?.[0] ?? "", data: res.data, status: res.status };
}

export async function login(email: string, password = "Test1234!") {
  const res = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/session_id=[^;]+/);
  return { cookie: match?.[0] ?? "", data: res.data, status: res.status };
}

/** Génère un email unique pour les tests */
export function uniqueEmail(prefix = "test") {
  return `${prefix}+${Date.now()}@test.local`;
}
