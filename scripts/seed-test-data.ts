/**
 * Seed complet pour les tests API automatisés.
 * Crée (ou vérifie) tous les comptes et données nécessaires.
 *
 * Usage : bun --env-file=.env.local run scripts/seed-test-data.ts
 *
 * Comptes créés :
 *   enseignant@test.local  / Test1234!  (role: enseignant)
 *   admin-ped@test.local   / Test1234!  (role: admin_ped)
 *   directeur@test.local   / Test1234!  (role: directeur)
 *   eleve@test.local       / Test1234!  (role: eleve)
 *
 * Données créées :
 *   - Établissement "Lycée Test Seed"
 *   - Classe "Terminale A Seed" (enseignant en tant que créateur)
 *   - Élève actif dans la classe
 *   - Directeur lié à la classe via directeur_classes
 *   - Un test (3 questions du chapitre 1 — Nombres décimaux)
 *   - Assignment test → classe
 *   - Session soumise de l'élève (score calculé)
 */

import { hash } from "@node-rs/argon2";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("❌ DATABASE_URL manquante"); process.exit(1); }

const sql = postgres(url, { max: 1, connect_timeout: 10 });

const PASSWORD = "Test1234!";
const ARGON_OPTS = { memoryCost: 65536, timeCost: 3, parallelism: 1 };

