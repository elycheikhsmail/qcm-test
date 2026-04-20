-- Requêtes de vérification après Sprint 3
-- Lancer avec : psql -U qcm_app -d qcm_db -f reflexion/queries.sql

-- 1. Nombre de questions par chapitre
SELECT ch.title, COUNT(q.*) AS nb_questions
FROM chapters ch
LEFT JOIN questions q ON q.chapter_id = ch.id
GROUP BY ch.title
ORDER BY nb_questions DESC;

-- 2. Répartition par type et difficulté
SELECT type, difficulty, COUNT(*) AS nb
FROM questions
GROUP BY type, difficulty
ORDER BY type, difficulty;

-- 3. Questions non validées (validated=false)
SELECT COUNT(*) AS non_validees FROM questions WHERE validated = FALSE;

-- 4. Questions par source (trace de provenance)
SELECT source, created_by, COUNT(*) FROM questions
GROUP BY source, created_by
ORDER BY COUNT(*) DESC;

-- 5. Simulation du tirage aléatoire côté app (Sprint 4)
--    N questions d'un chapitre + difficulté donnée, sans correct_answer
SELECT id, type, content, options, difficulty
FROM questions
WHERE chapter_id = 1
  AND difficulty = 'facile'
  AND validated = TRUE
ORDER BY random()
LIMIT 10;

-- 6. Vérifier qu'aucune question approuvée n'a un correct_answer vide
SELECT COUNT(*) FROM questions
WHERE correct_answer IS NULL
   OR correct_answer::text = '""'
   OR correct_answer::text = 'null';
