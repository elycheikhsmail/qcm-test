# SPEC PROJET — Plateforme Quiz Pédagogique (Mauritanie)
**Version** : 2.0  
**Date** : 10 avril 2026  
**Statut** : MVP défini

---

## Vision

Plateforme web de quiz pédagogique alignée sur le programme mauritanien.  
L'admin peuple la banque de questions depuis des manuels PDF via Claude Code/Cowork.  
Les élèves accèdent sans inscription via magic link et s'auto-évaluent en mode autonome.

---

## Périmètre MVP (ce qui est construit en premier)

### ✅ Inclus dans le MVP
- Une seule matière, tous niveaux scolaires
- Mode autonome uniquement (parcours libre de l'élève)
- Accès élève via magic link (sans inscription)
- 3 types de questions : QCM, Vrai/Faux, Texte à trous
- Pipeline de génération de questions via Claude Code / Claude Cowork
- Déploiement local (machine de développement)

### ❌ Hors scope MVP
- Rôle enseignant
- Mode supervisé / examen fixe
- Interface d'administration web
- Déploiement en ligne

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Runtime | Bun.js |
| Framework | Next.js LTS (App Router) |
| Base de données | PostgreSQL (local, déjà installé) |
| Génération questions | Claude Code / Claude Cowork |
| Déploiement | Local (localhost) |

---

## Pipeline de génération de questions

```
Manuels scolaires mauritaniens (PDF)
              ↓
    Claude Code / Claude Cowork
    (lecture PDF + extraction + génération)
              ↓
     ┌─────────────────────────┐
     │ Cas confiant            │ → Insert direct PostgreSQL
     │ Cas à valider           │ → Fichier JSON ou CSV
     │                         │   → Relecture manuelle
     │                         │   → Script d'import PostgreSQL
     └─────────────────────────┘
              ↓
     Banque de questions PostgreSQL
              ↓
     App Next.js (Bun)
              ↓
     Élève (magic link) → Quiz autonome
```

---

## Structure des données (ébauche)

### Table `subjects` (matières)
- id, name, language (ar/fr)

### Table `levels` (niveaux scolaires)
- id, name (ex: CE1, 6ème, 1ère...), order

### Table `chapters` (chapitres)
- id, subject_id, level_id, title, description

### Table `questions` (banque de questions)
- id, chapter_id, type (qcm | true_false | fill_blank)
- content (texte de la question)
- options (JSON — choix pour QCM)
- correct_answer (réponse attendue)
- difficulty (1-3)
- source (nom du manuel PDF source)
- created_by ('claude_code' | 'claude_cowork')
- created_at

### Table `magic_links`
- id, token (uuid), level_id (optionnel), expires_at, used_at

### Table `sessions` (passage de quiz)
- id, magic_link_id, started_at, completed_at

### Table `answers` (réponses de l'élève)
- id, session_id, question_id, given_answer, is_correct, answered_at

---

## Types de questions — format

### QCM
```json
{
  "type": "qcm",
  "content": "Quelle est la capitale de la Mauritanie ?",
  "options": ["Nouakchott", "Nouadhibou", "Kiffa", "Rosso"],
  "correct_answer": "Nouakchott"
}
```

### Vrai / Faux
```json
{
  "type": "true_false",
  "content": "Le triangle équilatéral a tous ses angles égaux.",
  "correct_answer": "true"
}
```

### Texte à trous
```json
{
  "type": "fill_blank",
  "content": "La photosynthèse transforme le CO2 et l'eau en ___ grâce à la lumière.",
  "correct_answer": "glucose"
}
```

---

## Étapes de développement MVP

### Phase 0 — Préparation pédagogique
- [ ] Choisir la matière pilote (laquelle ?)
- [ ] Rassembler les PDFs des manuels pour tous les niveaux
- [ ] Définir le format JSON intermédiaire pour validation
- [ ] Écrire le script Claude Code de lecture PDF → génération questions

### Phase 1 — Base de données
- [ ] Concevoir le schéma SQL complet
- [ ] Créer les migrations (avec Bun + scripts SQL ou ORM)
- [ ] Seeder : insérer matière, niveaux, chapitres pilotes
- [ ] Importer les premières questions générées

### Phase 2 — Backend Next.js (API Routes)
- [ ] API génération / validation magic link
- [ ] API récupération quiz (questions par chapitre/niveau)
- [ ] API soumission des réponses + calcul score
- [ ] API résultats de session

### Phase 3 — Frontend Next.js
- [ ] Page d'accueil (entrée magic link)
- [ ] Page de sélection : niveau → chapitre
- [ ] Page quiz (affichage question par question)
- [ ] Page résultats (score + corrections)

### Phase 4 — Tests & ajustements
- [ ] Test du pipeline PDF → questions
- [ ] Test parcours élève complet
- [ ] Ajustements qualité des questions générées

---

## Points encore ouverts

- [ ] Quelle est la matière pilote choisie ?
- [ ] Langue(s) de l'interface : français, arabe, ou bilingue ?
- [ ] ORM ou SQL pur pour PostgreSQL avec Bun ?
- [ ] Format du magic link : lien par niveau ? par chapitre ? général ?
- [ ] Durée de validité du magic link ?
- [ ] Nombre minimum de questions par chapitre pour lancer ?

---

*Document évolutif — v2.0 — prochaine mise à jour après décisions sur la matière pilote et la langue*
