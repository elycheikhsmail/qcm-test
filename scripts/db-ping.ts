import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL missing. Load .env.local first: `bun --env-file=.env.local run scripts/db-ping.ts`");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 5 });

try {
  const [{ up }] = await sql<{ up: number }[]>`SELECT 1 AS up`;
  const [{ version }] = await sql<{ version: string }[]>`SELECT version()`;
  const [{ db }] = await sql<{ db: string }[]>`SELECT current_database() AS db`;
  console.log(`✅ connected to ${db} — ping=${up}`);
  console.log(`   ${version}`);
  await sql.end();
  process.exit(0);
} catch (err) {
  console.error("❌ connection failed:", err instanceof Error ? err.message : err);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
}
