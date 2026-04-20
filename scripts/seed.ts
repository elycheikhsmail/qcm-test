// Insère les données de référence : matière Mathématiques + tous les niveaux
// mauritaniens + chapitres pilotes pour les tests Sprint 3+.
// Idempotent via ON CONFLICT DO NOTHING.
// Usage : bun run db:seed

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquante.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 10 });

// ─── NIVEAUX ──────────────────────────────────────────────────────────────────
// Mauritanie : Fondamental 1AF-6AF, Secondaire 1er cycle 1AS-4AS,
//              Secondaire 2ème cycle 5AS-7AS (Terminale = 7AS)
const LEVELS = [
  { name: "1AF", order: 1 },
  { name: "2AF", order: 2 },
  { name: "3AF", order: 3 },
  { name: "4AF", order: 4 },
  { name: "5AF", order: 5 },
  { name: "6AF", order: 6 },
  { name: "1AS", order: 7 },
  { name: "2AS", order: 8 },
  { name: "3AS", order: 9 },
  { name: "4AS", order: 10 },
  { name: "5AS", order: 11 },
  { name: "6AS", order: 12 },
  { name: "7AS", order: 13 },
];

// ─── MATIÈRE PILOTE ───────────────────────────────────────────────────────────
const SUBJECT = { name: "Mathématiques", language: "fr" as const };

// ─── CHAPITRES PILOTES ────────────────────────────────────────────────────────
// (niveau_name, chapitre_titre, description)
const PILOT_CHAPTERS: { level: string; title: string; description: string }[] = [
  {
    level: "1AS",
    title: "Nombres décimaux et fractions",
    description: "Représentation décimale, fractions, comparaison et opérations",
  },
  {
    level: "1AS",
    title: "Calcul littéral",
    description: "Expressions algébriques, développement, factorisation",
  },
  {
    level: "2AS",
    title: "Fonctions et représentations graphiques",
    description: "Notion de fonction, tableaux de valeurs, courbes",
  },
  {
    level: "3AS",
    title: "Équations et inéquations",
    description: "Résolution d'équations du 1er et 2ème degré",
  },
  {
    level: "6AF",
    title: "Géométrie plane — Triangles",
    description: "Propriétés des triangles, théorème de Thalès",
  },
];

try {
  // 0. Admin technique par défaut (sert de created_by pour magic_links)
  await sql`
    INSERT INTO users (role, auth_method, email, first_name, last_name, is_active)
    VALUES ('admin_tech', 'email', 'admin@qcm.local', 'Admin', 'Technique', TRUE)
    ON CONFLICT (email) DO NOTHING
  `;
  const [admin] = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = 'admin@qcm.local'
  `;
  console.log(`✅ Admin technique (id=${admin?.id})`);

  // 1. Niveaux
  for (const lvl of LEVELS) {
    await sql`
      INSERT INTO levels (name, "order")
      VALUES (${lvl.name}, ${lvl.order})
      ON CONFLICT (name) DO NOTHING
    `;
  }
  console.log(`✅ ${LEVELS.length} niveaux insérés (ou déjà présents)`);

  // 2. Matière
  await sql`
    INSERT INTO subjects (name, language)
    VALUES (${SUBJECT.name}, ${SUBJECT.language})
    ON CONFLICT (name, language) DO NOTHING
  `;
  const [subjectRow] = await sql<{ id: number }[]>`
    SELECT id FROM subjects WHERE name = ${SUBJECT.name} AND language = ${SUBJECT.language}
  `;
  const subjectId: number = subjectRow.id;
  console.log(`✅ Matière "${SUBJECT.name}" (id=${subjectId})`);

  // 3. Chapitres pilotes
  let chapCount = 0;
  for (const ch of PILOT_CHAPTERS) {
    const levelRows = await sql<{ id: number }[]>`
      SELECT id FROM levels WHERE name = ${ch.level}
    `;
    if (!levelRows.length) {
      console.warn(`⚠️  Niveau "${ch.level}" introuvable — chapitre ignoré`);
      continue;
    }
    const levelId = levelRows[0].id;
    await sql`
      INSERT INTO chapters (subject_id, level_id, title, description)
      VALUES (${subjectId}, ${levelId}, ${ch.title}, ${ch.description})
      ON CONFLICT (subject_id, level_id, title) DO NOTHING
    `;
    chapCount++;
  }
  console.log(`✅ ${chapCount} chapitres pilotes insérés (ou déjà présents)`);

  // 4. Récap
  const [{ nb_levels }] = await sql<{ nb_levels: string }[]>`SELECT COUNT(*) AS nb_levels FROM levels`;
  const [{ nb_chapters }] = await sql<{ nb_chapters: string }[]>`SELECT COUNT(*) AS nb_chapters FROM chapters`;
  console.log(`\n📊 Base après seed : ${nb_levels} niveaux, ${nb_chapters} chapitres`);
} catch (err) {
  console.error("❌ Seed échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await sql.end();
}
