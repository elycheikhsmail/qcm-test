// GET  /api/tests — liste des tests créés par l'enseignant
// POST /api/tests — crée un test + snapshot des questions

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { requireEnseignant, isNextResponse } from "@/lib/auth-guard";

type CreateBody = {
  title?: string;
  subject_id?: number;
  level_id?: number;
  chapter_id?: number;
  difficulty?: "facile" | "moyen" | "difficile";
  question_count?: number;
  time_mode?: "libre" | "chrono" | "deadline";
  duration_minutes?: number;
  deadline_at?: string;
};

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function GET() {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const rows = await sql`
    SELECT
      t.id,
      t.title,
      t.time_mode,
      t.duration_minutes,
      t.deadline_at,
      t.question_count,
      t.difficulty,
      t.created_at,
      s.name  AS subject_name,
      l.name  AS level_name,
      COUNT(DISTINCT ta.id)::int AS nb_assignments
    FROM tests t
    LEFT JOIN subjects  s  ON s.id = t.subject_id
    LEFT JOIN levels    l  ON l.id = t.level_id
    LEFT JOIN test_assignments ta ON ta.test_id = t.id
    WHERE t.created_by = ${user.id}
    GROUP BY t.id, s.name, l.name
    ORDER BY t.created_at DESC
  `;
  return json(rows);
}

export async function POST(req: Request) {
  const guard = await requireEnseignant();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const body = await parseJson<CreateBody>(req);
  if (!body) return error("Body JSON invalide");

  const qc = Math.max(1, Math.min(50, body.question_count ?? 10));
  const timeMode = body.time_mode ?? "libre";

  if (!["libre", "chrono", "deadline"].includes(timeMode)) {
    return error("time_mode invalide");
  }
  if (body.difficulty && !["facile", "moyen", "difficile"].includes(body.difficulty)) {
    return error("difficulty invalide");
  }
  if (timeMode === "chrono" && !body.duration_minutes) {
    return error("duration_minutes requis pour le mode chrono");
  }
  if (timeMode === "deadline" && !body.deadline_at) {
    return error("deadline_at requis pour le mode deadline");
  }

  const deadlineAt = body.deadline_at ? new Date(body.deadline_at) : null;
  if (deadlineAt && isNaN(deadlineAt.getTime())) {
    return error("deadline_at invalide (format ISO attendu)");
  }
  if (deadlineAt && deadlineAt <= new Date()) {
    return error("deadline_at doit être dans le futur");
  }

  try {
    const result = await sql.begin(async (tx) => {
      // Tirer N questions random validées selon les filtres
      const picked = await tx<{ id: number }[]>`
        SELECT q.id
        FROM questions q
        JOIN chapters ch ON ch.id = q.chapter_id
        WHERE q.validated = TRUE
          AND (${body.chapter_id ?? null}::int IS NULL OR q.chapter_id = ${body.chapter_id ?? null})
          AND (${body.level_id ?? null}::int IS NULL OR ch.level_id = ${body.level_id ?? null})
          AND (${body.subject_id ?? null}::int IS NULL OR ch.subject_id = ${body.subject_id ?? null})
          AND (${body.difficulty ?? null}::text IS NULL OR q.difficulty = ${body.difficulty ?? null})
        ORDER BY random()
        LIMIT ${qc}
      `;

      if (picked.length === 0) {
        throw new ApiError("Aucune question ne correspond aux critères", 404);
      }

      const [test] = await tx<{ id: number }[]>`
        INSERT INTO tests
          (created_by, title, subject_id, level_id, chapter_id, difficulty,
           question_count, time_mode, duration_minutes, deadline_at)
        VALUES (
          ${user.id},
          ${body.title?.trim() ?? null},
          ${body.subject_id ?? null},
          ${body.level_id ?? null},
          ${body.chapter_id ?? null},
          ${body.difficulty ?? null},
          ${picked.length},
          ${timeMode},
          ${body.duration_minutes ?? null},
          ${deadlineAt}
        )
        RETURNING id
      `;

      for (let i = 0; i < picked.length; i++) {
        await tx`
          INSERT INTO test_questions (test_id, question_id, "order")
          VALUES (${test.id}, ${picked[i].id}, ${i})
        `;
      }

      return { test_id: test.id, question_count: picked.length };
    });

    return json(result, 201);
  } catch (e) {
    if (e instanceof ApiError) return error(e.message, e.status);
    console.error("POST /api/tests", e);
    return error("Erreur serveur", 500);
  }
}
