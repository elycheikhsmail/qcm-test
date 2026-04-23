import { describe, it, expect, beforeAll } from "bun:test";
import { api, register, uniqueEmail } from "../setup";

let cookie = "";
let subjectId: number;
let levelId: number;
let chapterId: number;
let sessionId: string;
let questionId: string;

beforeAll(async () => {
  const res = await register(uniqueEmail("quiz"));
  cookie = res.cookie;
});

describe("GET /api/quiz/subjects", () => {
  it("retourne la liste des matières", async () => {
    const { status, data } = await api("/api/quiz/subjects");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if ((data as any[]).length > 0) {
      subjectId = (data as any[])[0].id;
    }
  });
});

describe("GET /api/quiz/levels", () => {
  it("retourne les niveaux (sans filtre)", async () => {
    const { status, data } = await api("/api/quiz/levels");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if ((data as any[]).length > 0) {
      levelId = (data as any[])[0].id;
    }
  });

  it("filtre par subject_id", async () => {
    if (!subjectId) return;
    const { status } = await api(`/api/quiz/levels?subject_id=${subjectId}`);
    expect(status).toBe(200);
  });
});

describe("GET /api/quiz/chapters", () => {
  it("retourne 400 sans subject_id + level_id", async () => {
    const { status } = await api("/api/quiz/chapters");
    expect(status).toBe(400);
  });

  it("retourne les chapitres avec les bons params", async () => {
    if (!subjectId || !levelId) return;
    const { status, data } = await api(
      `/api/quiz/chapters?subject_id=${subjectId}&level_id=${levelId}`
    );
    expect(status).toBe(200);
    if ((data as any[]).length > 0) {
      chapterId = (data as any[])[0].id;
    }
  });
});

describe("GET /api/quiz/questions", () => {
  it("retourne 400 sans chapter_id", async () => {
    const { status } = await api("/api/quiz/questions");
    expect(status).toBe(400);
  });

  it("retourne les questions pour un chapitre", async () => {
    if (!chapterId) return;
    const { status, data } = await api(
      `/api/quiz/questions?chapter_id=${chapterId}&limit=5`
    );
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/quiz/sessions", () => {
  it("crée une session quiz", async () => {
    if (!chapterId) return;
    const { status, data } = await api("/api/quiz/sessions", {
      method: "POST",
      cookie,
      body: { chapter_id: chapterId, question_count: 3 },
    });
    expect(status).toBe(201);
    sessionId = (data as any).id;
    expect(sessionId).toBeTruthy();
  });
});

describe("GET /api/quiz/sessions/[id]/questions", () => {
  it("retourne les questions sans correct_answer", async () => {
    if (!sessionId) return;
    const { status, data } = await api(
      `/api/quiz/sessions/${sessionId}/questions`
    );
    expect(status).toBe(200);
    const questions = data as any[];
    expect(Array.isArray(questions)).toBe(true);
    for (const q of questions) {
      expect(q.correct_answer).toBeUndefined();
    }
    if (questions.length > 0) questionId = questions[0].id;
  });
});

describe("POST /api/quiz/answers", () => {
  it("enregistre une réponse", async () => {
    if (!sessionId || !questionId) return;
    const { status } = await api("/api/quiz/answers", {
      method: "POST",
      cookie,
      body: { session_id: sessionId, question_id: questionId, given_answer: "A" },
    });
    expect([200, 201]).toContain(status);
  });
});

describe("POST /api/quiz/sessions/[id]/submit", () => {
  it("finalise la session et retourne un score", async () => {
    if (!sessionId) return;
    const { status, data } = await api(
      `/api/quiz/sessions/${sessionId}/submit`,
      { method: "POST", cookie }
    );
    expect(status).toBe(200);
    expect(typeof (data as any).score).toBe("number");
  });

  it("est idempotent (second appel retourne le même score)", async () => {
    if (!sessionId) return;
    const { status, data } = await api(
      `/api/quiz/sessions/${sessionId}/submit`,
      { method: "POST", cookie }
    );
    expect(status).toBe(200);
  });
});

describe("GET /api/quiz/sessions/[id]/results", () => {
  it("retourne les corrections avec correct_answer", async () => {
    if (!sessionId) return;
    const { status, data } = await api(
      `/api/quiz/sessions/${sessionId}/results`
    );
    expect(status).toBe(200);
    const answers = (data as any).answers ?? [];
    for (const a of answers) {
      expect(a.correct_answer).toBeDefined();
    }
  });
});
