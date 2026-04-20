# Sprint 2 — Backend Next.js (API Routes)

**Dates :** 24 avril — 30 avril 2026  
**Durée :** 1 semaine  
**Sprint Goal :** Avoir une API fonctionnelle couvrant tout le parcours élève : magic link → sélection niveau/chapitre → quiz → soumission réponses → résultats.

**Prérequis Sprint 1 :**
- Base PostgreSQL opérationnelle avec ≥ 30 questions importées
- Schéma migrations/seed fonctionnel

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
| P0 | Configurer le client PostgreSQL dans Next.js (pool de connexions Bun-compatible) | 0.5 j | — |
| P0 | `POST /api/magic-links` — générer un magic link (token UUID, level_id optionnel, expires_at) | 0.5 j | DB OK |
| P0 | `GET /api/magic-links/[token]` — valider un token (exist, non expiré, non déjà utilisé) + créer session | 0.5 j | Table magic_links |
| P0 | `GET /api/quiz/levels` — lister les niveaux disponibles | 0.5 j | Seeder OK |
| P0 | `GET /api/quiz/chapters?level_id=X` — lister les chapitres d'un niveau | 0.5 j | Seeder OK |
| P0 | `GET /api/quiz/questions?chapter_id=X&limit=10` — récupérer N questions aléatoires d'un chapitre | 1 j | Questions importées |
| P0 | `POST /api/quiz/answers` — soumettre une réponse (vérifier correction, enregistrer) | 1 j | Table answers |
| P0 | `GET /api/quiz/sessions/[session_id]/results` — score + détail des réponses | 1 j | Table answers |
| P1 | Middleware de validation du magic link (protéger les routes `/api/quiz/*`) | 0.5 j | Validation token OK |
| P2 | Rate limiting basique sur `POST /api/magic-links` | 0.5 j | — |

**Charge prévue :** 6.5 j  
**Capacité :** 5 j  
**Stretch items :** P2 (rate limiting) reportable Sprint 4.

---

## Contrats d'API (résumé)

```
POST   /api/magic-links
       body: { level_id?: number }
       → { token: string, expires_at: string }

GET    /api/magic-links/[token]
       → { valid: boolean, session_id: number, level_id?: number }

GET    /api/quiz/levels
       → Level[]

GET    /api/quiz/chapters?level_id=X
       → Chapter[]

GET    /api/quiz/questions?chapter_id=X&limit=10
       → Question[] (sans correct_answer exposé)

POST   /api/quiz/answers
       body: { session_id, question_id, given_answer }
       → { is_correct: boolean }

GET    /api/quiz/sessions/[id]/results
       → { score: number, total: number, answers: AnswerDetail[] }
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Fuite de `correct_answer` dans la réponse quiz | Triche triviale | Filtrer explicitement le champ dans `GET /questions` |
| Connexion PostgreSQL instable sous Bun | API inutilisable | Tester le pool dès J1, utiliser `pg` ou `postgres.js` |
| Session non associée au magic link → résultats impossibles | Parcours cassé | Tester le flux complet en intégration avant Sprint 3 |

---

## Definition of Done

- [ ] Toutes les routes listées répondent avec le bon statut HTTP
- [ ] `correct_answer` n'est jamais exposé dans `GET /api/quiz/questions`
- [ ] Un flux complet (magic link → quiz → soumission → résultats) fonctionne via `curl` ou Postman
- [ ] Les erreurs (token invalide, session inexistante) retournent des codes HTTP appropriés (401, 404)

---

## Key Dates

| Date | Événement |
|------|-----------|
| 24 avril | Démarrage — client DB + magic link en J1 |
| 27 avril | Mid-sprint : routes quiz/questions OK |
| 30 avril | Sprint review + test flux complet end-to-end |
