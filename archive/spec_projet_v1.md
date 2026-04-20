# SPEC PROJET — Plateforme Quiz Pédagogique (Mauritanie)
**Version** : 1.0  
**Date** : 10 avril 2026  
**Statut** : En cours de conception

---

## Vue d'ensemble

Plateforme web de quiz pédagogique alignée sur le programme mauritanien, où :
- L'**admin** prépare le curriculum et peuple une banque de questions via un script Claude Code
- Les **élèves** accèdent sans inscription via un magic link
- Deux modes de quiz sont disponibles : **autonome** et **supervisé**

---

## 1. Acteurs du système

| Acteur | Rôle |
|--------|------|
| Admin | Gère le curriculum, importe les questions via script Claude Code |
| Enseignant | Crée et distribue des examens en mode supervisé |
| Élève | Accède via magic link, passe les quiz |

---

## 2. Accès élèves

- **Pas d'inscription** requise
- Accès via **magic link** (lien unique généré par l'enseignant ou l'admin)
- Le lien peut être limité dans le temps ou en nombre d'utilisations (à préciser)

---

## 3. Modes de quiz

### Mode autonome (parcours libre)
- L'élève choisit librement les matières, chapitres, niveaux
- Pas de contrainte de temps imposée
- Résultats visibles immédiatement

### Mode supervisé (examen fixe)
- L'enseignant définit : matière, chapitres, nombre de questions, durée
- L'élève reçoit un lien unique d'accès
- Conditions d'examen contrôlées

---

## 4. Banque de questions

- Peuplée par l'**admin via un script Claude Code**
- Structure pressentie : matière → niveau scolaire → chapitre → question
- Types de questions : à définir (QCM, vrai/faux, réponse courte ?)
- Alignée sur le **programme officiel mauritanien**

---

## 5. Curriculum mauritanien

- Couverture des matières du programme national
- Organisation par niveau scolaire (primaire, collège, lycée ?)
- Chapitres et objectifs pédagogiques à cartographier

---

## 6. Points non encore définis

- [ ] Stack technique (frontend, backend, base de données)
- [ ] Hébergement / déploiement
- [ ] Structure détaillée de la base de données
- [ ] Gestion et affichage des résultats
- [ ] Distinction rôle admin / rôle enseignant (sont-ils séparés ?)
- [ ] Format exact des questions (types supportés)
- [ ] Durée de validité des magic links
- [ ] Langue(s) de l'interface (arabe, français, les deux ?)
- [ ] Statistiques et tableau de bord enseignant
- [ ] Système de correction automatique

---

## 7. Prochaines décisions à prendre

1. Choix de la stack technique
2. Modèle de données (schéma BDD)
3. Flux complet du mode supervisé
4. Interface utilisateur (maquettes)
5. Script Claude Code pour import des questions (format d'entrée)

---

*Document évolutif — mis à jour après chaque session de discussion*
