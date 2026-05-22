# Guide technique — Génération de questions QCM

Ce guide s'adresse aux utilisateurs techniques (`admin_ped`, `admin_tech`) qui souhaitent générer des questions à partir de documents PDF et les importer en base de données.

---

## Vue d'ensemble du pipeline

```
PDF source
  │
  ▼
[1] bun run generate     →  output/*.json  (statut : pending)
  │
  ▼
[2] bun run validate     →  révision interactive (approved / rejected)
  │
  ▼
[3] bun run db:approve   →  auto-approbation par confiance (optionnel)
  │
  ▼
[4] bun run db:import    →  insertion en base PostgreSQL
```

Chaque étape peut être exécutée indépendamment. Le fichier JSON intermédiaire dans `output/` est la source de vérité entre les étapes.

---

## Prérequis

### Variables d'environnement

Dans `.env.local` :

```env
ANTHROPIC_API_KEY=sk-ant-...    # obligatoire pour la génération
DATABASE_URL=...                 # connexion PostgreSQL
```

### Base de données opérationnelle

```bash
bun run db:ping          # vérifier la connexion
bun run db:migrate       # appliquer les migrations si nécessaire
```

---

## Étape 1 — Générer les questions depuis un PDF

### Commande de base

```bash
bun run generate \
  --pdf <chemin_vers_pdf> \
  --niveau <code_niveau> \
  --chapitre-num <numéro> \
  --chapitre-titre "<titre du chapitre>"
```

### Tous les paramètres

| Paramètre | Requis | Description | Exemple |
|---|---|---|---|
| `--pdf` | ✓ | Chemin vers le fichier PDF | `--pdf docs/maths_1AS.pdf` |
| `--niveau` | ✓ | Code du niveau scolaire (voir tableau) | `--niveau 1AS` |
| `--chapitre-num` | ✓ | Numéro du chapitre (entier) | `--chapitre-num 3` |
| `--chapitre-titre` | ✓ | Titre du chapitre | `--chapitre-titre "Fractions"` |
| `--pages` | — | Pages du PDF à cibler | `--pages 12-24` |
| `--langue` | — | `fr` (défaut) ou `ar` | `--langue ar` |
| `--option` | — | `C` ou `D` (uniquement 7AS) | `--option C` |
| `--count` | — | Nombre de questions (défaut : 15) | `--count 20` |
| `--enrich` | — | Activer l'enrichissement (2ème passe IA) | `--enrich` |
| `--model` | — | Modèle Claude à utiliser | `--model claude-sonnet-4-6` |

### Codes de niveau disponibles

| Code | Cycle | Label |
|---|---|---|
| `1AF` – `6AF` | Fondamental | 1ère – 6ème année fondamentale |
| `1AS` – `4AS` | Collège | 1ère – 4ème année secondaire |
| `5AS` – `7AS` | Lycée | 5ème – 7ème année (Terminale = 7AS) |

### Exemples concrets

**Cas standard — 1ère année collège, chapitre 3 :**
```bash
bun run generate \
  --pdf docs/maths_1AS.pdf \
  --niveau 1AS \
  --chapitre-num 3 \
  --chapitre-titre "Nombres décimaux et fractions"
```

**Cibler des pages spécifiques :**
```bash
bun run generate \
  --pdf docs/physique_3AS.pdf \
  --niveau 3AS \
  --chapitre-num 2 \
  --chapitre-titre "Mécanique — Les forces" \
  --pages 45-68
```

**Générer plus de questions avec enrichissement :**
```bash
bun run generate \
  --pdf docs/arabe_2AF.pdf \
  --niveau 2AF \
  --chapitre-num 1 \
  --chapitre-titre "الحروف والأصوات" \
  --langue ar \
  --count 30 \
  --enrich
```

**Terminale option C :**
```bash
bun run generate \
  --pdf docs/maths_terminale_C.pdf \
  --niveau 7AS \
  --option C \
  --chapitre-num 5 \
  --chapitre-titre "Intégration" \
  --count 25
```

### Fichier de sortie

Le script crée automatiquement dans `output/` :
```
output/1AS_ch03_nombres_decimaux_et_fractions_2026-04-25.json
```
Nommage : `NIVEAU_chNN_SLUG_DATE.json`

---

## Étape 2 — Valider les questions (révision interactive)

### Commande

```bash
bun run validate --file output/1AS_ch03_nombres_decimaux_et_fractions_2026-04-25.json
```

### Interface interactive

Pour chaque question affichée :

| Touche | Action | Effet |
|---|---|---|
| `a` | Approuver | `status: "approved"` |
| `r` | Rejeter | `status: "rejected"` + demande un commentaire |
| `s` | Passer | reste `"pending"` |
| `n` | Ajouter une note | ajoute un commentaire sans changer le statut |
| `q` | Quitter et sauvegarder | ou `Ctrl+C` |

