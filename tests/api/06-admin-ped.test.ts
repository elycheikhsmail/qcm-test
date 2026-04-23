import { describe, it, expect, beforeAll } from "bun:test";
import { api, login } from "../setup";

/**
 * Nécessite un compte admin_ped seed via `bun run create-admin-ped`
 */
const ADMIN_EMAIL = process.env.ADMIN_PED_EMAIL ?? "admin-ped@test.local";
const ADMIN_PASSWORD = process.env.ADMIN_PED_PASSWORD ?? "Test1234!";

let adminCookie = "";
let subjectId: number;
let levelId: number;
let chapterId: number;
let questionId: number;

beforeAll(async () => {
  const res = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  adminCookie = res.cookie;
});

describe("Subjects CRUD", () => {
  it("POST /api/admin-ped/subjects — crée une matière", async () => {
    const { status, data } = await api("/api/admin-ped/subjects", {
      method: "POST",
      cookie: adminCookie,
      body: { name: `Matière test ${Date.now()}`, language: "fr" },
    });
    expect(status).toBe(201);
    subjectId = (data as any).id;
  });

  it("GET /api/admin-ped/subjects — liste les matières", async () => {
    const { status, data } = await api("/api/admin-ped/subjects", {
      cookie: adminCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("PATCH /api/admin-ped/subjects/[id] — met à jour", async () => {
    if (!subjectId) return;
    const { status } = await api(`/api/admin-ped/subjects/${subjectId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { name: `Matière mise à jour ${Date.now()}` },
    });
    expect(status).toBe(200);
  }, 10000);
});

describe("Levels CRUD", () => {
  it("POST /api/admin-ped/levels — crée un niveau", async () => {
    const { status, data } = await api("/api/admin-ped/levels", {
      method: "POST",
      cookie: adminCookie,
      body: { name: `Niveau ${Date.now()}`, order: 99 },
    });
    expect(status).toBe(201);
    levelId = (data as any).id;
  });

  it("GET /api/admin-ped/levels — liste", async () => {
    const { status } = await api("/api/admin-ped/levels", {
      cookie: adminCookie,
    });
    expect(status).toBe(200);
  });

  it("PATCH /api/admin-ped/levels/[id]", async () => {
    if (!levelId) return;
    const { status } = await api(`/api/admin-ped/levels/${levelId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { name: `Niveau modifié ${Date.now()}` },
    });
    expect(status).toBe(200);
  }, 10000);
});

describe("Chapters CRUD", () => {
  it("POST /api/admin-ped/chapters — crée un chapitre", async () => {
    if (!subjectId || !levelId) return;
    const { status, data } = await api("/api/admin-ped/chapters", {
      method: "POST",
      cookie: adminCookie,
      body: {
        title: `Chapitre test ${Date.now()}`,
        subject_id: subjectId,
        level_id: levelId,
      },
    });
    expect(status).toBe(201);
    chapterId = (data as any).id;
  });

  it("GET /api/admin-ped/chapters — liste avec filtre", async () => {
    if (!subjectId) return;
    const { status } = await api(
      `/api/admin-ped/chapters?subject_id=${subjectId}`,
      { cookie: adminCookie }
    );
    expect(status).toBe(200);
  });
});

describe("Questions modération", () => {
  it("GET /api/admin-ped/questions — liste les questions", async () => {
    const { status, data } = await api("/api/admin-ped/questions", {
      cookie: adminCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if ((data as any[]).length > 0) questionId = (data as any[])[0].id;
  });

  it("GET /api/admin-ped/questions/[id] — détail question", async () => {
    if (!questionId) return;
    const { status } = await api(`/api/admin-ped/questions/${questionId}`, {
      cookie: adminCookie,
    });
    expect(status).toBe(200);
  }, 10000);

  it("PATCH /api/admin-ped/questions/[id] — modifie la difficulté", async () => {
    if (!questionId) return;
    const { status } = await api(`/api/admin-ped/questions/${questionId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { difficulty: "moyen" },
    });
    expect(status).toBe(200);
  });

  it("POST .../approve — approuve la question", async () => {
    if (!questionId) return;
    const { status } = await api(
      `/api/admin-ped/questions/${questionId}/approve`,
      { method: "POST", cookie: adminCookie }
    );
    expect(status).toBe(200);
  }, 10000);
});

describe("Accès non autorisé", () => {
  it("GET /api/admin-ped/subjects retourne 401 sans session", async () => {
    const { status } = await api("/api/admin-ped/subjects");
    expect([401, 403]).toContain(status);
  });
});
