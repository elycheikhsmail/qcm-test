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

console.log("✅ Serveur prêt.");

// ── 2b. Préchauffer les routes critiques (compilation lazy en dev) ─────────
console.log("🔥 Préchauffage des routes…");
const WARMUP_ROUTES: Array<{ url: string; init?: RequestInit }> = [
  {
    url: `http://localhost:${PORT}/api/auth/login`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "warmup@x.local", password: "warmup" }),
    },
  },
  { url: `http://localhost:${PORT}/api/auth/logout`, init: { method: "POST" } },
];

for (const { url, init } of WARMUP_ROUTES) {
  try {
    await fetch(url, init);
  } catch {
    // ignore — juste déclencher la compilation
  }
}
console.log("✅ Routes préchauffées.\n");

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

// ── 4. Générer le résumé Markdown ─────────────────────────────────────────
try {
  const reportPath = "test-results/report.json";
  const summaryPath = "test-results/summary.md";
  const raw = await Bun.file(reportPath).text();
  const report = JSON.parse(raw) as {
    stats: { expected: number; unexpected: number; skipped: number; duration: number };
    suites: Array<{
      title: string;
      suites?: Array<{ title: string; specs: Array<{ title: string; tests: Array<{ status: string; results: Array<{ error?: { message?: string } }> }> }> }>;
    }>;
  };

  const { expected, unexpected, skipped, duration } = report.stats;
  const total = expected + unexpected + skipped;
  const icon = unexpected === 0 ? "✅" : "❌";
  const lines: string[] = [
    `# Rapport E2E — ${new Date().toLocaleString("fr-FR")}`,
    "",
    `${icon} **${expected} passés** / ${total} tests · ${unexpected} échoués · ${skipped} ignorés · ${(duration / 1000).toFixed(1)}s`,
    "",
  ];

  if (unexpected > 0) {
    lines.push("## Tests échoués\n");
    for (const suite of report.suites) {
      for (const sub of suite.suites ?? []) {
        for (const spec of sub.specs) {
          for (const test of spec.tests) {
            if (test.status !== "expected") {
              lines.push(`### ❌ ${suite.title} › ${sub.title} › ${spec.title}`);
              const msg = test.results[0]?.error?.message ?? "";
              const firstLine = msg.split("\n")[0].slice(0, 200);
              if (firstLine) lines.push(`\`\`\`\n${firstLine}\n\`\`\``);
              lines.push("");
            }
          }
        }
      }
    }
  }

  await Bun.write(summaryPath, lines.join("\n"));
  console.log(`\n📄 Résumé : ${summaryPath}`);
} catch {
  // rapport JSON absent (ex: --ui mode)
}

// ── 5. Arrêter le serveur ──────────────────────────────────────────────────
console.log("🛑 Arrêt du serveur de test…");
server.kill();
await server.exited;

process.exit(exitCode);
