import { describe, it, expect, beforeAll } from "bun:test";
import { api, login, register, uniqueEmail } from "../setup";

const TEACHER_EMAIL = process.env.TEACHER_EMAIL ?? "enseignant@test.local";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD ?? "Test1234!";

let teacherCookie = "";
let studentCookie = "";
let testId: number;
let classeId: number;
let chapterId: number;

beforeAll(async () => {
  const t = await login(TEACHER_EMAIL, TEACHER_PASSWORD);
  teacherCookie = t.cookie;

  const s = await register(uniqueEmail("student-test"));
  studentCookie = s.cookie;

  // Récupère un chapitre existant
  const subjects = await api("/api/quiz/subjects");
  const subjectId = (subjects.data as any[])?.[0]?.id;
  const levels = await api("/api/quiz/levels");
  const levelId = (levels.data as any[])?.[0]?.id;
  if (subjectId && levelId) {
    const chapters = await api(
      `/api/quiz/chapters?subject_id=${subjectId}&level_id=${levelId}`
    );
    chapterId = (chapters.data as any[])?.[0]?.id;
  }

  // Récupère une classe enseignant
  const classes = await api("/api/classes", { cookie: teacherCookie });
  classeId = (classes.data as any[])?.[0]?.id;
});

describe("POST /api/tests", () => {
  it("crée un test assignable", async () => {
    if (!chapterId) return;
    const { status, data } = await api("/api/tests", {
      method: "POST",
      cookie: teacherCookie,
      body: {
        title: "Test automatisé",
        chapter_id: chapterId,
        question_count: 3,
        time_mode: "libre",
      },
    });
    expect(status).toBe(201);
    testId = (data as any).id;
    expect(testId).toBeTruthy();
  });

  it("retourne 401 sans session", async () => {
    const { status } = await api("/api/tests", {
      method: "POST",
      body: { title: "X", chapter_id: 1, question_count: 5 },
    });
    expect(status).toBe(401);
  });
});

describe("GET /api/tests", () => {
  it("retourne les tests de l'enseignant", async () => {
    const { status, data } = await api("/api/tests", { cookie: teacherCookie });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /api/tests/[id]", () => {
  it("retourne les détails du test", async () => {
    if (!testId) return;
    const { status, data } = await api(`/api/tests/${testId}`, {
      cookie: teacherCookie,
    });
    expect(status).toBe(200);
    expect((data as any).id).toBe(testId);
  });
});

describe("POST /api/tests/[id]/assignments", () => {
  it("assigne le test à une classe", async () => {
    if (!testId || !classeId) return;
    const { status } = await api(`/api/tests/${testId}/assignments`, {
      method: "POST",
      cookie: teacherCookie,
      body: { target_type: "classe", target_id: classeId },
    });
    expect([200, 201]).toContain(status);
  });
});

describe("GET /api/tests/assigned (élève)", () => {
  it("retourne les tests assignés à l'élève", async () => {
    const { status, data } = await api("/api/tests/assigned", {
      cookie: studentCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/tests/[id]/sessions (élève)", () => {
  it("démarre une session test assigné", async () => {
    if (!testId) return;
    const { status, data } = await api(`/api/tests/${testId}/sessions`, {
      method: "POST",
      cookie: studentCookie,
    });
    // 201 = nouvelle session, 200 = déjà commencée
    expect([200, 201]).toContain(status);
  });
});

describe("GET /api/tests/[id]/stats", () => {
  it("retourne les stats par question", async () => {
    if (!testId) return;
    const { status, data } = await api(`/api/tests/${testId}/stats`, {
      cookie: teacherCookie,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /api/tests/[id]/results/classe", () => {
  it("retourne les résultats agrégés", async () => {
    if (!testId || !classeId) return;
    const { status } = await api(
      `/api/tests/${testId}/results/classe?classe_id=${classeId}`,
      { cookie: teacherCookie }
    );
    expect(status).toBe(200);
  });
});
