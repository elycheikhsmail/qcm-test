# Sprint 12 — Directeur + Parent (vues analytiques)

**Dates :** 6 juillet — 12 juillet 2026
**Durée :** 1 semaine
**Sprint Goal :** Livrer les deux derniers acteurs de la spec v3 : le Directeur (stats multi-classes, profil élève, évolution) et le Parent (vue lecture seule simplifiée du compte de son enfant).

**Prérequis Sprint 11 :** Admin péda assigne les classes aux directeurs.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

### Volet 1 — Directeur

| Priorité | Tâche | Estimation | Spec ID |
|----------|-------|------------|---------|
| P0 | Rôle `directeur` + layout `/directeur` + middleware | 0.25 j | — |
| P0 | Route `GET /api/directeur/classes` — classes assignées via `directeur_classes` | 0.25 j | DIR-01 |
| P0 | Page `/directeur/classes` — liste des classes | 0.5 j | DIR-01 |
| P0 | Page `/directeur/classes/:id` — stats globales par test (moyenne, min, max, distribution) | 0.75 j | DIR-02 |
| P0 | Page `/directeur/tests/:id` — détail test question par question pour la classe | 0.5 j | DIR-03 |
| P0 | Page `/directeur/eleves/:id` — profil élève : tous ses tests + notes | 0.75 j | DIR-04 |
| P0 | Page `/directeur/eleves/:id/evolution` — graphique progression par matière/chapitre | 1 j | DIR-05, DIR-06 |
| P1 | Filtres (période, matière) sur les graphiques | 0.5 j | — |

### Volet 2 — Parent

| Priorité | Tâche | Estimation | Spec ID |
|----------|-------|------------|---------|
| P0 | Décision auth parent : même compte que l'enfant (spec PAR-01) ou compte dédié ? | 0.25 j | PAR-01 |
| P0 | Si même compte : toggle "Vue Parent" dans `/dashboard` élève qui bascule vers `/parent` | 0.5 j | — |
| P0 | Page `/parent` — résumé enfant : moyenne globale, liste 5 derniers tests | 0.5 j | PAR-02, PAR-04 |
| P0 | Indicateurs simples vert/orange/rouge par matière (basés sur moyenne) | 0.5 j | PAR-03 |
| P0 | **Lecture seule** : aucun bouton "Passer un test", aucune action | 0.25 j | PAR |

**Charge prévue :** 6.5 j — **Capacité :** 5 j — P1 filtres directeur reportables si manque de temps.

---

## Séparation Parent vs Élève (spec v3)

> « Le parent a une vue en lecture seule dédiée, différente de la vue élève. Il ne peut pas passer de tests ni modifier quoi que ce soit. »

**Option A (recommandée)** : le parent utilise les identifiants de l'enfant, et la vue `/parent` est une re-skin du dashboard avec :
- Aucun bouton d'action
- Pas d'accès à `/quiz/*`
- Un bouton "Mode élève" pour revenir

**Option B** : compte parent dédié lié à `user.parent_of = eleve_id`. Plus propre mais ajoute une table et un flux d'invitation. **Reporté** si pas de temps ce sprint.

---

## Graphique évolution (DIR-05)

```sql
SELECT DATE_TRUNC('week', s.submitted_at) AS semaine,
       ch.title AS chapitre,
       AVG(s.score::float) AS moyenne
FROM sessions s
JOIN test_questions tq ON tq.test_id = s.test_id
JOIN questions q ON q.id = tq.question_id
JOIN chapters ch ON ch.id = q.chapter_id
WHERE s.eleve_id = $1
GROUP BY semaine, chapitre
ORDER BY semaine;
```

Composant `<LineChart>` — une courbe par matière.

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Directeur voit une classe qui ne lui est pas assignée | Fuite de données | Toutes les requêtes filtrent par `directeur_classes.directeur_id = current_user.id` |
| Parent via compte enfant = peut accidentellement passer un test | Données polluées | Double check : si `session_role = 'parent'` dans cookie → bloquer POST `/quiz/*` |
| Graphique évolution lent (beaucoup de sessions) | UI gèle | Limiter à 12 dernières semaines par défaut |
| Vues analytiques sans vrais données (peu d'élèves/tests en S12) | Démo peu parlante | Seeder un dataset de démo : 2 classes × 20 élèves × 5 tests fictifs |

---

## Definition of Done — v3 complète livrée

- [ ] Un directeur voit ses classes, leurs stats, les profils élèves, les évolutions
- [ ] Un directeur ne voit pas les classes non assignées
- [ ] Un parent (via compte enfant) voit le résumé en lecture seule
- [ ] Un parent ne peut pas lancer un test ni modifier le profil
- [ ] Les 7 acteurs de la spec v3 ont tous leur interface :
  - [x] Admin Technique (scripts CLI — S0)
  - [x] Admin Pédagogique (S11)
  - [x] Enseignant (S8, S9, S10)
  - [x] Élève (S5, S7)
  - [x] Directeur (S12)
  - [x] Parent (S12)
  - [x] Claude Code (S0)

---

## Key Dates

| Date | Événement |
|------|-----------|
| 6 juillet | Démarrage — layout directeur en J1 |
| 9 juillet | Mid-sprint : vue classe + élève OK |
| 12 juillet | **Démo v3 complète — tous les acteurs couverts** + retro globale |

---

## Post-sprint 12 — Et après ?

Hors scope spec v3 (à prévoir v4) :
- Notifications (email/SMS) aux élèves quand un test est assigné
- Mode hors-ligne (PWA)
- Application mobile native
- Multi-tenant (plusieurs établissements indépendants)
- Déploiement production (VPS, domain, HTTPS)
