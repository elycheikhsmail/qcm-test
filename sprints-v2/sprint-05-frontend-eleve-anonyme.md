# Sprint 5 — Frontend parcours élève anonyme

**Dates :** 18 mai — 24 mai 2026
**Durée :** 1 semaine
**Sprint Goal :** Un élève muni d'un magic link peut, via son navigateur, aller de l'entrée du token jusqu'aux résultats détaillés, sans bug bloquant sur mobile (375px) et desktop.

**Prérequis Sprint 4 :** API anonyme complète et testée via curl.

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
| P0 | Page `/` — champ token + bouton "Commencer" (ou récupération via `/?token=xxx` dans l'URL) | 0.5 j | API token OK |
| P0 | Page `/quiz/select` — sélection matière → niveau → chapitre → difficulté → nb questions | 1 j | API subjects/levels/chapters |
| P0 | Page `/quiz/[session_id]` — affichage question par question, navigation Précédent/Suivant, barre de progression | 1.5 j | API questions + answers |
| P0 | Composant `<QuestionCard>` avec variantes `qcm`, `true_false`, `fill_blank` | 0.75 j | — |
| P0 | Page `/quiz/[session_id]/results` — score + liste corrigée (question, ta réponse, bonne réponse, ✓/✗) | 1 j | API results |
| P1 | Feedback immédiat optionnel après chaque réponse (config via `test_config.feedback`) | 0.5 j | — |
| P1 | Persistance de la session en cours dans `localStorage` (session_id + index question) | 0.5 j | — |
| P1 | Styling minimal Tailwind (mobile-first, contraste AA) | 0.5 j | Tailwind configuré S1 |
| P2 | Animation transition entre questions | 0.25 j | — |
| P2 | Support dark mode | 0.25 j | — |

**Charge prévue :** 6.75 j — **Capacité :** 5 j — couper P2 entièrement, P1 styling minimum viable.

---

## Flux utilisateur

```
/?token=UUID              (token auto-rempli si URL contient ?token=)
   ↓ token valide → session créée
/quiz/select              (config test autonome)
   ↓ "Démarrer"
/quiz/:session_id         (Q1 → Q2 → ... → Qn)
   ↓ "Terminer"
/quiz/:session_id/results (score + corrections)
```

---

## Composants clés

| Composant | Responsabilité |
|---|---|
| `<TokenInput>` | Saisie + validation via `/api/magic-links/:token` |
| `<TestConfigForm>` | Matière / niveau / chapitre / difficulté / nb questions |
| `<QuestionCard>` | Dispatch par `type` (qcm/true_false/fill_blank) |
| `<ProgressBar>` | `Question X / N` |
| `<AnswerFeedback>` | ✓/✗ + explication si `enrichissement.explication` dispo |
| `<ScoreCard>` | Score global + bouton "Revoir mes réponses" |
| `<AnswersList>` | Liste détaillée post-quiz |

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rechargement en cours de quiz → session perdue | Élève frustré | `localStorage.setItem('session', {id, index})` à chaque réponse, restore on mount |
| `<QuestionCard>` monolithique devient vite illisible | Dette technique | Un sous-composant par type de question dès le départ |
| Styling arabe RTL à faire après coup | Travail double en Phase 2 | Poser `dir="ltr"` explicite sur les layouts — RTL sera géré en S11 |
| Mobile < 375px (écrans bas de gamme) | Inaccessible cible Mauritanie | Tester sur viewport 320px dès J4 |

---

## Definition of Done

- [ ] Un élève avec un magic link valide peut faire un quiz complet en navigateur sans toucher au terminal
- [ ] Les 3 types (qcm, true_false, fill_blank) s'affichent et acceptent une réponse
- [ ] Progression fluide, pas de rechargement entre questions (SPA-like via Next.js)
- [ ] Page résultats affiche score + corrections pour chaque question
- [ ] Parcours testé sur viewport 375px (DevTools mobile)
- [ ] Magic link invalide/expiré → message d'erreur clair, pas de crash

---

## Key Dates

| Date | Événement |
|------|-----------|
| 18 mai | Démarrage — pages `/` et `/quiz/select` en J1-J2 |
| 21 mai | Mid-sprint : `<QuestionCard>` OK pour les 3 types |
| 24 mai | Sprint review — démo parcours complet en navigateur |