L'affichage montre pour chaque question :
- Numéro, ID, type, difficulté
- Niveau de confiance coloré : **vert** = high, **jaune** = medium, **rouge** = low
- Contenu et options (réponse correcte marquée ✓)
- Notes existantes

> Le fichier JSON est mis à jour sur place après chaque révision.

---

## Étape 3 — Auto-approbation par confiance (optionnel)

Évite la révision manuelle des questions à haute confiance.

### Commande

```bash
bun run db:approve output/1AS_ch03_nombres_decimaux_et_fractions_2026-04-25.json
```

### Options

| Option | Description | Défaut |
|---|---|---|
| `--min-confidence high` | Approuve uniquement les questions `high` | oui |
| `--min-confidence medium` | Approuve les questions `medium` et `high` | — |
| `--dry-run` | Prévisualise le nombre de questions concernées sans modifier | — |

### Workflow recommandé

```bash
# 1. Voir combien de questions seraient approuvées
bun run db:approve output/*.json --min-confidence high --dry-run

# 2. Appliquer si le résultat est satisfaisant
bun run db:approve output/*.json --min-confidence high

# 3. Réviser manuellement les questions restantes (medium/low)
bun run validate --file output/*.json
```

> Les questions `low` confidence (contenant des chiffres, formules, calculs) **doivent toujours** être révisées manuellement.

---

## Étape 4 — Importer en base de données

### Commande

```bash
bun run db:import output/1AS_ch03_nombres_decimaux_et_fractions_2026-04-25.json
```

### Options

| Option | Description |
|---|---|
| `--subject "Mathématiques"` | Nom de la matière (créée si inexistante) |
| `--dry-run` | Simule l'import sans écrire en base |

### Ce que fait l'import

1. Ne traite que les questions avec `status: "approved"`
2. Crée la matière, le niveau et le chapitre s'ils n'existent pas
3. Dédoublonne par contenu normalisé (espace/casse)
4. Insère en transaction atomique (tout ou rien)
5. Affiche le rapport : insérées / doublons ignorés / pending-rejected ignorées

### Import en masse (plusieurs fichiers)

```bash
bun run db:bulk-import --dir output/ --subject "Mathématiques"
```

Exécute `db:import` sur tous les fichiers `.json` du dossier.

---

## Format du fichier JSON

### Structure racine

```json
{
  "_version": "1.1",
  "meta": { ... },
  "questions": [ ... ]
}
```

### Métadonnées (`meta`)

```json
{
  "generated_at": "2026-04-25T10:00:00Z",
  "generated_by": "claude_code",
  "source_file": "maths_1AS.pdf",
  "niveau_code": "1AS",
  "niveau_label": "1ère année Secondaire",
  "cycle": "Secondaire 1er cycle",
  "option": null,
  "chapitre_titre": "Nombres décimaux et fractions",
  "chapitre_numero": 3,
  "langue_principale": "fr",
  "total_questions": 15
}
```

### Question — tous les types

**QCM (`type: "qcm"`) :**
```json
{
  "id": "tmp_1AS_ch03_001",
  "type": "qcm",
  "langue": "fr",
  "content": "Quel est le résultat de 0,5 + 1/4 ?",
  "options": ["0,25", "0,75", "1,25", "0,50"],
  "correct_answer": "0,75",
  "difficulty": 2,
  "page_source": 18,
  "enrichissement": null,
  "validation": {
    "status": "pending",
    "confidence": "high",
    "reviewer_notes": ""
  }
}
```

**Vrai/Faux (`type: "true_false"`) :**
```json
{
  "id": "tmp_1AS_ch03_002",
  "type": "true_false",
  "langue": "fr",
  "content": "La fraction 3/4 est plus grande que 0,8.",
  "options": null,
  "correct_answer": "false",
  "difficulty": 1,
  "page_source": 20,
  "enrichissement": null,
  "validation": {
    "status": "pending",
    "confidence": "medium",
    "reviewer_notes": ""
  }
}
```

**Texte à trou (`type: "fill_blank"`) :**
```json
{
  "id": "tmp_1AS_ch03_003",
  "type": "fill_blank",
  "langue": "fr",
  "content": "La fraction ___ est équivalente à 0,5.",
  "options": null,
  "correct_answer": "1/2",
  "difficulty": 2,
  "page_source": 22,
  "enrichissement": null,
  "validation": {
    "status": "pending",
    "confidence": "medium",
    "reviewer_notes": ""
  }
}
```

### Enrichissement (`--enrich`)

Activé par la flag `--enrich` lors de la génération :

```json
"enrichissement": {
  "explication": "0,5 + 0,25 = 0,75. On convertit 1/4 en décimal : 1÷4 = 0,25.",
  "indice": "Convertis d'abord la fraction en nombre décimal.",
  "tags": ["fractions", "décimaux", "addition"],
  "enrichi_par": "claude_code",
  "enrichi_at": "2026-04-25T10:05:00Z"
}
```

### Valeurs de difficulté

