# Réflexion — Script de génération de questions depuis PDF

**Date** : 2026-04-10  
**Phase** : 0 — Préparation pédagogique  
**Livrable** : `scripts/generate_questions.ts`

---

## Objectif

Produire un script Bun/TypeScript qui :
1. Prend un PDF de manuel scolaire mauritanien en entrée
2. Appelle Claude via l'API Anthropic (avec le PDF en pièce jointe)
3. Génère des questions pédagogiques au format JSON intermédiaire
4. Écrit le résultat dans `output/{niveau}_{chapitre}_{timestamp}.json`

---

## Décisions d'architecture

### Envoi du PDF à Claude

L'API Anthropic supporte les PDFs nativement via `type: "document"` dans les messages.  
On envoie le PDF en base64 — pas besoin de parser le texte localement (OCR, etc.).  
Claude fait lui-même l'extraction et le raisonnement pédagogique en un seul appel.

Avantages :
- Gère les PDFs avec images, tableaux, formules mathématiques
- Pas de dépendance à un parser PDF local
- Cohérent avec le workflow "Claude Code / Claude Cowork"

Limite : taille max PDF ~32MB (limite API Anthropic pour documents).

### Modèle utilisé

`claude-opus-4-6` pour la génération principale — meilleure compréhension des manuels
techniques (mathématiques, sciences). Paramétrable via `--model`.

### Génération en deux temps (optionnel)

1. **Premier appel** : génération brute des questions (`confidence`, `status: pending`)
2. **Second appel** : enrichissement (`explication`, `indice`, `tags`)

Le script accepte un flag `--enrich` pour déclencher le second passage.  
Sans ce flag : `enrichissement: null` sur toutes les questions.

### Parsing de la réponse Claude

Claude répond avec un bloc JSON dans sa réponse (demandé explicitement dans le prompt).  
On extrait le JSON via regex `/<json>([\s\S]*?)<\/json>/` — plus robuste que du parsing
direct de la réponse texte complète.

### Arguments CLI

```
bun run scripts/generate_questions.ts \
  --pdf path/to/manuel.pdf \
  --niveau 1AF \
  --chapitre ch01_nombres \
  --titre "Les nombres naturels" \
  --pages 12-24 \        # optionnel — indice de pages pour le prompt
  --langue fr \          # fr | ar (défaut: fr)
  --option C \           # optionnel — pour 7AS seulement
  --enrich               # optionnel — active l'enrichissement
  --model claude-opus-4-6  # optionnel
```

### Gestion des erreurs

- PDF introuvable → exit(1) avec message clair
- Réponse Claude sans JSON valide → log de la réponse brute + exit(1)
- Limite de tokens dépassée → découpage en sections suggéré dans le message d'erreur

### Output

Fichier JSON dans `output/` (créé s'il n'existe pas) :
`output/{niveau}_{chapitre}_{YYYY-MM-DD}.json`

Si le fichier existe déjà → le script écrase avec un warning (comportement voulu
pour les re-générations).

---

## Prompt système — Principes

Le prompt doit :
- Préciser le contexte mauritanien et le niveau scolaire
- Demander un minimum de 10 questions, mix des 3 types
- Exiger `confidence: low` pour tout ce qui implique des chiffres ou formules
- Interdire les questions "hors texte" (invention)
- Demander la réponse encadrée dans `<json>...</json>`

---

## Points ouverts résolus ici

- **page_source** : inclus, Claude l'estime depuis le contexte du PDF
- **IDs des questions** : UUID v4 généré côté script (pas par Claude)
- **Nombre de questions cible** : paramètre `--count N` (défaut: 15)
