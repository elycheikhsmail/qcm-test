# Sprint 9 — Tests assignés + modes temps

**Dates :** 15 juin — 21 juin 2026
**Durée :** 1 semaine
**Sprint Goal :** Un enseignant peut créer un test (matière/niveau/chapitre/difficulté/nb questions), choisir un mode temps (libre/chrono/deadline), et l'assigner à une classe ou à un élève. L'élève voit le test dans son dashboard et peut le passer.

**Prérequis Sprint 8 :** classes + élèves en place.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

| Priorité | Tâche | Estimation | Spec ID |
|----------|-------|------------|---------|
| P0 | Route `POST /api/tests` — enseignant crée un test (+ snapshot questions dans `test_questions`) | 1 j | ENS-05 |
| P0 | Route `GET /api/tests` (mes tests) + `GET /api/tests/:id` | 0.5 j | — |
| P0 | Route `POST /api/tests/:id/assignments` — assigne à `classe` ou `eleve` | 0.5 j | ENS-07, ENS-08 |
| P0 | Route `GET /api/tests/assigned` (côté élève — tests assignés non encore passés) | 0.5 j | ELV-06 |
| P0 | Gestion mode temps côté serveur : | 1 j | ENS-06 |
|    | — `libre` : pas de contrainte | | |
|    | — `chrono` : `started_at + duration_minutes < now()` sinon auto-submit | | |
|    | — `deadline` : `now() > deadline_at` → refus démarrage, `submitted_at < deadline_at` obligatoire | | |
| P0 | Page enseignant `/enseignant/tests/new` — formulaire création test | 1 j | ENS-05, ENS-06 |
| P0 | Page enseignant `/enseignant/tests/:id` — détails + bouton "Assigner à classe/élève" | 0.5 j | ENS-07, ENS-08 |
| P0 | Page élève `/dashboard` — section "Tests assignés" peuplée | 0.25 j | ELV-06 |
| P0 | Page élève `/quiz/test/:test_id` — passation d'un test assigné (réutilise `<QuestionCard>` S5) | 0.75 j | ELV-07 |
| P0 | Composant `<Countdown>` pour mode chrono (affichage + auto-submit à 0) | 0.5 j | ENS-06 |
| P1 | Refus de commencer un test si `deadline_at < now()` — message clair | 0.25 j | — |
| P1 | Empêcher un élève de recommencer un test déjà soumis (1 tentative sauf config) | 0.5 j | — |

**Charge prévue :** 7 j — **Capacité :** 5 j — P1 minimum, repousser "multi-tentatives" à plus tard.

---

## Règles de validation temps (à coder dans `/api/quiz/sessions`)

```ts
function canStartTest(test, now):
  if test.time_mode === 'deadline' && now > test.deadline_at: reject
  // autres modes: OK

function canSubmit(test, session, now):
  if test.time_mode === 'chrono':
    if now > session.started_at + test.duration_minutes*60: force_submit()
  if test.time_mode === 'deadline':
    if now > test.deadline_at: force_submit()
  // libre: toujours OK
```

---

## Snapshot des questions

À la création du test, figer la liste de questions dans `test_questions(test_id, question_id, order)`.
→ Ajouter/supprimer des questions en DB après coup n'affecte **pas** les tests déjà créés.

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Horloge client ≠ horloge serveur → auto-submit erronée | Frustration élève | `<Countdown>` affiche le temps, mais **la validation finale est serveur-side** |
| Tests assignés à une classe + à un élève individuel → doublon dans `/assigned` | UX dégradée | Requête `DISTINCT` + eleve visible une seule fois par test |
| Un enseignant assigne un test dont les questions ne couvrent pas le niveau de la classe | Contenu inadapté | Warning soft (pas de blocage) — l'enseignant décide |
| Session chrono interrompue (fermeture onglet) puis reprise | Durée continue de tourner ? | **OUI** — `started_at` fixe, donc la deadline effective est absolue |

---

## Definition of Done

- [ ] Un enseignant peut créer un test via UI en 3 écrans max
- [ ] Les 3 modes temps fonctionnent et sont validés côté serveur
- [ ] Un test assigné à une classe apparaît chez tous les élèves actifs de cette classe
- [ ] Un test assigné à un élève individuel apparaît uniquement chez lui
- [ ] `<Countdown>` s'affiche en mode chrono et provoque la soumission à 0
- [ ] Un test après deadline refuse de démarrer
- [ ] Snapshot : supprimer une question en DB ne casse pas les tests existants

---

## Key Dates

| Date | Événement |
|------|-----------|
| 15 juin | Démarrage — création test + snapshot en J1-J2 |
| 18 juin | Mid-sprint : modes temps testés |
| 21 juin | Sprint review — enseignant → assignation → élève passe le test |
