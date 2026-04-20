# Sprint 4 — API magic-link + quiz anonyme

**Dates :** 11 mai — 17 mai 2026
**Durée :** 1 semaine
**Sprint Goal :** Avoir une API Next.js qui couvre tout le parcours **élève anonyme** : validation magic link → liste niveaux/chapitres → récupération questions → soumission réponses → résultats.

**Prérequis Sprint 3 :** ≥ 30 questions en base, schéma complet.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

| Priorité | Route | Méthode | Description | Estimation |
|----|----|----|----|----|
| P0 | `/api/magic-links` | POST | Génère un magic link (token UUID, level_id optionnel, expires_at, max_uses). Admin only pour l'instant (header simple) | 0.5 j |
| P0 | `/api/magic-links/[token]` | GET | Valide un token (exists + non expiré + `use_count < max_uses`) → crée une `session` anonyme et incrémente `use_count` | 0.5 j |
| P0 | `/api/quiz/subjects` | GET | Liste les matières actives | 0.25 j |
| P0 | `/api/quiz/levels` | GET | Liste les niveaux | 0.25 j |
| P0 | `/api/quiz/chapters` | GET | `?subject_id=&level_id=` → chapitres filtrés | 0.25 j |
| P0 | `/api/quiz/questions` | GET | `?chapter_id=&difficulty=&limit=10` → N questions aléatoires (`ORDER BY random()`), **sans `correct_answer`** | 1 j |
| P0 | `/api/quiz/sessions` | POST | Démarre une session de test autonome (body: `test_config`) — retourne session_id + question_ids sélectionnés (snapshot) | 0.75 j |
| P0 | `/api/quiz/answers` | POST | Soumet une réponse (body: session_id, question_id, given_answer) → calcule is_correct server-side, enregistre | 0.75 j |
| P0 | `/api/quiz/sessions/[id]/submit` | POST | Finalise la session : calcule score, set `submitted_at` | 0.25 j |
| P0 | `/api/quiz/sessions/[id]/results` | GET | Score + détail (question, réponse donnée, bonne réponse, is_correct) | 0.5 j |
| P1 | Middleware `withSession(req)` — vérifie que le session_id appartient au magic_link actif | 0.5 j |
| P1 | Validation des bodies avec Zod ou équivalent (détecter 400 avant SQL) | 0.5 j |
| P2 | Rate limit sur `POST /api/magic-links` (IP-based, in-memory) | 0.5 j |

**Charge prévue :** 6.5 j — **Capacité :** 5 j — reporter P2 à S6, P1 Zod optionnel.

---

## Points de sécurité NON négociables

- ❌ **Jamais** de `correct_answer` dans le payload de `/api/quiz/questions`
- ✅ La correction est **toujours** calculée server-side dans `/api/quiz/answers`
- ✅ Un `session_id` ne peut soumettre que pour les `question_id` inclus dans son snapshot initial
- ✅ Un magic link expiré ou épuisé renvoie 401, pas 500
- ✅ `is_anonymous = true` pour toutes les sessions créées via magic link sans user_id

---

## Contrats d'API (résumé)

```
POST   /api/magic-links                    { level_id?, max_uses?, expires_in_hours? }
                                           → { token, url, expires_at }

GET    /api/magic-links/:token             → { valid, session_started?, level_id? }

GET    /api/quiz/subjects                  → Subject[]
GET    /api/quiz/levels                    → Level[]
GET    /api/quiz/chapters?subject_id&level_id → Chapter[]
GET    /api/quiz/questions?chapter_id&difficulty&limit → Question[] (sans correct_answer)

POST   /api/quiz/sessions                  { config }  → { session_id, question_ids[] }
POST   /api/quiz/answers                   { session_id, question_id, given_answer }
                                           → { is_correct }
POST   /api/quiz/sessions/:id/submit       → { score, total }
GET    /api/quiz/sessions/:id/results      → { score, total, answers: AnswerDetail[] }
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Leak de `correct_answer` dans `/questions` | Triche triviale, MVP compromis | Test dédié en fin de sprint : `curl` et vérifier absence du champ |
| Race condition sur `use_count` d'un magic link | Double-utilisation non détectée | `UPDATE ... SET use_count = use_count + 1 WHERE use_count < max_uses RETURNING *` (atomique) |
| `ORDER BY random()` lent sur grosse table | API lente | OK pour MVP (quelques milliers de questions max), noter dette pour plus tard |
| Correction serveur pour `matching` compliquée | Bug score | Différer `matching` à S6+, ne supporter que qcm/true_false/fill_blank ce sprint |

---

## Definition of Done

- [ ] Toutes les routes P0 répondent avec le bon status HTTP (200/400/401/404)
- [ ] Flux complet via `curl` : POST magic-link → GET token → POST session → GET questions → POST answers × N → POST submit → GET results
- [ ] `correct_answer` absent de toutes les réponses publiques (vérifié par test)
- [ ] Un magic link expiré ou `use_count >= max_uses` renvoie 401
- [ ] Le score calculé par le serveur correspond au nombre de `is_correct = true`
- [ ] Collection Postman ou fichier `.http` committée dans `reflexion/api-tests.http`

---

## Key Dates

| Date | Événement |
|------|-----------|
| 11 mai | Démarrage — magic-link + session en J1-J2 |
| 14 mai | Mid-sprint : `/quiz/questions` + `/answers` OK |
| 17 mai | Sprint review — flux end-to-end via curl |
