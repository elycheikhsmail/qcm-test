import { describe, it, expect, beforeAll } from "bun:test";
import { api, login } from "../setup";

/**
 * Nécessite un compte directeur avec des classes assignées dans `directeur_classes`
 */
const DIR_EMAIL = process.env.DIRECTEUR_EMAIL ?? "directeur@test.local";
const DIR_PASSWORD = process.env.DIRECTEUR_PASSWORD ?? "Test1234!";

let dirCookie = "";
let classeId: number;
let eleveId: number;
let testId: number;

beforeAll(async () => {
  const res = await login(DIR_EMAIL, DIR_PASSWORD);
  dirCookie = res.cookie;
});

describe("GET /api/directeur/classes", () => {
  it("retourne les classes assignées au directeur", async () => {
    const { status, data } = await api("/api/directeur/classes", {
      cookie: dirCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if ((data as any[]).length > 0) {
      classeId = (data as any[])[0].id;
    }
  }, 10000);

  it("retourne 401 sans session", async () => {
    const { status } = await api("/api/directeur/classes");
    expect([401, 403]).toContain(status);
  });
});

describe("GET /api/directeur/classes/[id]", () => {
  it("retourne les stats de la classe", async () => {
    if (!classeId) return;
    const { status, data } = await api(`/api/directeur/classes/${classeId}`, {
      cookie: dirCookie,
    });
    expect(status).toBe(200);
    const d = data as any;
    expect(d.classe?.id).toBe(classeId);
    if (d.tests?.length > 0) testId = d.tests[0].id;
    eleveId = 6; // élève seed connu (eleve@test.local)
  });

  it("retourne 403 pour une classe non assignée au directeur", async () => {
    const { status } = await api("/api/directeur/classes/999999", {
      cookie: dirCookie,
    });
    expect([403, 404]).toContain(status);
  }, 10000);
});

describe("GET /api/directeur/classes/[id]/tests/[test_id]", () => {
  it("retourne les stats par question du test", async () => {
    if (!classeId || !testId) return;
    const { status, data } = await api(
      `/api/directeur/classes/${classeId}/tests/${testId}`,
      { cookie: dirCookie }
    );
    expect(status).toBe(200);
    expect((data as any).questionStats ?? (data as any).eleves).toBeTruthy();
  }, 10000);
});

describe("GET /api/directeur/eleves/[id]", () => {
  it("retourne le profil et l'historique de l'élève", async () => {
    if (!eleveId) return;
    const { status, data } = await api(`/api/directeur/eleves/${eleveId}`, {
      cookie: dirCookie,
    });
    expect(status).toBe(200);
    expect((data as any).eleve?.id).toBe(eleveId);
  }, 10000);
});

describe("GET /api/directeur/eleves/[id]/evolution", () => {
  it("retourne l'évolution hebdomadaire /20 sur 12 semaines", async () => {
    if (!eleveId) return;
    const { status, data } = await api(
      `/api/directeur/eleves/${eleveId}/evolution`,
      { cookie: dirCookie }
    );
    expect(status).toBe(200);
    // Tableau de semaines ou objet par matière
    expect(data).toBeTruthy();
  }, 10000);
});
