# Sprint 3 — Import JSON → PostgreSQL

**Dates :** 4 mai — 10 mai 2026
**Durée :** 1 semaine
**Statut :** ✅ **TERMINÉ** (2026-04-20)
**Sprint Goal :** Avoir un script qui prend un fichier JSON généré par le pipeline Sprint 0, ne garde que les questions `validation.status = 'approved'`, et les insère dans PostgreSQL en résolvant matière/niveau/chapitre (création si absent).

**Prérequis Sprint 2 :** schéma DB complet, seed OK.

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
| P0 | Écrire `scripts/import-questions.ts` (lit un JSON, valide avec `validate_questions.ts`, insère en DB) | 1.5 j | Sprint 2 DB |
| P0 | Résolution automatique subject/level/chapter (upsert `(subject, level, chapter_title)`) si inexistant | 0.5 j | — |
| P0 | Mapping des champs JSON → DB : `difficulty 1/2/3` → `facile/moyen/difficile`, `options` → JSONB, `correct_answer` → JSONB | 0.5 j | Schéma v3 |
| P0 | Filtre sur `validation.status === 'approved'` — les `pending` et `rejected` sont ignorés | 0.25 j | Schéma JSON v1.1 |
| P0 | Traçabilité : insérer `source` (basename PDF) et `created_by = 'claude_code'` | 0.25 j | — |
| P0 | Dédoublonnage : ignorer une question si `(chapter_id, content)` existe déjà | 0.5 j | — |
| P0 | Transaction : tout ou rien par fichier (rollback si une question échoue) | 0.5 j | — |
| P0 | Approuver manuellement ≥ 30 questions du fichier `output/1AS_ch03_*.json` (passer `status` à `approved`) | 0.5 j | — |
| P0 | Importer ce fichier approuvé → vérifier en psql | 0.25 j | import-questions OK |
| P1 | Écrire `scripts/bulk-import.ts` : parcourt `output/*.json` et importe tous les fichiers | 0.5 j | import-questions OK |
| P1 | Écrire des requêtes SQL de vérif (questions/chapitre, par type, par difficulté) dans `reflexion/queries.sql` | 0.5 j | données en DB |
| P2 | Interface CLI d'approbation rapide (TUI) pour passer pending → approved | 1 j | — |

**Charge prévue :** 6.5 j — **Capacité :** 5 j — couper P2, P1 bulk-import optionnel.

---

## Flux cible

```
output/1AS_ch03_*.json
       │
       ▼
 validate_questions.ts  ← réutilisé de S0
       │
       ▼  (si valide)
 import-questions.ts
       │
       ├── filtre status=approved
       ├── upsert subject/level/chapter
       ├── mapping champs
       ├── dédoublonnage par content
       └── transaction
       │
       ▼
 PostgreSQL (table questions)
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Peu de questions `approved` dispo → rien à importer | Bloque la suite | **J1** : décider si on approuve manuellement 30 questions du lot S0 ou si on accepte `confidence=high` comme approuvé implicite |
| Collisions sur `(chapter_id, content)` rejettent à tort (légères variations d'espaces) | Perte de données | Normaliser le content (trim + espaces multiples) avant comparaison |
| JSON futur avec nouveau champ (ex: `tags`) casse le script | Import échoue | Parser tolérant — ignorer les champs inconnus avec warning |

---

## Definition of Done

- [ ] `bun run import-questions output/1AS_ch03_*.json` insère les questions approuvées sans erreur
- [ ] Ré-exécution du même import → 0 duplication (dédoublonnage OK)
- [ ] ≥ 30 questions en base, sur ≥ 1 chapitre, ≥ 2 types (qcm + true_false ou fill_blank)
- [ ] Requête `SELECT COUNT(*) FROM questions GROUP BY type` fonctionne et renvoie des nombres cohérents
- [ ] Une question dont `validation.status = 'pending'` n'est **jamais** importée

---

## Key Dates

| Date | Événement |
|------|-----------|
| 4 mai | Démarrage — trancher critère "approved" en J1 |
| 7 mai | Mid-sprint : script fonctionnel sur 1 fichier |
| 10 mai | Sprint review — 30+ questions en DB vérifiées |
