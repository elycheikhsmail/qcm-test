# QCM Système — Mauritanie

Plateforme web de quiz pédagogique alignée sur le programme mauritanien.
Stack : **Bun** + **Next.js 15 (App Router)** + **PostgreSQL 18** + **Tailwind CSS v4**.

Voir [spec/spec_projet_v3.md](spec/spec_projet_v3.md) pour la vision et les acteurs.
Plan de livraison : [sprints-v2/README.md](sprints-v2/README.md).

---

## Prérequis

- **Bun** ≥ 1.3 (vérif : `bun --version`)
- **Node.js** ≥ 20 (pour certains binaires Next) — `node --version`
- **PostgreSQL** ≥ 16 — sous Windows, installer via l'installeur officiel (`psql.exe` dans `C:\Program Files\PostgreSQL\XX\bin\`)

---

## Installation

```bash
bun install
```

## Base de données (une fois)

Crée la base `qcm_db` et le rôle applicatif `qcm_app` :

```bash
# Windows (bash) — demande le mot de passe postgres superuser
QCM_APP_PASSWORD=choisir_un_mdp bun run db:setup
```

Puis copie le fichier d'env :

```bash
cp .env.local.example .env.local
# édite DATABASE_URL avec le mot de passe choisi
```

Teste la connexion :

```bash
bun run db:ping
```

→ Doit afficher `✅ connected to qcm_db`.

---

## Démarrage

```bash
bun run dev
```

- UI : [http://localhost:3000](http://localhost:3000)
- Health : [http://localhost:3000/api/health](http://localhost:3000/api/health) → `{ ok: true, db: "up" }`

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `bun run dev` | Next.js en mode développement |
| `bun run build` | Build de production |
| `bun run start` | Serveur de production |
| `bun run db:setup` | Crée la base + le rôle applicatif (une fois) |
| `bun run db:ping` | Vérifie la connexion à PostgreSQL |
| `bun run generate` | Pipeline pédagogique : génère un JSON de questions depuis un PDF |
| `bun run validate` | Valide un fichier JSON de questions |
| `bun run export-diagrams` | Régénère les SVG PlantUML dans `spec/diagrams/` |

---

## Structure

```
qcm-systeme/
├── app/                    Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/health/route.ts
├── lib/
│   └── db.ts               Pool postgres.js partagé
├── db/
│   └── setup.sql           Création base + rôle (Sprint 1)
├── scripts/
│   ├── db-setup.ts         Wrapper psql (Sprint 1)
│   ├── db-ping.ts          Test de connexion (Sprint 1)
│   ├── generate_questions.ts    Pipeline pédagogique (Sprint 0)
│   ├── validate_questions.ts    Validation JSON (Sprint 0)
│   └── export-diagrams.ts       Génération SVG UML (Sprint 0)
├── spec/                   Spécification + UML
├── prompts/                Prompts de génération
├── src_pedagogique/        Manuels PDF
├── output/                 Fichiers JSON de questions générées
├── sprints-v2/             Plan de livraison
└── reflexion/              Notes de conception
```

---

## Variables d'environnement (`.env.local`)

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | oui (app) | `postgres://qcm_app:<mdp>@localhost:5432/qcm_db` |
| `ANTHROPIC_API_KEY` | oui (pipeline) | Clé pour `scripts/generate_questions.ts` |

---

## Progression

- ✅ Sprint 0 — Pipeline pédagogique (PDF → JSON)
- 🚧 Sprint 1 — Setup Next.js + PostgreSQL *(en cours)*
- ⬜ Sprints 2–12 — voir [sprints-v2/](sprints-v2/)
