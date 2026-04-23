# Plan de test — Endpoints API

## Prérequis

1. Serveur Next.js démarré : `bun run dev`
2. Comptes de test seedés :
   ```
   bun run create-enseignant   # enseignant@test.local / Test1234!
   bun run create-admin-ped    # admin-ped@test.local  / Test1234!
   ```
3. Un directeur et ses classes `directeur_classes` configurés en base
4. Variable d'env optionnelle : `TEST_BASE_URL=http://localhost:3000`

## Lancer les tests

```bash
bun run test           # lance tous les fichiers tests/api/*.test.ts
bun run test:watch     # mode watch
bun test tests/api/02-auth.test.ts  # un seul fichier
```

## Fichiers de test

| Fichier | Périmètre |
|---------|-----------|
| `tests/api/01-health.test.ts` | GET /api/health |
| `tests/api/02-auth.test.ts` | Register / Login / Logout / /api/me |
| `tests/api/03-quiz.test.ts` | Subjects / Levels / Chapters / Questions / Sessions quiz |
| `tests/api/04-classes.test.ts` | Établissements / Classes / Join / Accept |
| `tests/api/05-tests.test.ts` | Tests assignables / Assignments / Stats / Résultats |
| `tests/api/06-admin-ped.test.ts` | CRUD sujets, niveaux, chapitres, modération questions |
| `tests/api/07-directeur.test.ts` | Classes directeur / Stats test / Profil élève / Évolution |
| `tests/api/08-parent.test.ts` | GET /api/parent/summary |
| `tests/api/09-magic-links.test.ts` | Génération + validation magic links |
| `tests/setup.ts` | Helpers partagés : api(), register(), login(), uniqueEmail() |

## Couverture par endpoint

### AUTH (100%)
- [x] POST /api/auth/register — happy path, email dupliqué, body invalide
- [x] POST /api/auth/login — happy path, mauvais mdp, email inconnu
- [x] POST /api/auth/logout
- [x] GET /api/me — avec/sans session
- [x] PATCH /api/me
- [ ] GET /api/auth/google — manuel (redirect OAuth)
- [ ] GET /api/auth/google/callback — manuel (nécessite un vrai token Google)

### QUIZ
- [x] GET /api/quiz/subjects
- [x] GET /api/quiz/levels (avec/sans filtre)
- [x] GET /api/quiz/chapters (paramètres requis, erreur 400)
- [x] GET /api/quiz/questions (erreur 400, happy path)
- [x] POST /api/quiz/sessions
- [x] GET /api/quiz/sessions/[id]/questions
- [x] POST /api/quiz/answers
- [x] POST /api/quiz/sessions/[id]/submit (idempotence)
- [x] GET /api/quiz/sessions/[id]/results

### CLASSES
- [x] GET|POST /api/etablissements
- [x] GET|POST /api/classes
- [x] GET /api/classes/[id]
- [x] POST /api/classes/[id]/join
- [x] POST /api/classes/[id]/eleves (bulk)
- [x] POST /api/classes/[id]/eleves/[eleve_id]/accept

### TESTS FORMELS
- [x] GET|POST /api/tests
- [x] GET /api/tests/[id]
- [x] POST /api/tests/[id]/assignments
- [x] GET /api/tests/assigned
- [x] POST /api/tests/[id]/sessions
- [x] GET /api/tests/[id]/stats
- [x] GET /api/tests/[id]/results/classe
- [ ] GET /api/tests/[id]/results/eleve/[eleve_id] (nécessite élève avec session soumise)

### ADMIN PED
- [x] GET|POST|PATCH|DELETE sujets, niveaux, chapitres
- [x] GET|PATCH /api/admin-ped/questions/[id]
- [x] POST .../approve
- [ ] POST .../reject (destructif — à tester séparément)
- [x] 401 sans session

### DIRECTEUR
- [x] GET /api/directeur/classes
- [x] GET /api/directeur/classes/[id]
- [x] GET /api/directeur/classes/[id]/tests/[test_id]
- [x] GET /api/directeur/eleves/[id]
- [x] GET /api/directeur/eleves/[id]/evolution
- [x] 403 classe non assignée

### PARENT
- [x] GET /api/parent/summary
- [x] 401 sans session

### MAGIC LINKS
- [x] POST /api/magic-links/classe
- [x] GET /api/magic-links/[token] — valide + inconnu
