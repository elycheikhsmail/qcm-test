// One-shot : fusionner les subjects dupliqués par (name, language), réassigner
// les chapitres vers le subject canonique (le plus petit id), supprimer les orphelins
// et ajouter une contrainte UNIQUE (name, language).

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

try {
  await sql.begin(async (tx) => {
    // 1. Groupes de subjects dupliqués (name, language) → garder le plus petit id
    const groups = await tx<{ name: string; language: string; keep_id: number; dup_ids: number[] }[]>`
      WITH grp AS (
        SELECT name, language, MIN(id) AS keep_id, array_agg(id ORDER BY id) AS all_ids
        FROM subjects
        GROUP BY name, language
        HAVING COUNT(*) > 1
      )
      SELECT
        name,
        language,
        keep_id,
        (SELECT array_agg(x) FROM unnest(all_ids) x WHERE x <> keep_id) AS dup_ids
      FROM grp
    `;

    for (const g of groups) {
      if (!g.dup_ids?.length) continue;
      console.log(`🔀 fusion "${g.name}/${g.language}" : garde id=${g.keep_id}, absorbe ${g.dup_ids.join(",")}`);

      // Essaye de réassigner les chapitres : si collision avec chapters déjà présents
      // sur (keep_id, level_id, title), supprime simplement le doublon.
      for (const dupId of g.dup_ids) {
        const moved = await tx<{ id: number }[]>`
          UPDATE chapters
             SET subject_id = ${g.keep_id}
           WHERE subject_id = ${dupId}
             AND NOT EXISTS (
               SELECT 1 FROM chapters c2
                WHERE c2.subject_id = ${g.keep_id}
                  AND c2.level_id  = chapters.level_id
                  AND c2.title     = chapters.title
             )
          RETURNING id
        `;
        console.log(`   ↳ ${moved.length} chapitres déplacés depuis subject ${dupId}`);

        const dropped = await tx<{ id: number }[]>`
          DELETE FROM chapters WHERE subject_id = ${dupId} RETURNING id
        `;
        console.log(`   ↳ ${dropped.length} chapitres doublons supprimés (subject ${dupId})`);
      }

      await tx`DELETE FROM subjects WHERE id = ANY(${g.dup_ids})`;
    }

    // 2. Orphelins éventuels (subjects avec 0 chapitre)
    const deleted = await tx<{ id: number }[]>`
      DELETE FROM subjects
       WHERE id NOT IN (SELECT DISTINCT subject_id FROM chapters)
      RETURNING id
    `;
    console.log(`🧹 ${deleted.length} subjects orphelins supprimés`);

    // 3. Contrainte UNIQUE
    await tx`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'subjects_name_language_key'
        ) THEN
          ALTER TABLE subjects ADD CONSTRAINT subjects_name_language_key UNIQUE (name, language);
        END IF;
      END $$
    `;
    console.log(`✅ Contrainte UNIQUE (name, language) sur subjects OK`);
  });
} catch (e) {
  console.error("❌", e);
  process.exit(1);
} finally {
  await sql.end();
}
