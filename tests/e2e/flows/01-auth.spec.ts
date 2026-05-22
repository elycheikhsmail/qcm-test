import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";

const EMAIL = `e2e-signup-${Date.now()}@test.local`;

test.describe("Auth — signup", () => {
  test("inscription valide → redirige vers /dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('input[name="first_name"]', "Test");
    await page.fill('input[name="last_name"]', "E2E");
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("bouton Google OAuth présent sur /signup", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('a[href="/api/auth/google"]')).toBeVisible();
  });
});

test.describe("Auth — login", () => {
  test("connexion valide élève → /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "eleve@test.local");
    await page.fill('input[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("connexion invalide → message d'erreur visible", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "eleve@test.local");
    await page.fill('input[name="password"]', "mauvais_mot_de_passe");
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=Identifiants incorrects")
        .or(page.locator("text=incorrect"))
        .or(page.locator("text=invalide"))
        .first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("bouton Google OAuth présent sur /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('a[href="/api/auth/google"]')).toBeVisible();
  });
});

test.describe("Auth — protection des routes", () => {
  test("/dashboard sans session → redirige vers /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("/enseignant/classes sans session → redirige vers /login", async ({ page }) => {
    await page.goto("/enseignant/classes");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("/directeur sans session → redirige vers /login", async ({ page }) => {
    await page.goto("/directeur/classes");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

test.describe("Auth — logout", () => {
  // Fresh login — ne pas utiliser le storageState partagé pour ne pas invalider la session eleve
  test("logout → redirige vers /login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "eleve@test.local");
    await page.fill('input[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await page.request.post("/api/auth/logout");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
