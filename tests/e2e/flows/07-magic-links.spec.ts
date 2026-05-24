/**
 * E2E — Magic links : trois voies de génération + utilisation par l'élève
 *
 * Couvre :
 *   1. Admin / Claude Code (header X-Admin-Token)         → POST /api/magic-links
 *   2. Admin pédagogique connecté (session)               → UI /admin-ped/magic-links
 *   3. Enseignant connecté (session)                      → UI /enseignant/classes/[id]
 *   4. L'élève anonyme utilise un token pour accéder      → /?token=... → /quiz/select
 */
import { test, expect, request as pwRequest } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "dev_admin_token_change_me";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.describe("Magic links — 3 voies de génération", () => {
  test("1. Admin/Claude Code (X-Admin-Token) → token UUID valide", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.post("http://localhost:3001/api/magic-links", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { expires_in: 1, max_uses: 5 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.token).toMatch(UUID_RE);
    expect(body.data.max_uses).toBe(5);

    // Validation immédiate du token via la route publique
    const check = await ctx.get(
      `http://localhost:3001/api/magic-links/${body.data.token}`,
    );
    expect(check.status()).toBe(200);
    const checkBody = await check.json();
    expect(checkBody.data.remaining_uses).toBe(5);
    await ctx.dispose();
  });

  test("2. Admin pédagogique connecté (session) → API accepte sans X-Admin-Token", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: storageStatePath("admin_ped"),
    });
    const page = await ctx.newPage();
    const res = await page.request.post("/api/magic-links", {
      data: { expires_in: 2, max_uses: 3 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.token).toMatch(UUID_RE);
    expect(body.data.max_uses).toBe(3);
    await ctx.close();
  });

  test("2bis. Admin pédagogique — UI /admin-ped/magic-links génère et affiche le token", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: storageStatePath("admin_ped"),
    });
    const page = await ctx.newPage();
    await page.goto("/admin-ped/magic-links");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText("magic link");

    // Soumettre le formulaire avec les valeurs par défaut
    await page.locator('button[type="submit"]').click();

    // Le bloc de résultat doit apparaître avec un token UUID
    const result = page.locator('[data-testid="magic-link-result"]');
    await expect(result).toBeVisible({ timeout: 10_000 });

    const url = await page.locator('[data-testid="magic-link-url"]').textContent();
    expect(url).toMatch(/\?token=[0-9a-f-]{36}/);
    await ctx.close();
  });

  test("3. Enseignant — UI /enseignant/classes/[id] génère un magic link pour la classe", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: storageStatePath("enseignant"),
    });
    const page = await ctx.newPage();

    // Trouver une classe gérée par l'enseignant
    const classesRes = await page.request.get("/api/classes");
    expect(classesRes.ok()).toBeTruthy();
    const classesBody = await classesRes.json();
    const classes: { id: number }[] = classesBody.data ?? [];
    if (classes.length === 0) {
      test.skip(true, "Aucune classe d'enseignant disponible — seed insuffisant");
      await ctx.close();
      return;
    }

    await page.goto(`/enseignant/classes/${classes[0].id}`);
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("Magic link")').click();

    // Le bandeau vert "Magic link prêt" doit apparaître
    await expect(page.locator("text=Magic link prêt")).toBeVisible({
      timeout: 10_000,
    });
    await ctx.close();
  });
});

test.describe("Magic links — utilisation par l'élève", () => {
  test("L'élève saisit le token → est redirigé vers /quiz/select", async ({
    page,
    playwright,
  }) => {
    // Générer un token frais via la route admin
    const ctx = await playwright.request.newContext();
    const res = await ctx.post("http://localhost:3001/api/magic-links", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { expires_in: 1, max_uses: 5 },
    });
    expect(res.status()).toBe(201);
    const { token } = (await res.json()).data;
    await ctx.dispose();

    // Élève anonyme : saisir le token sur la page d'accueil
    await page.goto("/");
    await page.fill('input[type="text"]', token);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/quiz/select", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/quiz\/select/);

    // Le token doit avoir été stocké en sessionStorage
    const stored = await page.evaluate(() => sessionStorage.getItem("quiz_token"));
    expect(stored).toBe(token);
  });

  test("/quiz/<token-uuid> (lien copié) → redirige vers /?token=...", async ({
    page,
    playwright,
  }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.post("http://localhost:3001/api/magic-links", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { expires_in: 1, max_uses: 2 },
    });
    const { token } = (await res.json()).data;
    await ctx.dispose();

    await page.goto(`/quiz/${token}`);
    // Redirection vers la home avec ?token=...
    await page.waitForURL(new RegExp(`\\?token=${token}`), { timeout: 10_000 });
    // Le champ token doit être pré-rempli
    await expect(page.locator('input[type="text"]')).toHaveValue(token);
  });

  test("Token invalide → message d'erreur affiché", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="text"]', "00000000-0000-0000-0000-000000000000");
    await page.click('button[type="submit"]');
    await expect(
      page.locator("text=/introuvable|invalide|expir/i").first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
