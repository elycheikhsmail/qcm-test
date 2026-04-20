// One-shot : relâcher NOT NULL sur created_by pour tests + magic_links
// Et passer leur FK à ON DELETE SET NULL. À exécuter une fois avant S4.
//
// Usage : bun --env-file=.env.local run scripts/alter-s4.ts

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant (vérifie .env.local)");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql.begin(async (tx) => {
    await tx`ALTER TABLE tests ALTER COLUMN created_by DROP NOT NULL`;
    await tx`ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_created_by_fkey`;
    await tx`ALTER TABLE tests ADD CONSTRAINT tests_created_by_fkey
             FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`;

    await tx`ALTER TABLE magic_links ALTER COLUMN created_by DROP NOT NULL`;
    await tx`ALTER TABLE magic_links DROP CONSTRAINT IF EXISTS magic_links_created_by_fkey`;
    await tx`ALTER TABLE magic_links ADD CONSTRAINT magic_links_created_by_fkey
             FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`;
  });
  console.log("✅ ALTER OK : tests.created_by + magic_links.created_by sont maintenant NULLables");
} catch (e) {
  console.error("❌", e);
  process.exit(1);
} finally {
  await sql.end();
}
