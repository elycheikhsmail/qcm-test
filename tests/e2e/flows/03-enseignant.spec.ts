import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";

test.use({ storageState: storageStatePath("enseignant") });

test.describe("Enseignant — classes", () => {
  test("/enseignant/classes : liste des classes visible", async ({ page }) => {
    await page.goto("/enseignant/classes");
    await page.waitForLoadState("networkidle");
    // Soit une liste de classes, soit le message vide
    await expect(
      page.locator("text=Mes classes, text=Terminale, text=Aucune classe").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Créer une nouvelle classe → apparaît dans la liste", async ({ page }) => {
    await page.goto("/enseignant/classes");
    await page.waitForLoadState("networkidle");

    // Ouvrir le formulaire de création
    const createBtn = page.locator('button:has-text("Nouvelle classe"), button:has-text("Créer")').first();
    await createBtn.waitFor({ state: "visible", timeout: 8_000 });
    await createBtn.click();

    const nom = `E2E Classe ${Date.now()}`;
    await page.fill('input[placeholder*="nom" i], input[placeholder*="classe" i], input:near(:text("Nom"))', nom);
    await page.fill('input:near(:text("Niveau"))', "Terminale");

    const submitBtn = page.locator('button[type="submit"]').last();
    await submitBtn.click();

    await expect(page.locator(`text=${nom}`)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Enseignant — tests", () => {
  test("/enseignant/tests : liste des tests visible", async ({ page }) => {
    await page.goto("/enseignant/tests");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("/enseignant/tests/new : formulaire de création accessible", async ({ page }) => {
    await page.goto("/enseignant/tests/new");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, form").first()).toBeVisible({ timeout: 8_000 });
  });

  test("/enseignant/tests/[id]/results : tableau des résultats (seed)", async ({ page }) => {
    // Récupère le premier test de l'enseignant via l'API
    const res = await page.request.get("/api/tests");
    if (!res.ok()) { test.skip(true, "API tests inaccessible"); return; }
    const body = await res.json();
    const tests: { id: number }[] = body.data ?? [];
    if (tests.length === 0) { test.skip(true, "Aucun test disponible"); return; }

    await page.goto(`/enseignant/tests/${tests[0].id}/results`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("table, text=Résultats, text=Élèves, text=Score").first()).toBeVisible({ timeout: 10_000 });
  });

  test("/enseignant/tests/[id]/stats : statistiques par question (seed)", async ({ page }) => {
    const res = await page.request.get("/api/tests");
    if (!res.ok()) { test.skip(true, "API tests inaccessible"); return; }
    const body = await res.json();
    const tests: { id: number }[] = body.data ?? [];
    if (tests.length === 0) { test.skip(true, "Aucun test disponible"); return; }

    await page.goto(`/enseignant/tests/${tests[0].id}/stats`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, text=Statistiques, text=Question").first()).toBeVisible({ timeout: 10_000 });
  });
});
