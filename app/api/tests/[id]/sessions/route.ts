// POST /api/tests/:id/sessions — démarre une session pour un test assigné

import { sql } from "@/lib/db";
import { json, error } from "@/lib/api";
import { requireAuth, isNextResponse } from "@/lib/auth-guard";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (isNextResponse(guard)) return guard;
  const { user } = guard;

  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) return error("id invalide");

  try {
    const result = await sql.begin(async (tx) => {
      // Charger le test
      const [test] = await tx<
        {
          id: number;
          time_mode: string;
          duration_minutes: number | null;
          deadline_at: Date | null;
          question_count: number;
        }[]
      >`
        SELECT id, time_mode, duration_minutes, deadline_at, question_count
        FROM tests WHERE id = ${testId}
      `;
      if (!test) throw new ApiError("Test introuvable", 404);

      // Vérifier que le test est assigné à cet élève (direct ou via classe)
      const [assigned] = await tx`
        SELECT ta.id
        FROM test_assignments ta
        WHERE ta.test_id = ${testId}
          AND (
            (ta.target_type = 'eleve' AND ta.target_id = ${user.id})
            OR
            (ta.target_type = 'classe' AND ta.target_id IN (
              SELECT classe_id FROM classe_eleves
              WHERE eleve_id = ${user.id} AND status = 'active'
            ))
          )
        LIMIT 1
      `;
      if (!assigned) throw new ApiError("Test non assigné à cet élève", 403);

      // Refuser de démarrer un test qui n'a aucune question dans le snapshot —
      // sans cette garde, la session est créée mais l'élève reste bloqué côté
      // client ("Démarrage du test…") car GET /questions renvoie [].
      const [{ n: questionsCount }] = await tx<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM test_questions WHERE test_id = ${testId}
      `;
      if (questionsCount === 0) {
        throw new ApiError(
          "Ce test ne contient aucune question — contactez votre enseignant",
          422,
        );
      }

      // Règle 1 tentative : rejeter si déjà soumis
      const [existing] = await tx`
        SELECT id, submitted_at FROM sessions
        WHERE test_id = ${testId} AND eleve_id = ${user.id} AND is_anonymous = FALSE
        LIMIT 1
      `;
      if (existing?.submitted_at) {
        throw new ApiError("Vous avez déjà soumis ce test", 409);
      }
      // Si session en cours, la retourner directement
      if (existing && !existing.submitted_at) {
        return { session_id: existing.id, test_id: testId, resumed: true };
      }

      // Vérifier la deadline avant de démarrer
      if (test.time_mode === "deadline" && test.deadline_at) {
        if (new Date() > new Date(test.deadline_at)) {
          throw new ApiError(
            "La deadline est passée — ce test n'est plus accessible",
            410,
          );
        }
      }

      // Créer la session
      const [session] = await tx<{ id: number }[]>`
        INSERT INTO sessions (test_id, eleve_id, is_anonymous)
        VALUES (${testId}, ${user.id}, FALSE)
        RETURNING id
      `;

      return {
        session_id: session.id,
        test_id: testId,
        time_mode: test.time_mode,
        duration_minutes: test.duration_minutes,
        deadline_at: test.deadline_at,
        question_count: test.question_count,
        resumed: false,
      };
    });

    return json(result, 201);
  } catch (e) {
    if (e instanceof ApiError) return error(e.message, e.status);
    console.error("POST /api/tests/:id/sessions", e);
    return error("Erreur serveur", 500);
  }
}
