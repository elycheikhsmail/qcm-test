# Sprint 0 — Pipeline pédagogique (PDF → JSON)

**Dates :** 10 avril — 16 avril 2026
**Durée :** 1 semaine
**Statut :** ✅ **TERMINÉ**
**Sprint Goal :** Avoir une chaîne reproductible qui transforme un chapitre de manuel PDF mauritanien en un fichier JSON de questions validable, avec un format documenté et un prompt fiable.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

| Priorité | Tâche | Estimation | Statut |
|----------|-------|------------|--------|
| P0 | Choisir la matière pilote (Mathématiques — cycle Fondamental + Secondaire) | 0.5 j | [x] |
| P0 | Rédiger la spec v3 (`spec/spec_projet_v3.md`) | 1 j | [x] |
| P0 | Dessiner les diagrammes UML (acteurs + cas d'utilisation) en PlantUML | 1 j | [x] |
| P0 | Écrire le script `scripts/export-diagrams.ts` (`.puml` → `.svg` via plantuml.com) | 0.5 j | [x] |
| P0 | Définir le format JSON intermédiaire (`spec/format_questions_schema.ts` + exemple) | 0.5 j | [x] |
| P0 | Rédiger le prompt de génération (`prompts/generate_questions.md`) | 0.5 j | [x] |
| P0 | Écrire le script `scripts/generate_questions.ts` (Bun + Anthropic SDK) | 1 j | [x] |
| P0 | Écrire le script `scripts/validate_questions.ts` (validation de structure) | 0.5 j | [x] |
| P1 | Collecter les PDFs des manuels mauritaniens (Fondamental 1AF–6AF, Secondaire 1AS–7AS) | 1 j | [x] |
| P1 | Générer un premier lot de questions sur 1 chapitre pilote (`output/1AS_ch03_*.json`) | 0.5 j | [x] |

**Charge prévue :** 7 j
**Réalisée :** conforme — livrables présents dans le repo.

---

## Livrables (vérifiables dans le repo)

- [x] `spec/spec_projet_v3.md` (440 lignes, 7 acteurs, 13 tables)
- [x] `spec/uml/*.puml` + `spec/diagrams/*.svg` (7 diagrammes UC)
- [x] `spec/format_questions_schema.ts` + `spec/format_questions_intermediaire.json`
- [x] `prompts/generate_questions.md`
- [x] `scripts/generate_questions.ts`, `scripts/validate_questions.ts`, `scripts/export-diagrams.ts`
- [x] `src_pedagogique/maths/` — PDFs manuels collectés
- [x] `output/1AS_ch03_nombres_decimaux_et_fractions_2026-04-10.json` — 1 lot généré

---

## Décisions tranchées

- ✅ **Matière pilote** : Mathématiques (couverture Fondamental + Secondaire)
- ✅ **Langue** : français (arabe prévu via champ `langue` dans le schéma)
- ✅ **Format** : JSON intermédiaire v1.1 avec `validation.status` (pending/approved/rejected) et `validation.confidence` (high/medium/low)
- ✅ **Runtime** : Bun.js pour tous les scripts TS

---

## Décisions reportées à S1+

- [ ] ORM ou SQL pur pour PostgreSQL (recommandation : SQL pur via `postgres.js`)
- [ ] Format et durée du magic link (recommandation : UUID v4, 24h)
- [ ] Nombre min de questions/chapitre avant d'autoriser un test (recommandation : 10)
- [ ] Wilaya(s) ciblée(s) pour le pilote

---

## Definition of Done — ✅ Atteinte

- [x] Un `.puml` modifié peut être régénéré via `bun run export-diagrams`
- [x] Un PDF + un prompt rempli produit un JSON conforme au schéma
- [x] Le validateur refuse un JSON mal formé
- [x] ≥ 1 chapitre complet généré et archivé dans `output/`

---

## Retex pour les sprints suivants

- Le prompt `generate_questions.md` fonctionne bien en mode confidentiel `high` ; pour `low` (calculs), prévoir une revue humaine systématique en S6.
- La collection de manuels dans `src_pedagogique/maths/` couvre Fondamental + Secondaire — la banque peut être étendue sans nouveau sprint pédagogique.
- Le schéma JSON v1.1 contient déjà les champs `enrichissement` et `validation` — le script d'import S3 doit en tenir compte.
