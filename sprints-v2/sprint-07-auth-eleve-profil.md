# Sprint 7 — Auth élève (email + mot de passe) + profil

**Dates :** 1 juin — 7 juin 2026
**Durée :** 1 semaine
**Sprint Goal :** Un élève peut créer un compte avec email + mot de passe, se connecter, compléter son profil (nom/prénom obligatoires), et retrouver son historique de sessions dans un tableau de bord.

**Prérequis Sprint 6 :** MVP Phase 1 livré.

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
| P0 | Choisir et installer la lib d'auth : **Lucia Auth** (recommandé, compatible Bun + sessions) ou NextAuth.js | 0.5 j |
| P0 | Tables `auth_sessions` (tokens de session serveur) + extension table `users` (`password_hash`) | 0.5 j |
| P0 | Route `POST /api/auth/register` — email + password + first_name + last_name → crée user role=eleve + session cookie | 0.75 j |
| P0 | Route `POST /api/auth/login` — email + password → session cookie | 0.5 j |
| P0 | Route `POST /api/auth/logout` — invalide session | 0.25 j |
| P0 | Route `GET /api/me` — retourne user connecté (ou 401) | 0.25 j |
| P0 | Page `/signup` — formulaire inscription | 0.75 j |
| P0 | Page `/login` — formulaire connexion | 0.5 j |
| P0 | Middleware Next.js : routes `/dashboard` et `/quiz/autonome` protégées (redirect vers /login) | 0.5 j |
| P0 | Page `/dashboard` élève — sections "Tests assignés" (vide pour S7), "Historique supervisés" (vide), "Historique autonomes" (historique des sessions liées à `user_id`) | 1 j |
| P0 | Associer les sessions créées en mode authentifié à `user_id` (plus d'`is_anonymous`) | 0.25 j |
| P1 | Hash password avec **argon2id** (via `@node-rs/argon2` compatible Bun) | 0.5 j |
| P1 | Validation mot de passe (≥ 8 car, etc.) + messages d'erreur clairs | 0.25 j |
| P1 | Page `/profil` — édition nom/prénom | 0.5 j |
| P2 | Mot de passe oublié (différé sans email provider — stub seulement) | 0.25 j |

**Charge prévue :** 6.5 j — **Capacité :** 5 j — P2 coupé, P1 validation light.

---

## Modèle de session

- Session = row en DB (`auth_sessions(id, user_id, expires_at)`) + cookie httpOnly `session_id`
- Pas de JWT — session server-side simple, révocation immédiate possible
- Durée : 30 jours, sliding expiration

---

## Distinction avec magic link

| Aspect | Magic link (S4) | Auth élève (S7) |
|---|---|---|
| User ID | null | eleve_id réel |
| Sessions | `is_anonymous = true` | `is_anonymous = false` |
| Historique | Perdu après le test | Consultable via `/dashboard` |
| Cookie | Aucun | `session_id` httpOnly |

> Les deux mécanismes **cohabitent** : magic link reste utilisable pour l'accès ponctuel (spec v3 ELV-05).

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Lucia Auth incompatible Bun | Bloquant | Plan B : rouler notre propre auth (session + cookie) — ~1j de plus |
| Argon2 lent sans WASM sous Bun | Login lent | Bench en J1, fallback bcrypt si > 500ms |
| Oubli de protéger une route API → fuite données | Critique | Checklist en DoD — lister toutes les routes et leur exigence auth |
| Migration : users existants sans password | 0 impact MVP | Aucun user en DB au début S7 (MVP = anonyme) |

---

## Definition of Done

- [ ] Inscription depuis `/signup` crée un user + session + redirige vers `/dashboard`
- [ ] Connexion/déconnexion fonctionnent (cookie set/unset)
- [ ] `/dashboard` affiche l'historique des quiz autonomes de l'utilisateur connecté
- [ ] Un anonyme ne peut pas accéder à `/dashboard` (redirect `/login`)
- [ ] Nom et prénom sont obligatoires à l'inscription (spec v3 ELV-02)
- [ ] Password stocké hashé (jamais en clair en DB ni en log)
- [ ] Test : créer compte → faire un quiz autonome → se reconnecter → retrouver le quiz dans historique

---

## Key Dates

| Date | Événement |
|------|-----------|
| 1 juin | Démarrage — choix lib auth en J1 |
| 4 juin | Mid-sprint : signup/login OK |
| 7 juin | Sprint review — démo inscription → quiz → historique |
