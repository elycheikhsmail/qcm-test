# Sprint 1 — Base de données

**Dates :** 17 avril — 23 avril 2026  
**Durée :** 1 semaine  
**Sprint Goal :** Avoir un schéma PostgreSQL complet, migré et seedé, avec les premières questions importées et requêtables.

**Prérequis Sprint 0 :**
- Matière pilote choisie
- Format JSON intermédiaire validé
- ≥ 1 fichier JSON de questions générées disponible

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

| Priorité | Tâche | Estimation | Dépendances |
|----------|-------|------------|-------------|
| P0 | Écrire le schéma SQL complet (`schema.sql`) : tables subjects, levels, chapters, questions, magic_links, sessions, answers | 1 j | Décisions Sprint 0 |
| P0 | Écrire le script de migration Bun (`migrate.ts`) qui exécute `schema.sql` | 0.5 j | schema.sql |
| P0 | Écrire le seeder (`seed.ts`) : insérer matière pilote, niveaux scolaires, chapitres pilotes | 1 j | Migration OK |
| P0 | Écrire le script d'import JSON → PostgreSQL (`import-questions.ts`) | 1 j | Seeder OK + JSON disponible |
| P0 | Importer les premières questions générées (≥ 30 questions, ≥ 2 chapitres) | 0.5 j | import-questions.ts OK |
| P1 | Écrire des requêtes de vérification (questions par chapitre, par type, par difficulté) | 0.5 j | Import OK |
| P1 | Documenter la structure DB dans `spec/` ou `reflexion/` | 0.5 j | — |
| P2 | Ajouter des index PostgreSQL utiles (chapter_id, type, difficulty) | 0.5 j | Schema final |

**Charge prévue :** 5.5 j  
**Capacité :** 5 j  
**Note :** Couper P2 si nécessaire, facilement rattrapable en Sprint 2.

---

## Schéma cible (rappel spec)

```sql
-- Ordre de création respectant les FK
CREATE TABLE subjects (id SERIAL PRIMARY KEY, name TEXT, language VARCHAR(2));
CREATE TABLE levels (id SERIAL PRIMARY KEY, name TEXT, "order" INT);
CREATE TABLE chapters (id SERIAL PRIMARY KEY, subject_id INT REFERENCES subjects, level_id INT REFERENCES levels, title TEXT, description TEXT);
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  chapter_id INT REFERENCES chapters,
  type VARCHAR(20) CHECK (type IN ('qcm', 'true_false', 'fill_blank')),
  content TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 3),
  source TEXT,
  created_by VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE magic_links (id SERIAL PRIMARY KEY, token UUID DEFAULT gen_random_uuid(), level_id INT REFERENCES levels, expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ);
CREATE TABLE sessions (id SERIAL PRIMARY KEY, magic_link_id INT REFERENCES magic_links, started_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ);
CREATE TABLE answers (id SERIAL PRIMARY KEY, session_id INT REFERENCES sessions, question_id INT REFERENCES questions, given_answer TEXT, is_correct BOOLEAN, answered_at TIMESTAMPTZ DEFAULT NOW());
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| JSON généré en Sprint 0 de mauvaise qualité | Bloque l'import | Nettoyer manuellement ≥ 30 questions minimum |
| Ambiguité sur le champ `options` (JSONB vs TEXT[]) | Dette technique | Trancher dès J1 : JSONB (plus flexible) |
| Schéma mal conçu découvert à l'usage | Migrations douloureuses | Tester les requêtes API fictives avant de valider le schéma |

---

## Definition of Done

- [ ] `bun run migrate` s'exécute sans erreur sur base vide
- [ ] `bun run seed` insère matière, niveaux et chapitres pilotes
- [ ] `bun run import-questions <fichier.json>` insère les questions
- [ ] Requête SQL : récupérer 10 questions aléatoires d'un chapitre → fonctionne
- [ ] ≥ 30 questions en base, au moins 2 chapitres, au moins 2 types de questions

---

## Key Dates

| Date | Événement |
|------|-----------|
| 17 avril | Démarrage — schéma SQL en J1 |
| 20 avril | Mid-sprint : migration + seeder OK |
| 23 avril | Sprint review + questions importées vérifiées |
