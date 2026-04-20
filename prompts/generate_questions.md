# Prompt : Génération de questions pédagogiques

> Copier-coller ce prompt dans Claude Code.
> Remplir uniquement la section **PARAMÈTRES** avant de coller.

---

## PARAMÈTRES — à remplir avant de coller

```
PDF           : ./src_pedagogique/maths/Fondamental/1AF/Math_1AP_Manuel_eleve.pdf
NIVEAU        : 1AF
CHAPITRE_NUM  : 1
CHAPITRE_TITRE: Les nombres de 0 à 10
PAGES         : 12-24        ← laisser vide si tout le PDF
LANGUE        : fr           ← fr | ar
OPTION        : null         ← null | C | D
COUNT         : 15
ENRICHISSEMENT: non          ← oui | non
```

---

## PROMPT À COLLER

````
Génère un fichier JSON de questions pédagogiques à partir du PDF suivant.

─── PARAMÈTRES ────────────────────────────────────────────────
PDF           : ./src_pedagogique/maths/Fondamental/1AF/Math_1AP_Manuel_eleve.pdf
NIVEAU        : 1AF
CHAPITRE_NUM  : 1
CHAPITRE_TITRE: Les nombres de 0 à 10
PAGES         : 12-24
LANGUE        : fr
OPTION        : null
COUNT         : 15
ENRICHISSEMENT: non
───────────────────────────────────────────────────────────────

### Étape 1 — Lire le PDF

Lis le fichier PDF indiqué ci-dessus. Si PAGES est renseigné, concentre-toi sur ces pages.

### Étape 2 — Générer les questions

À partir du contenu lu, génère exactement COUNT questions respectant ces règles STRICTES :

1. Questions basées UNIQUEMENT sur le contenu du PDF — ne jamais inventer.
2. Répartition : au moins 40 % `qcm`, 20 % `true_false`, 20 % `fill_blank`.
3. Chaque `qcm` a exactement 4 options, une seule bonne réponse, des distracteurs plausibles.
4. Chaque `fill_blank` a UN SEUL blanc noté `___` ; la réponse est un mot ou courte expression.
5. `true_false` : `correct_answer` vaut `"true"` ou `"false"` (string).
6. Langue : si LANGUE = `ar`, rédige tout en arabe. Si `fr`, tout en français.
7. Difficulté :
   - `1` → application directe du cours
   - `2` → raisonnement en une étape
   - `3` → raisonnement multi-étapes
8. `confidence` :
   - `"high"`   → réponse univoque, directement citée
   - `"medium"` → reformulation ou inférence partielle
   - `"low"`    → calcul ou formule — à vérifier impérativement
9. `page_source` : numéro de page dans le PDF, ou `null` si incertain.

Si ENRICHISSEMENT = `oui`, ajoute pour chaque question :
- `explication` : pourquoi la réponse est correcte (1-2 phrases).
- `indice` : aide courte pour un élève bloqué (1 phrase).
- `tags` : 2-4 mots-clés des notions couvertes (tableau de strings).

### Étape 3 — Construire le JSON et écrire le fichier

Construis le JSON final selon le schéma ci-dessous et écris-le dans `output/`.

**Nom du fichier** : `{NIVEAU}_ch{NN}_{slug_chapitre}_{YYYY-MM-DD}.json`
- `{NN}` = CHAPITRE_NUM sur 2 chiffres
- `{slug_chapitre}` = CHAPITRE_TITRE en minuscules, sans accents, espaces→`_`, tronqué à 30 chars
- `{YYYY-MM-DD}` = date du jour

**Schéma attendu** :

```json
{
  "_comment": "Format JSON intermédiaire — questions mathématiques en attente de validation",
  "_version": "1.1",
  "_doc": "Un fichier = un chapitre. Le script d'import ne traite que les questions { validation.status: 'approved' }.",
  "meta": {
    "generated_at": "<ISO 8601>",
    "generated_by": "claude_cowork",
    "source_file": "<basename du PDF>",
    "niveau_code": "<NIVEAU>",
    "niveau_label": "<label complet, ex: 1ère année Fondamentale>",
    "cycle": "<Fondamental | Secondaire 1er cycle | Secondaire 2ème cycle>",
    "option": <null | "C" | "D">,
    "chapitre_titre": "<CHAPITRE_TITRE>",
    "chapitre_numero": <CHAPITRE_NUM>,
    "langue_principale": "<LANGUE>",
    "total_questions": <nombre réel de questions>
  },
  "questions": [
    {
      "id": "tmp_{NIVEAU}_ch{NN}_{index:03d}",
      "type": "qcm | true_false | fill_blank",
      "langue": "<LANGUE>",
      "content": "Texte de la question",
      "options": ["A", "B", "C", "D"] | null,
      "correct_answer": "...",
      "difficulty": 1 | 2 | 3,
      "page_source": <number | null>,
      "enrichissement": null | {
        "explication": "...",
        "indice": "...",
        "tags": ["...", "..."],
        "enrichi_par": "claude_cowork",
        "enrichi_at": "<ISO 8601>"
      },
      "validation": {
        "status": "pending",
        "confidence": "high | medium | low",
        "reviewer_notes": ""
      }
    }
  ]
}
```

**Correspondance niveau → label / cycle** :
| Code | Label | Cycle |
|------|-------|-------|
| 1AF–6AF | Xème année Fondamentale | Fondamental |
| 1AS–4AS | Xème année Secondaire | Secondaire 1er cycle |
| 5AS–7AS | Xème année Secondaire (Terminale pour 7AS) | Secondaire 2ème cycle |

Crée le dossier `output/` s'il n'existe pas, puis écris le fichier.
Affiche ensuite : chemin du fichier, nombre de questions, répartition par type.
````
