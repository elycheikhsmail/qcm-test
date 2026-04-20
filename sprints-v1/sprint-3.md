# Sprint 3 — Frontend Next.js

**Dates :** 1 mai — 7 mai 2026  
**Durée :** 1 semaine  
**Sprint Goal :** Avoir un parcours élève complet et utilisable dans le navigateur : entrée magic link → sélection → quiz → résultats.

**Prérequis Sprint 2 :**
- Toutes les routes API fonctionnelles
- Flux end-to-end validé via curl/Postman

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 4 j | 1er mai = fête du travail (jour férié possible) |
| **Total** | **4 j** | ~20 pts |

---

## Sprint Backlog

| Priorité | Tâche | Estimation | Dépendances |
|----------|-------|------------|-------------|
| P0 | Page `/` — entrée magic link (champ token + bouton valider) | 0.5 j | Route validation token |
| P0 | Page `/quiz/select` — sélection niveau → chapitre | 1 j | API levels + chapters |
| P0 | Page `/quiz/[chapter_id]` — affichage question par question (QCM, Vrai/Faux, Texte à trous) | 1.5 j | API questions + answers |
| P0 | Page `/quiz/results/[session_id]` — score + corrections (réponse donnée vs bonne réponse) | 1 j | API results |
| P1 | Gestion d'état côté client (session_id, progression, réponses) | 0.5 j | Pages quiz |
| P1 | Feedback immédiat après chaque réponse (correct/incorrect) | 0.5 j | POST answers |
| P2 | Styling minimal (Tailwind CSS ou CSS Modules) — lisible, pas joli | 0.5 j | Pages créées |
| P2 | Support RTL basique si interface bilingue arabe/français | 1 j | Décision langue Sprint 0 |

**Charge prévue :** 6.5 j  
**Capacité :** 4 j  
**Note :** Couper P2 entièrement. Se concentrer sur P0 + P1. Le style peut attendre Sprint 4.

---

## Flux utilisateur cible

```
/ (entrée token)
   ↓ token valide
/quiz/select (choix niveau si non fixé par le magic link)
   ↓ niveau sélectionné
/quiz/select (choix chapitre)
   ↓ chapitre sélectionné
/quiz/[chapter_id] (Q1 → Q2 → ... → Qn)
   ↓ toutes réponses soumises
/quiz/results/[session_id] (score + corrections)
```

---

## Composants clés à créer

| Composant | Description |
|-----------|-------------|
| `<QuestionCard>` | Affiche une question selon son type (QCM / Vrai-Faux / Texte à trous) |
| `<AnswerFeedback>` | Affiche correct/incorrect après soumission |
| `<ProgressBar>` | Q3 / 10 — avancement dans le quiz |
| `<ScoreCard>` | Résultat final avec liste des corrections |

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Gestion d'état complexe (session perdue si rechargement) | UX dégradée | Stocker `session_id` dans localStorage |
| Rendu du texte arabe (RTL, polices) | Bloque le support bilingue | Décider en Sprint 0 — si bilingue, prévoir +1j ici |
| Composant quiz trop monolithique | Difficile à maintenir | Séparer `<QuestionCard>` par type de question |

---

## Definition of Done

- [ ] Un élève peut entrer un magic link valide et accéder au quiz
- [ ] Les 3 types de questions s'affichent et acceptent une réponse
- [ ] La progression question par question fonctionne sans rechargement de page
- [ ] La page résultats affiche le score et la correction de chaque question
- [ ] Le parcours complet fonctionne sur mobile (viewport 375px)

---

## Key Dates

| Date | Événement |
|------|-----------|
| 1 mai | Démarrage (ou 2 mai si férié) |
| 4 mai | Mid-sprint : pages accueil + sélection OK |
| 7 mai | Sprint review + parcours complet démo |