async function upsertUser(
  email: string,
  role: string,
  firstName: string,
  lastName: string,
): Promise<number> {
  const existing = await sql<{ id: number }[]>`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    console.log(`  ↩ ${role} déjà existant : ${email} (id=${existing[0].id})`);
    return existing[0].id;
  }
  const ph = await hash(PASSWORD, ARGON_OPTS);
  const [u] = await sql<{ id: number }[]>`
    INSERT INTO users (email, password_hash, first_name, last_name, role, auth_method, is_active)
    VALUES (${email}, ${ph}, ${firstName}, ${lastName}, ${role}, 'email', TRUE)
    RETURNING id
  `;
  console.log(`  ✅ Créé ${role} : ${email} (id=${u.id})`);
  return u.id;
}

try {
  console.log("\n🔧 Seed données de test\n");

  // ── Comptes ──────────────────────────────────────────────────────────────
  console.log("👤 Comptes utilisateurs :");
  const enseignantId = await upsertUser("enseignant@test.local", "enseignant", "Fatima", "Enseignant");
  const adminPedId   = await upsertUser("admin-ped@test.local",  "admin_ped",  "Omar",   "AdminPed");
  const directeurId  = await upsertUser("directeur@test.local",  "directeur",  "Moussa", "Directeur");
  const eleveId      = await upsertUser("eleve@test.local",       "eleve",      "Aïcha",  "Eleve");

  // ── Établissement ────────────────────────────────────────────────────────
  console.log("\n🏫 Établissement :");
  let etablissementId: number;
  const etabExist = await sql<{ id: number }[]>`SELECT id FROM etablissements WHERE nom = 'Lycée Test Seed'`;
  if (etabExist.length) {
    etablissementId = etabExist[0].id;
    console.log(`  ↩ Déjà existant (id=${etablissementId})`);
  } else {
    const [e] = await sql<{ id: number }[]>`
      INSERT INTO etablissements (nom, wilaya, ville)
      VALUES ('Lycée Test Seed', 'Nouakchott', 'Nouakchott')
      RETURNING id
    `;
    etablissementId = e.id;
    console.log(`  ✅ Créé (id=${etablissementId})`);
  }

  // ── Classe ───────────────────────────────────────────────────────────────
  console.log("\n🏛️  Classe :");
  let classeId: number;
  const classeExist = await sql<{ id: number }[]>`
    SELECT id FROM classes WHERE nom = 'Terminale A Seed' AND created_by = ${enseignantId}
  `;
  if (classeExist.length) {
    classeId = classeExist[0].id;
    console.log(`  ↩ Déjà existante (id=${classeId})`);
  } else {
    const [c] = await sql<{ id: number }[]>`
      INSERT INTO classes (nom, niveau, annee_scolaire, etablissement_id, created_by)
      VALUES ('Terminale A Seed', 'Terminale', '2025-2026', ${etablissementId}, ${enseignantId})
      RETURNING id
    `;
    classeId = c.id;
    console.log(`  ✅ Créée (id=${classeId})`);
  }

  // Lie l'enseignant à la classe
  await sql`
    INSERT INTO classe_enseignants (classe_id, enseignant_id)
    VALUES (${classeId}, ${enseignantId})
    ON CONFLICT DO NOTHING
  `;

  // ── Élève actif dans la classe ───────────────────────────────────────────
  console.log("\n🎓 Élève dans la classe :");
  const eleveInClasse = await sql<{ status: string }[]>`
    SELECT status FROM classe_eleves WHERE classe_id = ${classeId} AND eleve_id = ${eleveId}
  `;
  if (eleveInClasse.length) {
    if (eleveInClasse[0].status !== "active") {
      await sql`UPDATE classe_eleves SET status='active' WHERE classe_id=${classeId} AND eleve_id=${eleveId}`;
      console.log(`  ↩ Status mis à jour → active`);
    } else {
      console.log(`  ↩ Déjà actif`);
    }
  } else {
    await sql`
      INSERT INTO classe_eleves (classe_id, eleve_id, status)
      VALUES (${classeId}, ${eleveId}, 'active')
    `;
    console.log(`  ✅ Élève ajouté (active)`);
  }

  // ── Directeur lié à la classe ────────────────────────────────────────────
  console.log("\n📋 Directeur → classe :");
  await sql`
    INSERT INTO directeur_classes (directeur_id, classe_id)
    VALUES (${directeurId}, ${classeId})
    ON CONFLICT DO NOTHING
  `;
  console.log(`  ✅ directeur_classes OK`);

  // ── Test formel ──────────────────────────────────────────────────────────
  console.log("\n📝 Test formel :");
  // Prend 3 questions validées du chapitre 1
  const questions = await sql<{ id: number; content: string; options: unknown; correct_answer: unknown; type: string; difficulty: string }[]>`
    SELECT id, content, options, correct_answer, type, difficulty
    FROM questions
    WHERE validated = TRUE AND chapter_id = 1
    LIMIT 3
  `;
  if (questions.length < 3) {
    console.log(`  ⚠️  Seulement ${questions.length} question(s) validée(s) dans chapter_id=1. Test créé avec ce qui est disponible.`);
  }

  let testId: number;
  const testExist = await sql<{ id: number }[]>`
    SELECT id FROM tests WHERE created_by = ${enseignantId} AND chapter_id = 1 AND question_count = 3
  `;
  if (testExist.length) {
    testId = testExist[0].id;
    console.log(`  ↩ Test déjà existant (id=${testId})`);
  } else {
    const [t] = await sql<{ id: number }[]>`
      INSERT INTO tests (created_by, subject_id, level_id, chapter_id, difficulty, question_count, time_mode)
      VALUES (${enseignantId}, 1, 7, 1, 'facile', ${questions.length}, 'libre')
      RETURNING id
    `;
    testId = t.id;
    console.log(`  ✅ Test créé (id=${testId})`);

    // Snapshots questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await sql`
        INSERT INTO test_questions (test_id, question_id, "order")
        VALUES (${testId}, ${q.id}, ${i + 1})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`  ✅ ${questions.length} question(s) snapshotées`);
  }

  // ── Assignment test → classe ─────────────────────────────────────────────
  console.log("\n📌 Assignment test → classe :");
  await sql`
    INSERT INTO test_assignments (test_id, target_type, target_id)
    VALUES (${testId}, 'classe', ${classeId})
    ON CONFLICT DO NOTHING
  `;
  console.log(`  ✅ test_assignments OK`);

  // ── Session soumise de l'élève ───────────────────────────────────────────
  console.log("\n✍️  Session soumise (élève) :");
  const sesExist = await sql<{ id: number; submitted_at: Date | null }[]>`
    SELECT id, submitted_at FROM sessions WHERE eleve_id = ${eleveId} AND test_id = ${testId}
  `;
  let sessionId: number;
  if (sesExist.length && sesExist[0].submitted_at) {
    sessionId = sesExist[0].id;
    console.log(`  ↩ Session déjà soumise (id=${sessionId})`);
  } else {
    if (sesExist.length) {
      sessionId = sesExist[0].id;
      console.log(`  ↩ Session existante non soumise (id=${sessionId})`);
    } else {
      const [s] = await sql<{ id: number }[]>`
        INSERT INTO sessions (test_id, eleve_id, is_anonymous)
        VALUES (${testId}, ${eleveId}, FALSE)
        RETURNING id
      `;
      sessionId = s.id;
      console.log(`  ✅ Session créée (id=${sessionId})`);
    }

    // Répond à chaque question avec la bonne réponse (score = 20)
    const snapQuestions = await sql<{ question_id: number; correct_answer: unknown }[]>`
      SELECT tq.question_id, q.correct_answer
      FROM test_questions tq
      JOIN questions q ON q.id = tq.question_id
      WHERE tq.test_id = ${testId}
    `;
    for (const q of snapQuestions) {
      const ans = Array.isArray(q.correct_answer)
        ? (q.correct_answer as string[])[0]
        : String(q.correct_answer);
      await sql`
        INSERT INTO answers (session_id, question_id, given_answer, is_correct)
        VALUES (${sessionId}, ${q.question_id}, ${ans}, TRUE)
        ON CONFLICT (session_id, question_id) DO NOTHING
      `;
    }

    // Toutes les réponses correctes → score = nombre de bonnes réponses (raw count)
    const total = snapQuestions.length;
    await sql`
      UPDATE sessions
      SET submitted_at = NOW(), score = ${total}
      WHERE id = ${sessionId}
    `;
    console.log(`  ✅ Session soumise, score=${total}/${total} (${total}/20 ≈ 20)`);
  }

  // ── Résumé ───────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(55));
  console.log("✅  Seed terminé. Variables à utiliser dans les tests :\n");
  console.log(`   TEACHER_EMAIL=enseignant@test.local   TEACHER_PASSWORD=Test1234!`);
  console.log(`   ADMIN_PED_EMAIL=admin-ped@test.local  ADMIN_PED_PASSWORD=Test1234!`);
  console.log(`   DIRECTEUR_EMAIL=directeur@test.local  DIRECTEUR_PASSWORD=Test1234!`);
  console.log("");
  console.log(`   Classe seed   : id=${classeId}  (${'"'}Terminale A Seed${'"'})`);
  console.log(`   Test seed     : id=${testId}`);
  console.log(`   Élève seed    : id=${eleveId}  (eleve@test.local)`);
  console.log("─".repeat(55) + "\n");

} catch (err) {
  console.error("❌ Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await sql.end();
}
