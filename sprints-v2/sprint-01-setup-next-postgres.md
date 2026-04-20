# Sprint 1 — Setup Next.js + PostgreSQL

**Dates :** 20 avril — 26 avril 2026
**Durée :** 1 semaine
**Statut :** ✅ **TERMINÉ** (2026-04-20)
**Sprint Goal :** Avoir un projet Next.js (App Router) démarrable sous Bun, connecté à une base PostgreSQL locale `qcm_db`, avec la structure de dossiers de l'app posée.

**Prérequis Sprint 0 :** ✅ pipeline pédagogique opérationnel, matière pilote choisie, format JSON validé.

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
| P0 | Installer Node LTS + Bun + PostgreSQL 16 sur la machine de dev | 0.5 j | — |
| P0 | `bun create next-app` avec App Router + TypeScript + ESLint, en gardant `package.json` mergé avec l'existant (scripts `generate`, `validate`, `export-diagrams`) | 0.5 j | Bun OK |
| P0 | Poser la structure `app/` (`app/layout.tsx`, `app/page.tsx` placeholder) + dossier `lib/` + `db/` | 0.5 j | Next.js initialisé |
| P0 | Créer la base `qcm_db` en local + utilisateur dédié + fichier `.env.local` (DATABASE_URL) | 0.5 j | PostgreSQL OK |
| P0 | Choisir le driver PG : `postgres.js` (recommandé, compatible Bun) — l'installer et écrire `lib/db.ts` (pool singleton) | 0.5 j | base créée |
| P0 | Écrire un script `scripts/db-ping.ts` qui fait un `SELECT 1` via le pool → vérifie la connectivité | 0.25 j | `lib/db.ts` |
| P0 | Ajouter `bun dev` + un endpoint `/api/health` qui renvoie `{ ok: true, db: 'up' }` | 0.5 j | ping OK |
| P1 | Configurer Tailwind CSS v4 (ou CSS Modules si refus) | 0.5 j | Next.js initialisé |
| P1 | Configurer `tsconfig.json` paths (`@/lib`, `@/app`, `@/db`) | 0.25 j | — |
| P1 | Ajouter un `README.md` racine (how to run) + mettre à jour `CLAUDE.md` avec la commande `bun dev` | 0.5 j | — |
| P2 | Installer Biome ou Prettier pour le formatage | 0.25 j | — |
| P2 | Configurer un hook de commit (lint-staged) | 0.25 j | — |

**Charge prévue :** 5 j — **Capacité :** 5 j — aligné.

---

## Structure cible après Sprint 1

```
qcm-systeme/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── health/
│           └── route.ts
├── lib/
│   └── db.ts              ← pool postgres.js
├── db/                    ← prévu pour S2 (schema.sql, migrations)
├── scripts/
│   ├── db-ping.ts         ← NEW
│   ├── generate_questions.ts
│   ├── validate_questions.ts
│   └── export-diagrams.ts
├── spec/                  ← inchangé
├── prompts/               ← inchangé
├── src_pedagogique/       ← inchangé
├── output/                ← inchangé
├── .env.local             ← DATABASE_URL
└── package.json
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Bun + Next.js App Router compatibilité limitée (certains loaders) | Bloquant | Tester `bun dev` sur un `page.tsx` simple dès J1 ; fallback `npm run dev` si nécessaire |
| `postgres.js` incompatible Bun | API inutilisable | Plan B : driver `pg` natif |
| Mélange `package.json` existant + Next.js casse les scripts Sprint 0 | Régression pipeline | Backup `package.json` avant `create-next-app`, re-merger à la main |

---

## Definition of Done

- [ ] `bun dev` démarre Next.js sans erreur
- [ ] `http://localhost:3000/` affiche une page (peu importe le contenu)
- [ ] `http://localhost:3000/api/health` renvoie `{ ok: true, db: 'up' }`
- [ ] `bun run scripts/db-ping.ts` affiche `✅ connected to qcm_db`
- [ ] Les scripts Sprint 0 (`generate`, `validate`, `export-diagrams`) continuent de fonctionner
- [ ] `.env.local` documenté dans le README (variables requises)

---

## Key Dates

| Date | Événement |
|------|-----------|
| 20 avril | Démarrage — installs + `create-next-app` en J1 |
| 23 avril | Mid-sprint : Next.js + `/api/health` OK |
| 26 avril | Sprint review — démo `bun dev` + ping DB |
