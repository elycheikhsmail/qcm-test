import { describe, it, expect, beforeAll } from "bun:test";
import { api, login, register, uniqueEmail } from "../setup";

let studentCookie = "";

beforeAll(async () => {
  // Option A : le parent utilise les identifiants de l'élève (role=eleve)
  const res = await register(uniqueEmail("parent-eleve"));
  studentCookie = res.cookie;
});

describe("GET /api/parent/summary", () => {
  it("retourne le résumé parent pour un élève connecté", async () => {
    const { status, data } = await api("/api/parent/summary", {
      cookie: studentCookie,
    });
    expect(status).toBe(200);
    const d = data as any;
    // moyenne_globale peut être null si aucun test soumis
    expect(d).toHaveProperty("moyenne_globale");
    expect(Array.isArray(d.recent)).toBe(true);
    expect(d.recent.length).toBeLessThanOrEqual(5);
    expect(Array.isArray(d.bySubject)).toBe(true);
  });

  it("retourne 401 sans session", async () => {
    const { status } = await api("/api/parent/summary");
    expect([401, 403]).toContain(status);
  });
});
