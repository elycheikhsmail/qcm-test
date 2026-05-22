import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";

test.use({ storageState: storageStatePath("eleve") });

test.describe("Parent — tableau de bord lecture seule", () => {
  test("/parent : moyenne globale et nb tests visibles", async ({ page }) => {
    await page.goto("/parent");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Moyenne générale")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Tests passés")).toBeVisible({ timeout: 8_000 });
  });

  test("/parent : mention 'lecture seule' visible", async ({ page }) => {
    await page.goto("/parent");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=lecture seule").first()).toBeVisible({ timeout: 8_000 });
  });

  test("/parent : indicateurs couleur (vert/amber/rouge) présents si données", async ({ page }) => {
    await page.goto("/parent");
    await page.waitForLoadState("networkidle");
    // Vérifier au moins un indicateur coloré ou le message vide
    const indicators = page.locator(".bg-emerald-50, .bg-amber-50, .bg-red-50")
      .or(page.locator("text=—"))
      .or(page.locator("text=Aucun test passé"));
    await expect(indicators.first()).toBeVisible({ timeout: 8_000 });
  });

  test("/parent : aucun bouton d'action disponible", async ({ page }) => {
    await page.goto("/parent");
    await page.waitForLoadState("networkidle");
    // La page ne doit contenir aucun bouton type submit / action
    const actionBtns = page.locator('button[type="submit"], button:has-text("Créer"), button:has-text("Modifier"), button:has-text("Supprimer")');
    await expect(actionBtns).toHaveCount(0);
  });
});
