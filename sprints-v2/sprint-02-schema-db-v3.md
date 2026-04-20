# Sprint 2 — Schéma DB v3 complet

**Dates :** 27 avril — 3 mai 2026
**Durée :** 1 semaine
**Statut :** ✅ **TERMINÉ** (2026-04-20)
**Sprint Goal :** Avoir **toutes** les tables de la spec v3 (§ Structure des données) créées en PostgreSQL via un script de migration idempotent, avec seed de données de référence (matières, niveaux, chapitres pilotes).

**Prérequis Sprint 1 :** Next.js + PostgreSQL connectés, `lib/db.ts` fonctionnel.

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
| P0 | Écrire `db/schema.sql` — toutes les tables spec v3 (13 tables) | 1.5 j | Spec v3 |
| P0 | Écrire `scripts/migrate.ts` (exécute `schema.sql`, idempotent via `CREATE TABLE IF NOT EXISTS`) | 0.5 j | schema.sql |
| P0 | Écrire `scripts/seed.ts` — matière Mathématiques + niveaux 1AF→7AS + chapitres pilotes | 1 j | migrate OK |
| P0 | Ajouter les contraintes FK, CHECK (ENUMs), UNIQUE (ex: `classes(nom, annee_scolaire)`) | 0.5 j | schema.sql |
| P0 | Ajouter les index utiles (`questions.chapter_id`, `questions.difficulty`, `sessions.eleve_id`, `answers.session_id`) | 0.5 j | schema.sql |
| P1 | Documenter le schéma dans `reflexion/schema_db_v3.md` (diagramme ER + rationale des choix) | 0.5 j | — |
| P1 | Ajouter `scripts/db-reset.ts` (DROP SCHEMA public CASCADE + migrate + seed) pour dev | 0.25 j | migrate + seed |
| P1 | Choisir format des ENUMs : types PostgreSQL ou CHECK constraints (reco : CHECK, plus simple à migrer) | 0.25 j | — |
| P2 | Ajouter trigger `updated_at` automatique sur tables mutables | 0.25 j | — |

**Charge prévue :** 5.25 j — **Capacité :** 5 j — couper P2.

---

## Tables cibles (v3, ordre de création)

1. `users` — id, role, auth_method, phone, email, google_id, first_name, last_name, created_at, is_active
2. `etablissements` — id, nom, wilaya, ville
3. `subjects` — id, name, language
4. `levels` — id, name, order
5. `chapters` — id, subject_id, level_id, title, description
6. `questions` — id, chapter_id, type, content, options (JSONB), correct_answer (JSONB), difficulty, source, created_by, validated, created_at
7. `classes` — id, etablissement_id, niveau, filiere, nom, annee_scolaire, created_by
8. `classe_enseignants` — classe_id, enseignant_id (PK composite)
9. `classe_eleves` — classe_id, eleve_id, joined_at, status
10. `directeur_classes` — directeur_id, classe_id
11. `magic_links` — id, token UUID, created_by, level_id, expires_at, max_uses, use_count
12. `tests` — id, created_by, subject_id, level_id, chapter_id, difficulty, question_count, time_mode, duration_minutes, deadline_at, created_at
13. `test_questions` — test_id, question_id, order
14. `test_assignments` — id, test_id, target_type, target_id, assigned_at
15. `sessions` — id, test_id, eleve_id, magic_link_id, started_at, submitted_at, score, is_anonymous
16. `answers` — id, session_id, question_id, given_answer (JSONB), is_correct, answered_at

> 16 tables au total (la spec en liste 13 "principales" + 3 tables de liaison). Toutes créées ce sprint — pas de dette technique sur le schéma.

---

## ENUMs à verrouiller

| Colonne | Valeurs |
|---|---|
| `users.role` | admin_tech, admin_ped, enseignant, eleve, directeur, parent |
| `users.auth_method` | phone, email, google, magic_link |
| `subjects.language` | ar, fr |
| `questions.type` | qcm, true_false, matching, fill_blank |
| `questions.difficulty` | facile, moyen, difficile *(ou 1/2/3 — décider en J1 et aligner le script d'import S3)* |
| `classe_eleves.status` | pending, active |
| `tests.time_mode` | libre, chrono, deadline |
| `test_assignments.target_type` | classe, eleve |

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Divergence entre difficulté JSON pipeline (1/2/3) et spec v3 (facile/moyen/difficile) | Script d'import cassé S3 | **Trancher J1** : garder strings en DB, le script d'import S3 fait le mapping 1→facile etc. |
| Oubli d'une contrainte FK découvert à l'usage | Migration douloureuse plus tard | Écrire `reflexion/schema_db_v3.md` en parallèle — force à relire la spec |
| Schéma JSONB `options` mal structuré (QCM vs matching) | Import cassé | Documenter la forme attendue par `type` dans `schema.sql` (commentaire SQL) |

---

## Definition of Done

- [ ] `bun run migrate` sur base vide crée les 16 tables sans erreur
- [ ] `bun run seed` insère Mathématiques + 10 niveaux (1AF–7AS) + ≥ 3 chapitres pilotes
- [ ] `bun run db-reset && bun run migrate && bun run seed` est reproductible
- [ ] Toutes les FK et CHECK sont en place (vérifiable via `\d+ table` en psql)
- [ ] `reflexion/schema_db_v3.md` à jour avec le rationale des ENUMs et du choix JSONB

---

## Key Dates

| Date | Événement |
|------|-----------|
| 27 avril | Démarrage — trancher `difficulty` en J1 |
| 30 avril | Mid-sprint : 16 tables + FK + index |
| 3 mai | Sprint review — démo `db-reset` + inspection psql |
