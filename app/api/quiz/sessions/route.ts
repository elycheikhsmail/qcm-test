// POST /api/quiz/sessions
// Crée une session de quiz anonyme (ou via magic link) :
//   1. Valide le magic link (si fourni) et incrémente atomiquement use_count
//   2. Crée un `tests` éphémère (snapshot des critères)
//   3. Tire N questions random validées selon les filtres
//   4. Remplit `test_questions` avec l'ordre
//   5. Crée la ligne `sessions`
//   6. Retourne l'id de session pour commencer le quiz
//
// Body JSON :
// {
//   "token":       string  (optionnel — UUID magic link)
//   "subject_id":  number  (optionnel)
//   "level_id":    number  (optionnel)
//   "chapter_id":  number  (optionnel)
//   "difficulty":  "facile"|"moyen"|"difficile" (optionnel)
//   "question_count": number (défaut 10, max 50)
// }

import { sql } from "@/lib/db";
import { json, error, parseJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

type Body = {
  token?: string;
  subject_id?: number;
  level_id?: number;
  chapter_id?: number;
  difficulty?: "facile" | "moyen" | "difficile";
  question_count?: number;
};

export async function POST(req: Request) {
  const body = await parseJson<Body>(req);
  if (!body) return error("Body JSON invalide");

  // Utilisateur connecté ? On l'attache à la session (quiz autonome tracé).
  const currentUser = await getCurrentUser();

  const qc = Math.max(1, Math.min(50, body.question_count ?? 10));
  const diff = body.difficulty ?? null;
  if (diff && !["facile", "moyen", "difficile"].includes(diff)) {
    return error("difficulty invalide");
  }

  try {
    const out = await sql.begin(async (tx) => {
      // 1. Magic link : validation + incrément atomique
      let magicLinkId: number | null = null;
      let forcedLevelId: number | null = null;
      if (body.token) {
        if (!/^[0-9a-f-]{36}$/i.test(body.token)) {
          throw new ApiError("Token invalide", 400);
        }
        // UPDATE conditionnel : n'incrémente que si non expiré et non épuisé.
        const rows = await tx<
          { id: number; level_id: number | null; classe_id: number | null }[]
        >`
          UPDATE magic_links
             SET use_count = use_count + 1
           WHERE token = ${body.token}::uuid
             AND expires_at > NOW()
             AND use_count < max_uses
          RETURNING id, level_id, classe_id
        `;
        if (!rows.length) {
          throw new ApiError("Lien invalide, expiré ou épuisé", 410);
        }
        magicLinkId = rows[0].id;
        forcedLevelId = rows[0].level_id;
      }

      // 2. Résoudre les filtres (magic link peut forcer le niveau)
      const levelId = body.level_id ?? forcedLevelId ?? null;

      // 3. Tirage des questions — SQL random() simple pour 37+ questions
      const picked = await tx<{ id: number }[]>`
        SELECT q.id
        FROM questions q
        JOIN chapters ch ON ch.id = q.chapter_id
        WHERE q.validated = TRUE
          AND (${body.chapter_id ?? null}::int IS NULL OR q.chapter_id = ${body.chapter_id ?? null})
          AND (${levelId}::int IS NULL OR ch.level_id = ${levelId})
          AND (${body.subject_id ?? null}::int IS NULL OR ch.subject_id = ${body.subject_id ?? null})
          AND (${diff}::text IS NULL OR q.difficulty = ${diff})
        ORDER BY random()
        LIMIT ${qc}
      `;

      if (picked.length === 0) {
        throw new ApiError("Aucune question ne correspond aux critères", 404);
      }

      // 4. Créer le test éphémère (snapshot des critères)
      const [test] = await tx<{ id: number }[]>`
        INSERT INTO tests
          (created_by, subject_id, level_id, chapter_id, difficulty, question_count, time_mode)
        VALUES
          (NULL,
           ${body.subject_id ?? null},
           ${levelId},
           ${body.chapter_id ?? null},
           ${diff},
           ${picked.length},
           'libre')
        RETURNING id
      `;

      // 5. Snapshot test_questions avec ordre
      for (let i = 0; i < picked.length; i++) {
        await tx`
          INSERT INTO test_questions (test_id, question_id, "order")
          VALUES (${test.id}, ${picked[i].id}, ${i})
        `;
      }

      // 6. Créer la session — rattacher l'élève s'il est connecté
      const eleveId = currentUser?.id ?? null;
      const [session] = await tx<{ id: number }[]>`
        INSERT INTO sessions (test_id, magic_link_id, eleve_id, is_anonymous)
        VALUES (${test.id}, ${magicLinkId}, ${eleveId}, ${eleveId === null})
        RETURNING id
      `;

      return {
        session_id: session.id,
        test_id: test.id,
        question_count: picked.length,
      };
    });

    return json(out, 201);
  } catch (e) {
    if (e instanceof ApiError) return error(e.message, e.status);
    console.error("POST /api/quiz/sessions", e);
    return error("Erreur serveur", 500);
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
