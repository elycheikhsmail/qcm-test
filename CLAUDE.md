# Règles du projet

1. Utiliser **JS/TS** + **Bun.js** côté serveur
2. Écrire les réflexions dans `reflexion/`
3. **Mettre à jour ce fichier après chaque modification**
4. Utiliser git pour gérer les changements
5. **À la fin de chaque réponse**, ajouter `j'ai terminé la tâche` si la tâche est complète, ou `j'ai terminé X% de la tâche` si elle est partielle
6. **Scripts de débogage dans `scripts-debug/`** : pour tout diagnostic non trivial (inspection DB, parsing de données, vérification d'état multi-étapes), écrire un script `.ts` dans `scripts-debug/` et l'exécuter avec `bun run scripts-debug/<nom>.ts`. Ne jamais écrire de commandes PowerShell/CMD complexes directement. Exception : commandes simples natives (`git status`, `bun run <script>`, `ls`) qui restent en Bash. Le dossier `scripts-debug/` est ignoré par git.
7. **Merger dans `main` après chaque tâche terminée** : dès qu'une tâche est complète, merger la branche courante dans `main` (`git checkout main && git merge <branche> --no-ff && git checkout <branche>`)
8. **Layout global élève — ne jamais dupliquer le nav dans les pages** : le nav élève est fourni par `app/(eleve)/layout.tsx` (dashboard, profil, classes) et `app/quiz/layout.tsx` (toutes les pages quiz). Ne jamais ajouter de `<header>` ou de bouton "Déconnexion" inline dans ces pages. Toute nouvelle page élève doit être créée dans `app/(eleve)/` pour hériter du nav automatiquement. Composant nav : `components/eleve/StudentNav.tsx`.
9. **Comparaison de réponses texte — toujours tolérer accents et casse** : toute comparaison entre une réponse saisie et une valeur attendue doit normaliser les deux chaînes via `normalize()` de `lib/api.ts` (trim + lowercase + NFD + strip diacritics). Ne jamais comparer des chaînes brutes pour valider une réponse utilisateur. S'applique à `answersEqual` et à tout futur code de correction.
9. **Inputs texte (fill_blank) — ne jamais déclencher une soumission API sur chaque frappe** : tout `<input type="text">` contrôlé dont la valeur est envoyée à une API doit séparer "mise à jour locale" (onChange) et "soumission finale" (onConfirm, déclenché par Enter ou un bouton "Valider"). Ne jamais appeler `fetch` dans un handler `onChange` d'un champ texte libre — cela verrouille le champ dès la première lettre via le retour d'état de l'API.
9. **JSONB PostgreSQL — toujours normaliser côté route API** : `postgres.js` ne parse pas automatiquement les colonnes `JSONB` insérées comme texte brut (ex. `options`, `correct_answer`, `given_answer`). Dans toute route qui lit ces colonnes, appliquer avant usage :
   ```ts
   const parseJsonb = (v: unknown) => typeof v === "string" ? JSON.parse(v) : v;
   ```
   Pour l'écriture, toujours utiliser `sql.json(value)` pour insérer du JSONB (jamais `JSON.stringify(value)::jsonb`). Ces deux règles s'appliquent à chaque nouvelle route et à chaque correction de bug touchant la DB.

## Stack

- Bun + Next.js 16 (App Router) + PostgreSQL + Tailwind v4
- Routes API : `app/api/<segment>/route.ts` (jamais `pages/api`)
- Pool PG : `import { sql } from "@/lib/db"`
- Env : `.env.local` (voir `.env.local.example`)
- Démarrage : `bun run dev` — Health check : `GET /api/health`

## Base de données

- Base : `qcm_db`, rôle : `qcm_app`
- Schéma : `db/schema.sql` — migrations via `bun run db:migrate`
- Ne jamais éditer `db/schema.sql` sans prévoir la migration ALTER correspondante
- Scripts : `db:setup` | `db:migrate` | `db:seed` | `db:reset` | `db:ping`

## Pipeline questions

- Format : `spec/format_questions_schema.ts` — statuts : `pending/approved/rejected`
- Scripts : `generate` | `validate` | `db:approve` | `db:import`
- Import : uniquement les questions `approved`, atomique, dédoublonnage par `(chapter_id, content)`

## Diagrammes UML

- Sources : `spec/uml/*.puml` → SVG générés : `spec/diagrams/` (ne pas éditer manuellement)
- Régénérer : `bun run export-diagrams`

## Frontend élève (Sprint 5)

- Flux : `/` → `/quiz/select` → `/quiz/[session_id]` → `/quiz/[session_id]/results`
- Pages : `app/page.tsx` (token), `app/quiz/select/page.tsx`, `app/quiz/[session_id]/page.tsx`, `app/quiz/[session_id]/results/page.tsx`
- Composants partagés : `components/quiz/` (QuestionCard, ProgressBar, AnswerFeedback, ScoreCard, AnswersList)
- Token magic link stocké dans `sessionStorage` sous la clé `quiz_token`
- Session quiz persistée dans `localStorage` sous la clé `qcm_session` (`{sessionId, index, answers}`)

## Auth élève (Sprint 7)

- Lib auth : `lib/auth.ts` (createSession, getSessionUser, deleteSession, getCurrentUser)
- Cookie httpOnly `session_id` (UUID) — sessions serveur dans table `auth_sessions`
- Hash passwords : `@node-rs/argon2` (argon2id)
- Routes API : `POST /api/auth/register` | `POST /api/auth/login` | `POST /api/auth/logout` | `GET /api/me` | `PATCH /api/me`
- Pages : `/signup` | `/login` | `/dashboard` | `/profil`
- Proxy (middleware) : `proxy.ts` — protège `/dashboard`, `/profil`, `/enseignant`, `/classes/join` (redirect `/login` si pas de cookie)
- Migration : `db/migrations/001_auth_sessions.sql`
- Next.js 16 : fichier proxy s'appelle `proxy.ts`, fonction exportée `proxy` (pas `middleware`)

## Directeur (Sprint 12)

- Auth guard : `requireDirecteur()` + `canAccessClasse(directeurId, classeId)` dans `lib/auth-guard.ts`
- Proxy : `/directeur` protégé
- Routes API :
  - `GET /api/directeur/classes` — classes assignées via `directeur_classes`
  - `GET /api/directeur/classes/:id` — stats tests (avg/min/max) pour la classe
  - `GET /api/directeur/classes/:id/tests/:test_id` — stats par question + notes élèves
  - `GET /api/directeur/eleves/:id` — profil élève + historique tests
  - `GET /api/directeur/eleves/:id/evolution` — évolution hebdomadaire /20 par matière (12 semaines)
- Pages : `/directeur/classes` | `/directeur/classes/[id]` | `/directeur/classes/[id]/tests/[test_id]` | `/directeur/eleves/[id]` | `/directeur/eleves/[id]/evolution`
- Composant : `components/directeur/LineChart.tsx` — SVG natif, une courbe par matière

## Parent (Sprint 12)

- Option A : parent utilise les identifiants de l'enfant (`role = 'eleve'`)
- Option B (compte dédié `role = 'parent'`) → différée
- Proxy : `/parent` protégé
- Route API : `GET /api/parent/summary` — moyenne globale + 5 derniers tests + indicateurs par matière
- Page `/parent` : lecture seule, indicateurs vert/orange/rouge, aucune action disponible
- Dashboard élève : bouton "Vue Parent" → `/parent`

## Auth étendue (Sprint 11)

- Google OAuth : `GET /api/auth/google` (redirect) | `GET /api/auth/google/callback` (échange code + session)
- CSRF state stocké dans cookie httpOnly `oauth_state` (TTL 5 min)
- Liaison de compte : si l'email Google correspond à un user email existant → `google_id` mis à jour
- Env requis : `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_SECRET` | `APP_URL`
- Bouton Google sur `/login` et `/signup`
- OTP téléphone → différé (provider SMS mauritanien non configuré)

## Admin Pédagogique (Sprint 11)

- Auth guard : `requireAdminPed()` dans `lib/auth-guard.ts` (rôles `admin_ped`, `admin_tech`)
- Proxy : `/admin-ped` protégé (redirect `/login` si pas de session)
- Routes API :
  - `GET /api/admin-ped/questions` (filtres: subject_id, level_id, chapter_id, validated)
  - `GET|PATCH /api/admin-ped/questions/:id`
  - `POST /api/admin-ped/questions/:id/approve` | `POST /api/admin-ped/questions/:id/reject`
  - `GET|POST /api/admin-ped/subjects` | `PATCH|DELETE /api/admin-ped/subjects/:id`
  - `GET|POST /api/admin-ped/levels` | `PATCH|DELETE /api/admin-ped/levels/:id`
  - `GET|POST /api/admin-ped/chapters` | `PATCH|DELETE /api/admin-ped/chapters/:id`
- Pages : `/admin-ped` | `/admin-ped/questions` | `/admin-ped/questions/[id]` | `/admin-ped/matieres` | `/admin-ped/niveaux` | `/admin-ped/chapitres`
- Layout : `app/admin-ped/layout.tsx` — vérif rôle serveur + nav

## Classes enseignant (Sprint 8)

- Auth guard : `lib/auth-guard.ts` (requireAuth, requireEnseignant, canManageClasse, isNextResponse)
- Seed : `bun run create-enseignant` | `bun run create-admin-ped`
- Routes API enseignant :
  - `GET|POST /api/etablissements`
  - `GET|POST /api/classes` (GET : mes classes selon le rôle)
  - `GET /api/classes/:id`
  - `POST /api/classes/:id/eleves` (ajout par email ou bulk)
  - `POST /api/classes/:id/join` (élève → pending)
  - `POST /api/classes/:id/eleves/:eleve_id/accept` (pending → active)
  - `POST /api/magic-links/classe` (magic link rattaché à une classe)
- Pages enseignant : `/enseignant/classes` | `/enseignant/classes/[id]`
- Page élève : `/classes/join` (rejoindre par identifiant)
- Dashboard `/dashboard` : section "Mes classes" + redirect enseignant → `/enseignant/classes`
- RBAC : `canManageClasse(userId, classeId)` vérifie `classe_enseignants` — utilisé dans toutes les routes enseignant
