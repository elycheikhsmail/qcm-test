# Règles du projet

1. Utiliser **JS/TS** + **Bun.js** côté serveur
2. Écrire les réflexions dans `reflexion/`
3. **Mettre à jour ce fichier après chaque modification**
4. Utiliser git pour gérer les changements
5. **À la fin de chaque réponse**, ajouter `j'ai terminé la tâche` si la tâche est complète, ou `j'ai terminé X% de la tâche` si elle est partielle

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
