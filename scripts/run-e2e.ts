/**
 * Lance le serveur de test + Playwright en un seul processus.
 * Usage : bun run e2e
 *         bun run e2e --ui        (interface Playwright)
 *         bun run e2e --headed    (navigateur visible)
 *         bun run e2e --debug     (mode pas-à-pas)
 */
import { spawn } from "bun";

const PORT = 3001;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;
const MAX_WAIT_MS = 120_000;
const POLL_MS = 1_000;

const args = process.argv.slice(2); // ex: ["--ui"]

// ── 1. Démarrer le serveur Next.js (DB de test) ────────────────────────────
console.log("🚀 Démarrage du serveur de test (port 3001)…");

const server = spawn({
  cmd: ["bun", "--env-file=.env.test", "run", "dev:test"],
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env },
});

// ── 2. Attendre que /api/health réponde ────────────────────────────────────
console.log("⏳ En attente du serveur…");
const deadline = Date.now() + MAX_WAIT_MS;

while (true) {
  if (Date.now() > deadline) {
    console.error(`❌ Serveur non disponible après ${MAX_WAIT_MS / 1000}s`);
    server.kill();
    process.exit(1);
  }
  try {
    const res = await fetch(HEALTH_URL);
    if (res.ok) break;
  } catch {
    // pas encore prêt
  }
  await Bun.sleep(POLL_MS);
}

console.log("✅ Serveur prêt.\n");

// ── 3. Lancer Playwright ────────────────────────────────────────────────────
const playwrightArgs = ["playwright", "test"];
if (args.includes("--ui"))     playwrightArgs.push("--ui");
if (args.includes("--headed")) playwrightArgs.push("--headed");
if (args.includes("--debug"))  playwrightArgs.push("--debug");

console.log(`🎭 playwright test ${playwrightArgs.slice(2).join(" ") || "(headless)"}\n`);

const pw = spawn({
  cmd: ["bunx", ...playwrightArgs],
  stdout: "inherit",
  stderr: "inherit",
  env: {
    ...process.env,
    // Indiquer à Playwright de réutiliser le serveur déjà lancé
    PLAYWRIGHT_REUSE_SERVER: "1",
  },
});

const exitCode = await pw.exited;

// ── 4. Arrêter le serveur ──────────────────────────────────────────────────
console.log("\n🛑 Arrêt du serveur de test…");
server.kill();
await server.exited;

process.exit(exitCode);
