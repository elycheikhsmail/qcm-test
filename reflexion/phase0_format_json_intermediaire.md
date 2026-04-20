# Réflexion — Format JSON intermédiaire pour validation

**Date** : 2026-04-10  
**Phase** : 0 — Préparation pédagogique  
**Matière pilote** : Mathématiques

---

## Contexte

Le pipeline génère des questions depuis des PDFs. Certaines questions (cas à valider)
passent par un fichier JSON intermédiaire avant d'être importées en base. Ce fichier
est relu manuellement puis importé via un script.

Le format doit servir deux usages :
1. **Sortie Claude Code** : ce que Claude génère et dépose
2. **Entrée script d'import** : ce que le script lit pour insérer en PostgreSQL

---

## Décisions de design

### Un fichier = un chapitre d'un manuel

Raison : granularité raisonnable pour la relecture, et cohérente avec la table `chapters`.
Nommage suggéré : `{niveau_code}_{chapitre_slug}_{timestamp}.json`
Exemple : `1AF_ch01_nombres_2026-04-10.json`

### Champ `validation.status`

Trois états possibles :
- `pending` — généré, pas encore relu
- `approved` — validé, prêt pour import
- `rejected` — à supprimer ou reformuler (avec note)

Le script d'import ne traite que les questions `approved`.

### Support bilingue (fr / ar)

Certains manuels (2AF→6AF) sont en arabe. Le champ `langue` au niveau question
permet d'avoir un batch mixte si besoin.

### Cas 7AS options C / D

Le champ `meta.option` est nullable. Pour 7AS, il vaut `"C"` ou `"D"`.

### Difficulté

Échelle 1-3 alignée sur la spec :
- 1 = facile (application directe du cours)
- 2 = moyen (raisonnement en une étape)
- 3 = difficile (raisonnement multi-étapes)

### Confiance de génération

`validation.confidence` indique l'auto-évaluation de Claude :
- `high` → réponse univoque, vérifiable directement dans le texte
- `medium` → reformulation nécessaire ou réponse partiellement inférée
- `low` → à vérifier impérativement (formules, chiffres, énoncés complexes)

---

### Enrichissement IA (second passage)

Après génération initiale, un second passage IA peut enrichir chaque question
avec trois éléments stockés dans `enrichissement` :

- `explication` — pourquoi la réponse est correcte (affiché côté app après correction)
- `indice` — aide pour l'élève bloqué (feature post-MVP possible)
- `tags` — mots-clés / notions couvertes (utile pour filtrage futur)

Le champ est `null` si l'enrichissement n'a pas été fait.
L'enrichissement est **optionnel pour l'import** : le script insère même sans lui.

Workflow enrichissement :
```
Génération → status: pending, enrichissement: null
      ↓
Enrichissement IA → enrichissement: { explication, indice, tags, ... }
      ↓
Relecture humaine → status: approved / rejected
      ↓
Import PostgreSQL
```

---

## Points ouverts

- Faut-il stocker la `page_source` pour retrouver le contexte dans le PDF ?
  → Oui, utile pour la relecture et pour citer la source.
- Les options QCM : liste ordonnée ou objet `{a, b, c, d}` ?
  → Liste ordonnée (plus simple, l'ordre est aléatoire à l'affichage côté app).
- Texte à trous : plusieurs blancs possibles ?
  → MVP : un seul blanc par question (`___`). `correct_answer` est une string.
