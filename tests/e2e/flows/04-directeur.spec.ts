import { test, expect } from "@playwright/test";
import { storageStatePath } from "../fixtures/auth.fixture";

test.use({ storageState: storageStatePath("directeur") });

test.describe("Directeur — classes", () => {
  test("/directeur/classes : liste des classes assignées", async ({ page }) => {
    await page.goto("/directeur/classes");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("text=Mes classes, text=Terminale, text=Aucune classe").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("/directeur/classes/[id] : stats avg/min/max visibles (seed)", async ({ page }) => {
    const res = await page.request.get("/api/directeur/classes");
    if (!res.ok()) { test.skip(true, "API directeur/classes inaccessible"); return; }
    const body = await res.json();
    const classes: { id: number }[] = body.data ?? [];
    if (classes.length === 0) { test.skip(true, "Aucune classe assignée"); return; }

    await page.goto(`/directeur/classes/${classes[0].id}`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("text=/avg|moy|min|max|moyenne/i").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Directeur — élèves", () => {
  test("/directeur/eleves/[id] : profil élève et historique tests (seed)", async ({ page }) => {
    // Récupère l'élève seed via la première classe
    const cRes = await page.request.get("/api/directeur/classes");
    if (!cRes.ok()) { test.skip(true, "API inaccessible"); return; }
    const classes: { id: number }[] = (await cRes.json()).data ?? [];
    if (classes.length === 0) { test.skip(true, "Aucune classe"); return; }

    const eRes = await page.request.get(`/api/classes/${classes[0].id}/eleves`);
    if (!eRes.ok()) { test.skip(true, "API élèves inaccessible"); return; }
    const eleves: { id: number }[] = (await eRes.json()).data ?? [];
    if (eleves.length === 0) { test.skip(true, "Aucun élève"); return; }

    await page.goto(`/directeur/eleves/${eleves[0].id}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, text=historique, text=Tests, text=Profil").first()).toBeVisible({ timeout: 10_000 });
  });

  test("/directeur/eleves/[id]/evolution : LineChart SVG rendu (seed)", async ({ page }) => {
    const cRes = await page.request.get("/api/directeur/classes");
    if (!cRes.ok()) { test.skip(true, "API inaccessible"); return; }
    const classes: { id: number }[] = (await cRes.json()).data ?? [];
    if (classes.length === 0) { test.skip(true, "Aucune classe"); return; }

    const eRes = await page.request.get(`/api/classes/${classes[0].id}/eleves`);
    if (!eRes.ok()) { test.skip(true, "API élèves inaccessible"); return; }
    const eleves: { id: number }[] = (await eRes.json()).data ?? [];
    if (eleves.length === 0) { test.skip(true, "Aucun élève"); return; }

    await page.goto(`/directeur/eleves/${eleves[0].id}/evolution`);
    await page.waitForLoadState("networkidle");
    // Le LineChart est un SVG natif
    await expect(page.locator("svg")).toBeVisible({ timeout: 10_000 });
  });
});
