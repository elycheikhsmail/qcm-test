// Crée un compte admin pédagogique pour les tests Sprint 8+
// Usage : bun --env-file=.env.local run scripts/create-admin-ped.ts
//
// Variables d'environnement optionnelles :
//   AP_EMAIL      (défaut : admin.ped@qcm.local)
//   AP_PASSWORD   (défaut : AdminPed123!)
//   AP_FIRST_NAME (défaut : Fatima)
//   AP_LAST_NAME  (défaut : AdminPed)

import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquante.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 10 });

const email = process.env.AP_EMAIL ?? "admin.ped@qcm.local";
const password = process.env.AP_PASSWORD ?? "AdminPed123!";
const firstName = process.env.AP_FIRST_NAME ?? "Fatima";
const lastName = process.env.AP_LAST_NAME ?? "AdminPed";

try {
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    console.log(`ℹ️  Compte admin_ped déjà existant : ${email} (id=${existing[0].id})`);
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
    VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, 'admin_ped', 'email', TRUE)
    RETURNING id
  `;

  console.log(`✅ Admin pédagogique créé :`);
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