| Valeur | Label en base | Utilisation |
|---|---|---|
| `1` | `facile` | Rappel de cours, définitions |
| `2` | `moyen` | Application directe |
| `3` | `difficile` | Raisonnement, synthèse |

### Niveaux de confiance (générés par Claude)

| Valeur | Signification | Action recommandée |
|---|---|---|
| `"high"` | Réponse univoque, citée dans le texte | Auto-approbation possible |
| `"medium"` | Reformulation ou inférence partielle | Révision recommandée |
| `"low"` | Calculs, formules, chiffres | Révision manuelle obligatoire |

---

## Statuts de validation

| Statut | Signification | Importable |
|---|---|---|
| `"pending"` | Pas encore révisé | Non |
| `"approved"` | Validé | **Oui** |
| `"rejected"` | Rejeté avec motif | Non |

---

## Workflows typiques

### Workflow complet (nouvelle matière)

```bash
# 1. Générer
bun run generate \
  --pdf docs/physique_2AS.pdf \
  --niveau 2AS \
  --chapitre-num 1 \
  --chapitre-titre "Optique géométrique" \
  --count 20 \
  --enrich

# 2. Auto-approuver les questions à haute confiance
bun run db:approve output/2AS_ch01_optique_geometrique_*.json \
  --min-confidence high

# 3. Réviser manuellement ce qui reste (medium + low)
bun run validate --file output/2AS_ch01_optique_geometrique_*.json

# 4. Importer
bun run db:import output/2AS_ch01_optique_geometrique_*.json \
  --subject "Physique-Chimie"
```

### Workflow batch (plusieurs chapitres)

```bash
# Générer chapitre par chapitre
for num in 1 2 3 4; do
  bun run generate \
    --pdf docs/maths_6AF.pdf \
    --niveau 6AF \
    --chapitre-num $num \
    --chapitre-titre "$(sed -n "${num}p" titres_chapitres.txt)"
done

# Auto-approuver tous
bun run db:approve output/6AF_*.json --min-confidence high

# Importer tous d'un coup
bun run db:bulk-import --dir output/ --subject "Mathématiques"
```

### Workflow révision rapide (confiance élevée uniquement)

```bash
bun run generate --pdf docs/histoire_4AS.pdf --niveau 4AS \
  --chapitre-num 2 --chapitre-titre "La Première Guerre mondiale"

# Voir le résultat avant d'approuver
bun run db:approve output/4AS_ch02_*.json --dry-run

# Approuver et importer directement
bun run db:approve output/4AS_ch02_*.json --min-confidence high
bun run db:import output/4AS_ch02_*.json --subject "Histoire-Géographie"
```

---

## Vérification après import

```bash
# Vérifier que les questions sont bien en base
bun run db:ping

# Voir les questions depuis l'interface admin
# → /admin-ped/questions  (filtres disponibles : matière, niveau, chapitre)
```

Depuis l'interface `/admin-ped/questions` vous pouvez :
- Filtrer par matière / niveau / chapitre
- Modifier une question importée
- Approuver ou rejeter depuis l'UI

---

## Conseils pratiques

**Qualité du PDF :**
- Préférer les PDF nativement numériques (texte sélectionnable) aux scans
- Pour les scans, utiliser `--pages` pour cibler les sections pertinentes
- Les formules mathématiques complexes génèrent souvent des questions `low` confidence → révision manuelle

**Nombre de questions :**
- `--count 15` (défaut) convient pour un chapitre court
- `--count 25-30` pour un chapitre dense ou un exam complet
- Au-delà de 40, la qualité peut baisser — mieux vaut plusieurs passes

**Langue arabe :**
- Toujours passer `--langue ar`
- La comparaison de réponses est insensible aux diacritiques (normalisation automatique)

**Modèles Claude :**
- `claude-opus-4-7` — meilleure qualité, plus lent et coûteux (recommandé pour la production)
- `claude-sonnet-4-6` — bon équilibre qualité/vitesse (défaut)
- `claude-haiku-4-5-20251001` — rapide et économique, pour les tests

**Dossier `output/` :**
- Ignoré par git — les fichiers JSON intermédiaires ne sont pas versionnés
- Conserver les fichiers importés comme archive locale si besoin

---

## Résolution de problèmes

| Problème | Cause probable | Solution |
|---|---|---|
| `ANTHROPIC_API_KEY not set` | Variable manquante | Vérifier `.env.local` |
| `0 questions imported` | Aucune question `approved` | Lancer `validate` ou `db:approve` d'abord |
| `Database connection failed` | BD non démarrée | `bun run db:ping` + vérifier `DATABASE_URL` |
| Questions dupliquées ignorées | Même contenu déjà en base | Normal — le dédoublonnage est intentionnel |
| Confiance `low` sur toutes les questions | PDF scan / mauvais rendu | Essayer un PDF texte ou cibler les pages avec `--pages` |
| Erreur de type sur `correct_answer` | QCM : réponse hors options | Corriger manuellement dans le JSON avant import |
