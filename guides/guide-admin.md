# Guide de l'administrateur pédagogique — Système QCM

## Rôles administrateurs

| Rôle | Accès |
|---|---|
| `admin_ped` | Gestion pédagogique (questions, matières, niveaux, chapitres) |
| `admin_tech` | Accès complet (même droits que `admin_ped` + configuration technique) |

---

## Connexion

1. Aller sur `/login`
2. Saisir vos identifiants admin
3. Vous êtes redirigé vers `/admin-ped`

> Pour créer un compte admin pédagogique initial : `bun run create-admin-ped`

---

## Tableau de bord admin (`/admin-ped`)

Vue d'ensemble avec accès rapide à :
- Gestion des questions
- Gestion des matières
- Gestion des niveaux
- Gestion des chapitres

---

## Gérer les matières (`/admin-ped/matieres`)

### Créer une matière
1. Cliquer **Nouvelle matière**
2. Saisir le nom (ex. *Mathématiques*, *Français*)
3. Confirmer

### Modifier / Supprimer
- Cliquer l'icône **Modifier** sur la ligne concernée
- Cliquer **Supprimer** (attention : supprime aussi les niveaux et chapitres liés)

---

## Gérer les niveaux (`/admin-ped/niveaux`)

Les niveaux sont associés à une matière (ex. *6ème*, *Terminale*).

1. Sélectionner la matière parente
2. Cliquer **Nouveau niveau**
3. Saisir le nom du niveau

---

## Gérer les chapitres (`/admin-ped/chapitres`)

Les chapitres sont associés à un niveau.

1. Sélectionner la matière puis le niveau
2. Cliquer **Nouveau chapitre**
3. Saisir le nom du chapitre

---

## Gérer les questions (`/admin-ped/questions`)

### Filtrer les questions
Utiliser les filtres en haut de page :
- Par **matière**, **niveau**, **chapitre**
- Par **statut** : `pending` | `approved` | `rejected`

### Approuver / Rejeter une question

1. Cliquer sur une question pour l'ouvrir (`/admin-ped/questions/[id]`)
2. Lire l'énoncé, les options et la bonne réponse
3. Cliquer **Approuver** (la question devient disponible en quiz) ou **Rejeter**

### Modifier une question

1. Ouvrir la question
2. Modifier le texte, les options, la bonne réponse ou le type
3. Cliquer **Enregistrer**

> Seules les questions avec le statut `approved` apparaissent dans les quiz des élèves.

---

## Créer des comptes utilisateurs (CLI)

Ces commandes sont à exécuter dans le terminal du serveur :

```bash
# Créer un enseignant
bun run create-enseignant

# Créer un admin pédagogique
bun run create-admin-ped
```

Les identifiants sont affichés dans le terminal — les communiquer à l'utilisateur concerné.

---

## Pipeline d'import de questions (en masse)

Pour importer des questions depuis un fichier JSON :

```bash
# Valider le format du fichier
bun run validate

# Approuver les questions validées
bun run db:approve

# Importer en base
bun run db:import
```

Le format attendu est défini dans `spec/format_questions_schema.ts`.

---

## Base de données

| Action | Commande |
|---|---|
| Vérifier la connexion | `bun run db:ping` |
| Appliquer les migrations | `bun run db:migrate` |
| Réinitialiser (dev uniquement) | `bun run db:reset` |
| Seeder des données de test | `bun run db:seed` |

---

## Problèmes fréquents

| Problème | Solution |
|---|---|
| Questions non visibles dans les quiz | Vérifier que leur statut est `approved` |
| Enseignant sans accès | Vérifier le rôle en base (`role = 'enseignant'`) |
| Erreur de connexion DB | Vérifier `.env.local` et lancer `bun run db:ping` |
| Page admin inaccessible | Vérifier que le rôle est `admin_ped` ou `admin_tech` |
| Chapitre introuvable dans quiz | Vérifier que matière → niveau → chapitre sont bien créés et liés |
