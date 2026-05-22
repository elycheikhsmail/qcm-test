/**
 * Lance next dev sur le port 3001 avec les variables de .env.test.
 * Les vars chargées par bun --env-file=.env.test sont déjà dans process.env
 * avant que Next.js charge ses propres fichiers .env — Next.js ne surécrit
 * pas les vars déjà présentes dans process.env.
 *
 * Usage : bun run dev:test
 */

const proc = Bun.spawn(["bun", "run", "next", "dev", "--port", "3001"], {
  env: { ...process.env },
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

export {};

process.exitCode = await proc.exited;
