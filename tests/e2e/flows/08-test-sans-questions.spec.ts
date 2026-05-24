/**
 * Régression : quand un enseignant assigne un test qui n'a aucune question
 * (test_questions vide), un élève qui clique sur "Continuer/Commencer"
 * sur le dashboard atterrissait sur /quiz/test/:id et restait bloqué sur
 * "Démarrage du test…" indéfiniment.
 *
 * Le fix doit :
 *  1. côté API POST /api/tests/:id/sessions → 422 avec un message explicite,
 *  2. côté page /quiz/test/:id → afficher l'erreur au lieu de rester bloqué.
 */
import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";
import { sql } from "../../../lib/db";

test.use({ storageState: storageStatePath("eleve") });

const ELEVE_EMAIL = "eleve@test.local";
const ENSEIGNANT_EMAIL = "enseignant@test.local";

let testId: number;
let classeId: number;

test.beforeAll(async () => {
  const [enseignant] = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${ENSEIGNANT_EMAIL} LIMIT 1
  `;
  const [eleve] = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${ELEVE_EMAIL} LIMIT 1
  `;
  if (!enseignant || !eleve) throw new Error("Seed users manquants (enseignant/eleve)");

  const [ce] = await sql<{ classe_id: number }[]>`
    SELECT classe_id FROM classe_eleves
    WHERE eleve_id = ${eleve.id} AND status = 'active'
    LIMIT 1
  `;
  if (!ce) throw new Error("L'élève seed n'est rattaché à aucune classe active");
  classeId = ce.classe_id;

  // Créer un test "cassé" : question_count > 0 mais aucune ligne test_questions
  const [t] = await sql<{ id: number }[]>`
    INSERT INTO tests
      (created_by, title, difficulty, question_count, time_mode)
    VALUES
      (${enseignant.id}, 'E2E test sans questions', 'facile', 3, 'libre')
    RETURNING id
  `;
  testId = t.id;

  await sql`
    INSERT INTO test_assignments (test_id, target_type, target_id)
    VALUES (${testId}, 'classe', ${classeId})
  `;
});

test.afterAll(async () => {
  if (!testId) return;
  await sql`DELETE FROM sessions          WHERE test_id = ${testId}`;
  await sql`DELETE FROM test_assignments  WHERE test_id = ${testId}`;
  await sql`DELETE FROM test_questions    WHERE test_id = ${testId}`;
  await sql`DELETE FROM tests             WHERE id      = ${testId}`;
  await sql.end({ timeout: 1 });
});

test("API : POST /api/tests/:id/sessions rejette un test sans questions (422)", async ({ request }) => {
  const res = await request.post(`/api/tests/${testId}/sessions`);
  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.ok).toBe(false);
  expect(String(body.error)).toMatch(/aucune question/i);
});

test("UI : /quiz/test/:id affiche un message d'erreur au lieu de rester bloqué", async ({ page }) => {
  await page.goto(`/quiz/test/${testId}`);

  // L'erreur doit apparaître rapidement — pas de blocage indéfini sur "Démarrage du test…"
  await expect(page.locator("text=/aucune question/i")).toBeVisible({ timeout: 10_000 });

  // Le placeholder de chargement ne doit plus être visible une fois l'erreur affichée
  await expect(page.locator("text=Démarrage du test")).toHaveCount(0);

  // Un lien de retour vers le dashboard doit être proposé
  await expect(page.locator('button:has-text("Retour au dashboard")')).toBeVisible();
});
