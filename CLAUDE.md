# Regles du projet

1. Toujours utiliser **JS/TS** pour ecrire des scripts
2. Toujours utiliser **Bun.js** pour executer JS cote serveur
3. Toujours ecrire la reflexion dans le dossier `reflexion/`
4. **Après chaque modification (code, scripts, schéma, config), actualiser ce fichier `CLAUDE.md`** pour qu'il reflète l'état courant du projet (nouveaux scripts, nouvelles règles, nouvelles tables, nouvelles routes).

## Application Next.js

- Stack : Bun + Next.js 15 (App Router) + PostgreSQL 18 + Tailwind v4
- Routes API dans `app/api/<segment>/route.ts` (jamais de `pages/api`)
- Pool PG partagé dans `lib/db.ts` (driver `postgres.js`) — importer via `import { sql } from "@/lib/db"`
- Alias TS : `@/*` → racine (cf. `tsconfig.json`)
- Variables d'env dans `.env.local` (voir `.env.local.example`)
- Démarrage : `bun run dev` — Health : `/api/health` doit retourner `db: "up"`

## Base de données

- Base : `qcm_db`, rôle applicatif : `qcm_app`
- Schéma applicatif : `db/schema.sql` (16 tables v3 — cf. `spec/spec_projet_v3.md` §Structure des données)
- Création initiale (une fois) : `bun run db:setup` (wrapper `scripts/db-setup.ts` autour de `psql` + `db/setup.sql`)
- Migrations idempotentes : `bun run db:migrate` (exécute `db/schema.sql`)
- Données de référence : `bun run db:seed` (matière Mathématiques + 13 niveaux + 5 chapitres pilotes)
- Reset complet (dev uniquement) : `bun run db:reset` (DROP SCHEMA + migrate + seed)
- Test connexion : `bun run db:ping`
- Ne jamais éditer `db/schema.sql` sans penser à la migration correspondante (Sprint 2 = création from scratch, suivants = ALTER)

## Pipeline d'import des questions (Sprint 0 + Sprint 3)

- Génération : `bun run generate` → produit un JSON dans `output/` (format v1.1, cf. `spec/format_questions_schema.ts`)
- Chaque question porte `validation.status` (`pending` | `approved` | `rejected`) et `validation.confidence` (`high` | `medium` | `low`)
- Relecture interactive : `bun run validate -- --file <chemin>`
- Approbation en masse par confiance : `bun run db:approve <chemin.json> [--min-confidence high|medium]`
- Import PostgreSQL : `bun run db:import <chemin.json>` — n'importe **que** les questions `approved`, transaction atomique, dédoublonnage par `(chapter_id, normalize(content))`
- Mapping de difficulté à l'import : `1 → facile`, `2 → moyen`, `3 → difficile`

## Diagrammes UML

- Les sources PlantUML sont dans `spec/uml/*.puml` (un fichier par diagramme)
- Les images SVG générées sont dans `spec/diagrams/*.svg`
- La spec `spec/spec_projet_v3.md` référence les images via `![Nom](diagrams/Nom.svg)`
- Pour regénérer toutes les images après modification d'un `.puml` : `bun run export-diagrams`
- Le script d'export est `scripts/export-diagrams.ts` — il lit `spec/uml/`, encode en zlib deflate + base64 custom et appelle `plantuml.com`, sans dépendance npm externe
- Ne jamais éditer les fichiers dans `spec/diagrams/` manuellement — ils sont générés
