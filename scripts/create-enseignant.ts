// Crée un compte enseignant pour les tests Sprint 8+
// Usage : bun --env-file=.env.local run scripts/create-enseignant.ts
//
// Variables d'environnement optionnelles :
//   ENS_EMAIL      (défaut : enseignant@qcm.local)
//   ENS_PASSWORD   (défaut : Enseignant123!)
//   ENS_FIRST_NAME (défaut : Ahmed)
//   ENS_LAST_NAME  (défaut : Enseignant)

import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquante.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 10 });

const email = process.env.ENS_EMAIL ?? "enseignant@qcm.local";
const password = process.env.ENS_PASSWORD ?? "Enseignant123!";
const firstName = process.env.ENS_FIRST_NAME ?? "Ahmed";
const lastName = process.env.ENS_LAST_NAME ?? "Enseignant";

try {
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    console.log(`ℹ️  Compte enseignant déjà existant : ${email} (id=${existing[0].id})`);
    await sql.end();
    process.exit(0);
  }

  const passwordHash = await hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const [user] = await sql<{ id: number }[]>`
    INSERT INTO users (email, password_hash, first_name, last_name, role, auth_method, is_active)
    VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, 'enseignant', 'email', TRUE)
    RETURNING id
  `;

  console.log(`✅ Enseignant créé :`);
  console.log(`   id         : ${user.id}`);
  console.log(`   email      : ${email}`);
  console.log(`   password   : ${password}`);
  console.log(`   nom        : ${firstName} ${lastName}`);
} catch (err) {
  console.error("❌ Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await sql.end();
}
