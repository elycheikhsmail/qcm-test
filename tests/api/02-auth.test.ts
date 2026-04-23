import { describe, it, expect, beforeAll } from "bun:test";
import { api, register, login, uniqueEmail } from "../setup";

const email = uniqueEmail("auth");
const password = "Test1234!";
let sessionCookie = "";

describe("POST /api/auth/register", () => {
  it("crée un compte et retourne un cookie de session", async () => {
    const res = await register(email, password);
    expect(res.status).toBe(201);
    expect(res.cookie).toMatch(/session_id=/);
    sessionCookie = res.cookie;
  });

  it("rejette un email déjà utilisé (409)", async () => {
    const { status } = await api("/api/auth/register", {
      method: "POST",
      body: { email, password, first_name: "Test", last_name: "User" },
    });
    expect(status).toBe(409);
  });

  it("rejette un body incomplet (400)", async () => {
    const { status } = await api("/api/auth/register", {
      method: "POST",
      body: { email: uniqueEmail("bad") },
    });
    expect(status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("retourne un cookie de session avec bons identifiants", async () => {
    const res = await login(email, password);
    expect(res.status).toBe(200);
    expect(res.cookie).toMatch(/session_id=/);
    sessionCookie = res.cookie;
  });

  it("rejette un mauvais mot de passe (401)", async () => {
    const { status } = await api("/api/auth/login", {
      method: "POST",
      body: { email, password: "wrongpassword" },
    });
    expect(status).toBe(401);
  });

  it("rejette un email inexistant (401)", async () => {
    const { status } = await api("/api/auth/login", {
      method: "POST",
      body: { email: "nobody@test.local", password },
    });
    expect(status).toBe(401);
  });
});

describe("GET /api/me", () => {
  it("retourne le profil de l'utilisateur connecté", async () => {
    const { status, data } = await api("/api/me", { cookie: sessionCookie });
    expect(status).toBe(200);
    expect((data as any).email).toBe(email);
  }, 10000);

  it("retourne 401 sans session", async () => {
    const { status } = await api("/api/me");
    expect(status).toBe(401);
  });
});

describe("PATCH /api/me", () => {
  it("met à jour le prénom et nom", async () => {
    const { status, data } = await api("/api/me", {
      method: "PATCH",
      cookie: sessionCookie,
      body: { first_name: "Updated", last_name: "User" },
    });
    expect(status).toBe(200);
    expect((data as any).first_name).toBe("Updated");
  });
});

describe("POST /api/auth/logout", () => {
  it("détruit la session (200)", async () => {
    const { status } = await api("/api/auth/logout", {
      method: "POST",
      cookie: sessionCookie,
    });
    expect(status).toBe(200);
  });

  it("GET /api/me retourne 401 après logout", async () => {
    const { status } = await api("/api/me", { cookie: sessionCookie });
    expect(status).toBe(401);
  });
});
