# Sprint 10 — Dashboard enseignant (résultats & stats)

**Dates :** 22 juin — 28 juin 2026
**Durée :** 1 semaine
**Sprint Goal :** Un enseignant consulte les résultats de ses classes et de ses tests : vue agrégée classe (moyenne, min/max, distribution), détail par élève, et stats par question (taux de réussite).

**Prérequis Sprint 9 :** Tests assignés + passations en DB.

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
| P0 | Route `GET /api/tests/:id/results/classe` — agrégat par classe : moyenne, min, max, distribution (buckets 0-5/5-10/10-15/15-20) | 1 j | ENS-09 |
| P0 | Route `GET /api/tests/:id/results/eleve/:eleve_id` — détail réponses d'un élève | 0.5 j | ENS-10 |
| P0 | Route `GET /api/tests/:id/stats` — par question : taux de réussite, temps moyen | 0.75 j | ENS-11 |
| P0 | Page `/enseignant/tests/:id/results` — vue classe (moyenne, graphique distribution, tableau élèves avec note) | 1.5 j | ENS-09 |
| P0 | Page `/enseignant/tests/:id/results/:eleve_id` — détail élève (question, réponse, bonne réponse, temps) | 1 j | ENS-10 |
| P0 | Page `/enseignant/tests/:id/stats` — graphique taux de réussite par question | 0.75 j | ENS-11 |
| P0 | Composant `<HistogramChart>` léger (Recharts ou SVG natif — éviter lourdes deps) | 0.5 j | — |
| P1 | Export CSV des résultats d'un test | 0.5 j | — |
| P1 | Filtres : par classe, par période, par matière | 0.5 j | — |
| P2 | Tri de la table des élèves (nom, note, temps) | 0.25 j | — |

**Charge prévue :** 7.25 j — **Capacité :** 5 j — P1 et P2 reportables à un sprint bis.

---

## Requêtes SQL clés (à valider)

```sql
-- Moyenne classe sur un test
SELECT AVG(score::float) AS moyenne, MIN(score), MAX(score), COUNT(*) AS nb_eleves
FROM sessions
WHERE test_id = $1 AND submitted_at IS NOT NULL;

-- Distribution (buckets de 4 points sur 20)
SELECT FLOOR(score::float / 20 * 4) AS bucket, COUNT(*)
FROM sessions
WHERE test_id = $1
GROUP BY bucket ORDER BY bucket;

-- Taux de réussite par question (ENS-11)
SELECT q.id, q.content,
       COUNT(*) FILTER (WHERE a.is_correct) * 100.0 / COUNT(*) AS taux_reussite
FROM answers a
JOIN questions q ON a.question_id = q.id
JOIN sessions s ON a.session_id = s.id
WHERE s.test_id = $1
GROUP BY q.id;
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Requête agrégat lente sur gros volumes | Dashboard inutilisable | Index S2 déjà posés ; ajouter `(test_id, submitted_at)` si besoin |
| Score stocké comme nombre de bonnes réponses au lieu d'un score /20 | Affichage confus | Normaliser côté serveur : `score_sur_20 = correct / total * 20` |
| Choix de Recharts (React) ajoute ~200KB au bundle | Perf | Commencer en SVG natif simple — Recharts seulement si besoin |
| Élève supprimé → ses réponses orphelines | Plantage UI | FK `ON DELETE SET NULL` ou soft delete `users.is_active` |

---

## Definition of Done

- [ ] Un enseignant voit la moyenne/min/max/distribution d'un test pour une classe
- [ ] Un enseignant voit le détail des réponses de chaque élève
- [ ] Un enseignant voit le taux de réussite par question
- [ ] Un enseignant NE VOIT PAS les résultats d'une classe qui n'est pas la sienne
- [ ] Les graphiques se chargent en < 1s sur un test de 30 élèves × 20 questions
- [ ] Données cohérentes : la moyenne matche le calcul manuel sur un échantillon

---

## Key Dates

| Date | Événement |
|------|-----------|
| 22 juin | Démarrage — requêtes agrégat en J1 |
| 25 juin | Mid-sprint : vue classe OK |
| 28 juin | **Démo Phase 2 livrée** — enseignant voit tout le cycle assignation → résultats |
