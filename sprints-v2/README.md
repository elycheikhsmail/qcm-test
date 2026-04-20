# Sprints v2 — Plan complet pour réaliser `spec/spec_projet_v3.md`

**Version** : 2.0
**Date de rédaction** : 2026-04-19
**Remplace** : `sprints-v1/` (qui ne couvrait que le MVP Phase 1)

---

## Vue d'ensemble

Découpage en **12 sprints hebdomadaires** (~1 semaine / sprint, dev solo à 5 j/sem).
Durée totale estimée : **~3 mois** (mi-avril → mi-juillet 2026).

| Sprint | Dates | Thème | Phase spec | Statut |
|---|---|---|---|---|
| [S0](sprint-00-pipeline-pedagogique.md) | 10–16 avr 2026 | Pipeline pédagogique (PDF → JSON) | Phase 1 | ✅ **Fait** |
| [S1](sprint-01-setup-next-postgres.md) | 20–26 avr 2026 | Setup Next.js + PostgreSQL | Phase 1 | ✅ **Fait** |
| [S2](sprint-02-schema-db-v3.md) | 27 avr – 3 mai | Schéma DB v3 complet | Phase 1–3 | ✅ **Fait** |
| [S3](sprint-03-import-json-db.md) | 4–10 mai | Import JSON → PostgreSQL | Phase 1 | ✅ **Fait** |
| [S4](sprint-04-api-magic-link-quiz.md) | 11–17 mai | API magic-link + quiz anonyme | Phase 1 | ⬜ |
| [S5](sprint-05-frontend-eleve-anonyme.md) | 18–24 mai | Frontend parcours élève anonyme | Phase 1 | ⬜ |
| [S6](sprint-06-mvp-hardening.md) | 25–31 mai | MVP hardening (tests, qualité, 100+ questions) | Phase 1 | ⬜ |
| [S7](sprint-07-auth-eleve-profil.md) | 1–7 juin | Auth élève (email+pwd) + profil | Phase 2 | ⬜ |
| [S8](sprint-08-classes-enseignant.md) | 8–14 juin | Classes enseignant | Phase 2 | ⬜ |
| [S9](sprint-09-tests-assignes-temps.md) | 15–21 juin | Tests assignés + modes temps | Phase 2 | ⬜ |
| [S10](sprint-10-dashboard-enseignant.md) | 22–28 juin | Dashboard enseignant (résultats) | Phase 2 | ⬜ |
| [S11](sprint-11-oauth-otp-admin-ped.md) | 29 juin – 5 juil | OAuth + OTP + Admin Pédagogique | Phase 3 | ⬜ |
| [S12](sprint-12-directeur-parent.md) | 6–12 juil | Directeur + Parent (vues analytiques) | Phase 3 | ⬜ |

---

## Jalons majeurs

| Jalon | Sprint de sortie | Critère |
|---|---|---|
| **Pipeline pédagogique opérationnel** | S0 ✅ | ≥ 15 questions générées sur un chapitre |
| **MVP Phase 1 livrable** | S6 | Élève anonyme peut faire un quiz complet via magic link |
| **Phase 2 livrable** | S10 | Enseignant peut créer classe + test assigné + voir résultats |
| **Phase 3 livrable (v3 complète)** | S12 | Tous les acteurs de la spec ont leur interface |

---

## Conventions

- Un sprint = 1 fichier `.md` au format **Sprint Goal / Prérequis / Capacity / Backlog priorisé (P0/P1/P2) / Risks / DoD / Key Dates**
- Priorités : `P0` = indispensable, `P1` = important, `P2` = stretch (reportable)
- Toutes les tâches déjà faites (S0) sont marquées `[x]` dans le backlog
- Dates relatives à 2026-04-19 (mise à jour en début de chaque sprint)

---

## Skill recommandée pour étoffer chaque sprint

`product-management:sprint-planning` — génère automatiquement backlog priorisé + capacité + risques + DoD à partir d'un objectif de sprint. Utile avant le démarrage de chaque sprint pour ajuster à la capacité réelle du moment.
