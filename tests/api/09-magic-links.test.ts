import { describe, it, expect, beforeAll } from "bun:test";
import { api, login } from "../setup";

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? "enseignant@test.local";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? "Test1234!";

let teacherCookie = "";
let token = "";
let classeId: number;

beforeAll(async () => {
  const t = await login(TEACHER_EMAIL, TEACHER_PASSWORD);
  teacherCookie = t.cookie;

  const classes = await api("/api/classes", { cookie: teacherCookie });
  classeId = (classes.data as any[])?.[0]?.id;
});

describe("POST /api/magic-links/classe", () => {
  it("crée un magic link pour une classe", async () => {
    if (!classeId) return;
    const { status, data } = await api("/api/magic-links/classe", {
      method: "POST",
      cookie: teacherCookie,
      body: { classe_id: classeId, max_uses: 10 },
    });
    expect(status).toBe(201);
    token = (data as any).token;
    expect(token).toBeTruthy();
  });
});

describe("GET /api/magic-links/[token]", () => {
  it("valide le token et retourne les infos", async () => {
    if (!token) return;
    const { status, data } = await api(`/api/magic-links/${token}`);
    expect(status).toBe(200);
    expect((data as any).token).toBe(token);
    expect(typeof (data as any).remaining_uses).toBe("number");
  });

  it("retourne 404 pour un token inconnu", async () => {
    const { status } = await api("/api/magic-links/00000000-0000-0000-0000-000000000000");
    expect([404, 400]).toContain(status);
  });
});
