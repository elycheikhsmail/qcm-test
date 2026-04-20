# Sprint 4 — Tests, Qualité & Finalisation MVP

**Dates :** 8 mai — 14 mai 2026  
**Durée :** 1 semaine  
**Sprint Goal :** MVP prêt à être utilisé par de vrais élèves en local : pipeline PDF → questions validé, parcours élève sans bug, qualité des questions acceptable.

**Prérequis Sprint 3 :**
- Parcours élève complet fonctionnel dans le navigateur
- ≥ 30 questions en base

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
| P0 | Test du pipeline PDF → questions sur ≥ 3 chapitres différents | 1 j | Script Sprint 0 |
| P0 | Révision manuelle de la qualité des questions générées (pertinence, orthographe, difficulté) | 1 j | Questions générées |
| P0 | Ajustement du prompt Claude Code si qualité insuffisante + re-génération | 0.5 j | Révision faite |
| P0 | Test parcours élève complet de bout en bout (≥ 3 scénarios utilisateur) | 1 j | Sprint 3 terminé |
| P0 | Corriger les bugs critiques découverts lors des tests | 1 j | Tests faits |
| P1 | Enrichir la banque : atteindre ≥ 100 questions, ≥ 5 chapitres, 3 types | 1 j | Import fonctionnel |
| P1 | Styling minimal suffisant pour une utilisation réelle (lisibilité, contraste, mobile) | 0.5 j | Sprint 3 pages |
| P1 | Documenter le mode d'emploi (lancer le projet, générer un magic link) | 0.5 j | — |
| P2 | Rate limiting sur `POST /api/magic-links` (reporté de Sprint 2) | 0.5 j | — |
| P2 | Réponse bilingue arabe/français sur la page résultats | 1 j | Décision langue |

**Charge prévue :** 7 j  
**Capacité :** 5 j  
**Stretch :** P2 entièrement optionnel. P1 documentation à minima.

---

## Scénarios de test à couvrir

| Scénario | Résultat attendu |
|----------|-----------------|
| Magic link valide → accès quiz | Parcours fluide jusqu'aux résultats |
| Magic link expiré | Message d'erreur clair, pas de crash |
| Magic link déjà utilisé | Bloqué avec message explicite |
| Répondre à toutes les questions d'un QCM | Score calculé correctement |
| Répondre à un Vrai/Faux | Correction affichée |
| Texte à trous : réponse exacte | Marqué correct |
| Texte à trous : réponse avec casse différente | Décider : strict ou insensible à la casse ? |
| Recharger la page en cours de quiz | Session récupérée (localStorage) ou message d'erreur clair |

---

## Critères de qualité des questions générées

Une question est **acceptable** si :
- [ ] Elle porte sur le contenu du chapitre (pas hors-sujet)
- [ ] Elle est grammaticalement correcte (français ou arabe)
- [ ] La bonne réponse est réellement correcte
- [ ] Les distracteurs QCM sont plausibles (pas trivialement faux)
- [ ] La difficulté annotée est cohérente (1=facile, 3=difficile)

**Seuil :** ≥ 80% des questions générées passent la révision sans modification.  
Si < 80% : réviser le prompt et re-générer avant de clore le sprint.

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Qualité des questions < seuil 80% | Retarde la mise en production | Budget 1j pour itérer sur le prompt |
| Bugs bloquants découverts en test | MVP non livrable | Prioriser les bugs P0 avant l'enrichissement de la banque |
| Texte à trous : comparaison de réponse trop stricte | Mauvaise expérience élève | Normaliser (lowercase + trim) côté API |

---

## Definition of Done — MVP complet

- [ ] Pipeline PDF → JSON → PostgreSQL fonctionne sur ≥ 3 chapitres
- [ ] ≥ 100 questions en base, ≥ 5 chapitres, 3 types de questions
- [ ] Parcours élève sans bug bloquant sur les 3 scénarios principaux
- [ ] Magic link invalide/expiré géré proprement (pas de crash serveur)
- [ ] Mode d'emploi documenté (README ou `docs/`)
- [ ] `bun dev` lance le projet et un élève peut faire un quiz complet en moins de 2 minutes

---

## Key Dates

| Date | Événement |
|------|-----------|
| 8 mai | Démarrage — tests pipeline en J1 |
| 11 mai | Mid-sprint : bugs corrigés, banque enrichie |
| 14 mai | MVP review finale — démo parcours élève complet |
| 14 mai | Retro + décisions pour la suite (v2 : interface admin, mode supervisé, déploiement en ligne) |
