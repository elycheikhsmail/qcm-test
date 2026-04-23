import { test as base, Page } from "@playwright/test";
import path from "path";

export type Role = "eleve" | "enseignant" | "directeur" | "admin_ped";

const stateDir = path.join(process.cwd(), "tests", "e2e", ".auth");

/** Retourne le chemin du storageState pour un rôle donné. */
export function storageStatePath(role: Role) {
  return path.join(stateDir, `${role}.json`);
}

/** Helper bas niveau : connexion via l'UI /login (utile si storageState absent). */
export async function loginAs(page: Page, role: Role) {
  const creds: Record<Role, { email: string; password: string }> = {
    eleve:      { email: "eleve@test.local",     password: "Test1234!" },
    enseignant: { email: "enseignant@test.local", password: "Test1234!" },
    directeur:  { email: "directeur@test.local",  password: "Test1234!" },
    admin_ped:  { email: "admin-ped@test.local",  password: "Test1234!" },
  };
  const { email, password } = creds[role];
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|enseignant|directeur|admin-ped)/, { timeout: 10_000 });
}

/** Fixture Playwright étendue exposant `loginAs`. */
export const test = base.extend<{ loginAs: (role: Role) => Promise<void> }>({
  loginAs: async ({ page }, use) => {
    await use((role) => loginAs(page, role));
  },
});

export { expect } from "@playwright/test";
