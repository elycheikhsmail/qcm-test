/**
 * Setup global Playwright :
 * 1. Crée les storageState (sessions) par rôle via /login
 * 2. Génère un magic link token réutilisable (max_uses=50) pour les tests quiz
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3001";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "dev_admin_token_change_me";

const ROLES = [
  { name: "eleve",      email: "eleve@test.local",       password: "Test1234!" },
  { name: "enseignant", email: "enseignant@test.local",   password: "Test1234!" },
  { name: "directeur",  email: "directeur@test.local",    password: "Test1234!" },
  { name: "admin_ped",  email: "admin-ped@test.local",    password: "Test1234!" },
] as const;

export const stateDir = path.join(process.cwd(), "tests", "e2e", ".auth");

setup("create auth sessions and magic link token", async ({ page, request }) => {
  fs.mkdirSync(stateDir, { recursive: true });

  // ── 1. Sessions par rôle ──────────────────────────────────────────────────
  for (const role of ROLES) {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"]', role.email);
    await page.fill('input[name="password"]', role.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|enseignant|directeur|admin-ped)/, { timeout: 15_000 });
    await page.context().storageState({ path: path.join(stateDir, `${role.name}.json`) });
    console.log(`  ✅ storageState: ${role.name}`);
    // Déconnexion pour ne pas polluer la prochaine session
    await request.post(`${BASE}/api/auth/logout`);
  }

  // ── 2. Magic link token pour les tests quiz ───────────────────────────────
  const res = await request.post(`${BASE}/api/magic-links`, {
    headers: { "x-admin-token": ADMIN_TOKEN },
    data: { max_uses: 50, expires_in: 24 },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const token: string = body.data.token;

  fs.writeFileSync(
    path.join(stateDir, "magic-link.json"),
    JSON.stringify({ token }),
  );
  console.log(`  ✅ magic link token saved`);
});
