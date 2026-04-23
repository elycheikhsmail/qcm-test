import { describe, it, expect, beforeAll } from "bun:test";
import { api, login, register, uniqueEmail } from "../setup";

/**
 * Nécessite :
 *   - un compte enseignant seed via `bun run create-enseignant`
 *   - TEACHER_EMAIL / TEACHER_PASSWORD dans .env.test (fallback ci-dessous)
 */
const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? "enseignant@test.local";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? "Test1234!";

let teacherCookie = "";
let studentCookie = "";
let studentEmail = uniqueEmail("eleve");
let classeId: number;
let eleveId: number;

beforeAll(async () => {
  const t = await login(TEACHER_EMAIL, TEACHER_PASSWORD);
  teacherCookie = t.cookie;

  const s = await register(studentEmail);
  studentCookie = s.cookie;

  // Récupère l'id de l'élève
  const me = await api("/api/me", { cookie: studentCookie });
  eleveId = (me.data as any).id;
});

describe("POST /api/etablissements", () => {
  it("crée un établissement", async () => {
    const { status, data } = await api("/api/etablissements", {
      method: "POST",
      cookie: teacherCookie,
      body: { nom: "Lycée Test", wilaya: "Nouakchott" },
    });
    expect([200, 201]).toContain(status);
    expect((data as any).id).toBeTruthy();
  });
});

describe("GET /api/etablissements", () => {
  it("retourne la liste des établissements", async () => {
    const { status, data } = await api("/api/etablissements", {
      cookie: teacherCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/classes (enseignant)", () => {
  it("crée une classe", async () => {
    const { status, data } = await api("/api/classes", {
      method: "POST",
      cookie: teacherCookie,
      body: {
        nom: `Terminale Test ${Date.now()}`,
        niveau: "Terminale",
        annee_scolaire: "2025-2026",
      },
    });
    expect(status).toBe(201);
    classeId = (data as any).id;
    expect(classeId).toBeTruthy();
  });

  it("retourne 401 sans session", async () => {
    const { status } = await api("/api/classes", {
      method: "POST",
      body: { nom: "X", niveau: "Y" },
    });
    expect(status).toBe(401);
  });
});

describe("GET /api/classes", () => {
  it("retourne les classes de l'enseignant", async () => {
    const { status, data } = await api("/api/classes", {
      cookie: teacherCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /api/classes/[id]", () => {
  it("retourne les détails de la classe", async () => {
    if (!classeId) return;
    const { status, data } = await api(`/api/classes/${classeId}`, {
      cookie: teacherCookie,
    });
    expect(status).toBe(200);
    expect((data as any).id).toBe(classeId);
  }, 10000);
});

describe("POST /api/classes/[id]/join (élève)", () => {
  it("l'élève rejoint la classe (status=pending)", async () => {
    if (!classeId) return;
    const { status } = await api(`/api/classes/${classeId}/join`, {
      method: "POST",
      cookie: studentCookie,
    });
    expect([200, 201]).toContain(status);
  }, 10000);
});

describe("POST /api/classes/[id]/eleves/[eleve_id]/accept", () => {
  it("l'enseignant accepte l'élève", async () => {
    if (!classeId || !eleveId) return;
    const { status } = await api(
      `/api/classes/${classeId}/eleves/${eleveId}/accept`,
      { method: "POST", cookie: teacherCookie }
    );
    expect([200, 201]).toContain(status);
  }, 10000);
});

describe("POST /api/classes/[id]/eleves (bulk add)", () => {
  it("ajoute un élève par email", async () => {
    if (!classeId) return;
    const { status } = await api(`/api/classes/${classeId}/eleves`, {
      method: "POST",
      cookie: teacherCookie,
      body: { email: studentEmail },
    });
    expect([200, 201]).toContain(status);
  }, 10000);
});
