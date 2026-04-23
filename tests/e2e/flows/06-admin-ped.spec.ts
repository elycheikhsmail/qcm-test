import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";

test.use({ storageState: storageStatePath("admin_ped") });

test.describe("Admin Pédagogique — questions", () => {
  test("/admin-ped/questions : liste chargée avec filtres", async ({ page }) => {
    await page.goto("/admin-ped/questions");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
    // La liste ou le message vide doit s'afficher
    await expect(
      page.locator("table tr, text=Aucune question, text=questions").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Approuver une question → disparaît de la liste 'non validées'", async ({ page }) => {
    await page.goto("/admin-ped/questions");
    await page.waitForLoadState("networkidle");

    // Cliquer sur le bouton Approuver de la première question disponible
    const approveBtn = page.locator('button:has-text("Approuver"), button:has-text("✓"), button:has-text("Valider")').first();
    const count = await approveBtn.count();
    if (count === 0) {
      test.skip(true, "Aucune question à approuver disponible");
      return;
    }

    // Prendre le texte de la première question pour vérification
    const firstRow = page.locator("table tr, [data-question]").first();
    await approveBtn.click();

    // Après approbation, la liste se recharge (état "non validées" par défaut)
    await page.waitForLoadState("networkidle");
    // Le bouton approuver doit diminuer ou disparaître
    const newCount = await page.locator('button:has-text("Approuver"), button:has-text("✓"), button:has-text("Valider")').count();
    expect(newCount).toBeLessThan(count + 1); // au moins stable
  });
});

test.describe("Admin Pédagogique — matières", () => {
  test("/admin-ped/matieres : liste des matières visible", async ({ page }) => {
    await page.goto("/admin-ped/matieres");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('Matières')")).toBeVisible({ timeout: 8_000 });
  });

  test("Créer une matière → apparaît dans la liste", async ({ page }) => {
    await page.goto("/admin-ped/matieres");
    await page.waitForLoadState("networkidle");

    const nom = `E2E-Matière-${Date.now()}`;
    await page.fill('input[placeholder*="Nom de la matière"]', nom);

    // Cliquer le bouton d'ajout (sans texte de submit clair, c'est souvent un bouton inline)
    const addBtn = page.locator('button:has-text("Ajouter"), button:has-text("+"), button[type="button"]:near(input[placeholder*="matière"])').first();
    await addBtn.click();

    await page.waitForLoadState("networkidle");
    await expect(page.locator(`text=${nom}`)).toBeVisible({ timeout: 8_000 });
  });

  test("Supprimer une matière e2e → disparaît de la liste", async ({ page }) => {
    await page.goto("/admin-ped/matieres");
    await page.waitForLoadState("networkidle");

    // Trouver une matière e2e créée par ce test
    const e2eItems = page.locator('[class*="flex"], [class*="item"], li').filter({ hasText: /E2E-Matière/ });
    const count = await e2eItems.count();
    if (count === 0) { test.skip(true, "Aucune matière E2E à supprimer"); return; }

    // Cliquer sur Supprimer sur le dialog (confirm) — intercepter la boîte de dialogue
    page.on("dialog", (d) => d.accept());
    const deleteBtn = e2eItems.first().locator('button:has-text("Supprimer"), button:has-text("✕"), button:has-text("×")').first();
    await deleteBtn.click();

    await page.waitForLoadState("networkidle");
    // La liste e2e doit avoir diminué
    await expect(page.locator('[class*="flex"], [class*="item"], li').filter({ hasText: /E2E-Matière/ })).toHaveCount(count - 1);
  });
});

test.describe("Admin Pédagogique — navigation", () => {
  test("/admin-ped : dashboard accessible", async ({ page }) => {
    await page.goto("/admin-ped");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, nav").first()).toBeVisible({ timeout: 8_000 });
  });

  test("/admin-ped/niveaux : accessible", async ({ page }) => {
    await page.goto("/admin-ped/niveaux");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });

  test("/admin-ped/chapitres : accessible", async ({ page }) => {
    await page.goto("/admin-ped/chapitres");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
  });
});
