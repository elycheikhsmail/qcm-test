# Sprint 6 — MVP hardening (tests, qualité, 100+ questions)

**Dates :** 25 mai — 31 mai 2026
**Durée :** 1 semaine
**Sprint Goal :** MVP Phase 1 livrable à de vrais élèves : banque enrichie (≥ 100 questions sur ≥ 5 chapitres), parcours sans bug bloquant, mode d'emploi écrit, rate limiting posé.

**Prérequis Sprint 5 :** Parcours frontend complet.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

| Priorité | Tâche | Estimation |
|----------|-------|------------|
| P0 | Générer ≥ 4 nouveaux chapitres via pipeline S0 (niveaux variés 3AF, 6AF, 4AS, 6AS) | 1 j |
| P0 | Revue manuelle qualité — ≥ 80% des questions passent sans correction (critères spec v3) | 1 j |
| P0 | Ajuster le prompt `generate_questions.md` si < 80% + regénérer | 0.5 j |
| P0 | Importer le tout → ≥ 100 questions en DB sur ≥ 5 chapitres | 0.25 j |
| P0 | Tests end-to-end manuels sur 3 scénarios (cf. section scénarios) | 1 j |
| P0 | Corriger les bugs P0 découverts | 1 j |
| P1 | Rate limiting sur `POST /api/magic-links` (reporté S4) | 0.5 j |
| P1 | Normaliser les réponses `fill_blank` (trim + lowercase accents) server-side | 0.5 j |
| P1 | Écrire `README.md` utilisateur : démarrage, génération magic link, passation test | 0.5 j |
| P1 | Améliorer le styling minimal (lisibilité, contraste, mobile) | 0.5 j |
| P2 | Script `scripts/generate-magic-link.ts` (CLI wrapper autour de `/api/magic-links`) | 0.25 j |

**Charge prévue :** 7 j — **Capacité :** 5 j — P2 coupé, styling P1 light.

---

## Scénarios de test obligatoires

| # | Scénario | Attendu |
|---|---|---|
| 1 | Magic link valide → parcours complet QCM uniquement | Score correct, toutes corrections visibles |
| 2 | Magic link expiré | Message clair côté UI, pas de 500 |
| 3 | Magic link épuisé (`use_count >= max_uses`) | Même comportement que expiré |
| 4 | Mix qcm + true_false + fill_blank | Chaque type se rend, accepte une réponse, se corrige |
| 5 | `fill_blank` avec casse/accents différents ("ÉCO" vs "éco") | Marqué correct (normalisation) |
| 6 | Rechargement en cours de quiz | Session restaurée depuis localStorage OU message d'erreur clair |
| 7 | Finir un test puis retourner sur `/quiz/:session_id` déjà soumise | Redirection vers `/results` |
| 8 | Lancer 10 requêtes `POST /api/magic-links` en 1s | Rate limit déclenché après N |
| 9 | Mobile 375px — parcours complet | Lisible, pas de débordement |
| 10 | Lien tentant de soumettre un `question_id` hors session | 400 ou 403 |

---

## Critères qualité des questions (rappel spec v3)

Une question est **acceptable** si :
- [ ] Porte sur le contenu du chapitre (pas hors-sujet)
- [ ] Grammaticalement correcte
- [ ] La bonne réponse est réellement correcte
- [ ] Les distracteurs QCM sont plausibles
- [ ] La difficulté annotée est cohérente (facile/moyen/difficile)

**Seuil de blocage** : < 80% → réviser prompt et regénérer avant clôture.

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Qualité pipeline < 80% | MVP non livrable | Budget 1j pour itérer le prompt |
| Bug P0 découvert en fin de sprint | Retard MVP | Réserver J5 exclusivement aux bugs |
| `fill_blank` normalisation trop agressive ("Paris" vs "paris" OK, mais "Pariis" aussi ?) | Mauvaise expérience | Règles documentées dans le code : trim + lowercase + NFD + strip accents |

---

## Definition of Done — MVP Phase 1 complet

- [ ] Pipeline PDF → JSON → PostgreSQL validé sur ≥ 5 chapitres distincts
- [ ] ≥ 100 questions en base, ≥ 5 chapitres, ≥ 3 types
- [ ] Les 10 scénarios de test passent sans bug P0
- [ ] Magic link expiré / épuisé géré sans crash
- [ ] `README.md` racine — un nouveau dev peut lancer le projet en < 15 minutes
- [ ] Rate limit actif sur `POST /api/magic-links`
- [ ] Démo enregistrée : un élève fait un quiz complet en < 2 minutes

---

## Key Dates

| Date | Événement |
|------|-----------|
| 25 mai | Démarrage — génération nouveaux chapitres |
| 28 mai | Mid-sprint : import + tests lancés |
| 31 mai | **Démo MVP Phase 1 livrée** — retro + go/no-go Phase 2 |
