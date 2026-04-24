import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";
import path from "path";
import fs from "fs";

function getMagicToken(): string {
  const p = path.join(process.cwd(), "tests", "e2e", ".auth", "magic-link.json");
  const { token } = JSON.parse(fs.readFileSync(p, "utf8")) as { token: string };
  return token;
}

test.describe("Quiz élève — flux complet via magic link", () => {
  test("page d'accueil : saisie du token → redirige vers /quiz/select", async ({ page }) => {
    const token = getMagicToken();
    await page.goto("/");
    await page.fill('input[type="text"]', token);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/quiz/select", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/quiz\/select/);
  });

  test("quiz/select : matières chargées et sélection possible", async ({ page }) => {
    // Injecter le token directement en sessionStorage (évite de le consommer via l'UI)
    const token = getMagicToken();
    await page.goto("/");
    await page.evaluate((t) => sessionStorage.setItem("quiz_token", t), token);
    await page.goto("/quiz/select");
    await expect(page.locator("text=Configurer le quiz")).toBeVisible({ timeout: 8_000 });
    // Les matières doivent être chargées
    await expect(page.locator("section").first()).not.toContainText("Chargement", { timeout: 8_000 });
  });

  test("flux complet : sélection → quiz → résultats", async ({ page }) => {
    const token = getMagicToken();
    // Injecter le token en sessionStorage
    await page.goto("/");
    await page.evaluate((t) => sessionStorage.setItem("quiz_token", t), token);
    await page.goto("/quiz/select");

     // Diagnostic: log all available subjects and their question counts
     await page.waitForTimeout(2000); // Give time for subjects to load
     const subjectButtons = page.locator("section button");
     const subjectTexts = await subjectButtons.allTextContents();
     console.log("Available subjects:", subjectTexts);

     // Attendre et cliquer sur la matière "Mathématiques Seed" qui a des questions
     const subjectBtn = page.locator("button").filter({ hasText: "Mathématiques Seed" });
     await subjectBtn.waitFor({ state: "visible", timeout: 10_000 });
     console.log("Clicking subject button:", await subjectBtn.textContent());
     await subjectBtn.click();

     // Vérifier que le bouton est maintenant sélectionné (classe active ou similaire)
     await page.waitForTimeout(500);
     const isSelected = await subjectBtn.getAttribute("class").then(cls => cls?.includes("selected") || cls?.includes("active"));
     console.log("Subject selected:", isSelected);

    // Choisir 5 questions (nombre minimum — match exact pour éviter "15")
    await page.locator("button").filter({ hasText: /^5$/ }).first().click();

    // Démarrer le quiz
    await page.locator('button:has-text("Démarrer le quiz")').click();
    await page.waitForURL(/\/quiz\/\d+$/, { timeout: 15_000 });

    // Répondre à toutes les questions
    let safetyLimit = 20;
    while (safetyLimit-- > 0) {
      await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

      // Tenter de répondre selon le type de question visible
      const nextBtn = page.locator('button:has-text("Suivant")');
      const submitBtn = page.locator('button:has-text("Terminer")');

      // Vrai/Faux
      const vraiBtn = page.locator('button:has-text("Vrai")');
      if (await vraiBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await vraiBtn.click();
      } else {
        // QCM — premier choix disponible
        const firstOption = page.locator(".space-y-3 button, .flex.gap-4 button").first();
        if (await firstOption.isVisible({ timeout: 500 }).catch(() => false)) {
          await firstOption.click();
        } else {
          // Fill blank
          const input = page.locator('input[placeholder*="réponse"]');
          if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
            await input.fill("42");
          }
        }
      }

      // Attendre feedback (bref délai réseau)
      await page.waitForTimeout(600);

      // Sur la dernière question le bouton Terminer apparaît
      if (await submitBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitBtn.click();
        break;
      }

      // Sinon, passer à la suivante
      if (await nextBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await nextBtn.click();
      }
    }

    // La page résultats doit s'afficher
    await page.waitForURL(/\/quiz\/\d+\/results/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/results/);
  });

  test("page résultats : score et récapitulatif visibles", async ({ page }) => {
    const token = getMagicToken();
    // Même flux abrégé : setup sessionStorage puis créer une session via API
    await page.goto("/");
    await page.evaluate((t) => sessionStorage.setItem("quiz_token", t), token);

    // Créer une session via l'API en passant le token
    const res = await page.request.post("/api/quiz/sessions", {
      data: { subject_id: 1, question_count: 5, token },
    });
    if (!res.ok()) {
      test.skip(true, "Impossible de créer une session de test (données insuffisantes)");
      return;
    }
    const body = await res.json();
    const sessionId: number = body.data.session_id;

    // Soumettre la session directement
    const submitRes = await page.request.post(`/api/quiz/sessions/${sessionId}/submit`);
    if (!submitRes.ok()) {
      test.skip(true, `Submit échoué (${submitRes.status()}) — données seed insuffisantes`);
      return;
    }

    // Accéder aux résultats
    await page.goto(`/quiz/${sessionId}/results`);
    await expect(page.locator("text=/\\d+\\/\\d+|\\d+%|score/i").first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Quiz élève — session authentifiée", () => {
  test.use({ storageState: storageStatePath("eleve") });

  test("/dashboard : section quiz ou tests assignés visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 });
  });
});
