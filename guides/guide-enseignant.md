# Guide de l'enseignant — Système QCM

## Connexion

1. Aller sur `/login`
2. Saisir vos identifiants enseignant (fournis par l'administrateur)
3. Vous êtes redirigé vers `/enseignant/classes`

> Si votre compte n'existe pas encore, demandez à l'administrateur de le créer via `bun run create-enseignant`.

---

## Gérer vos classes (`/enseignant/classes`)

### Créer une classe

1. Cliquer **Nouvelle classe**
2. Remplir : nom de la classe, établissement
3. Confirmer — la classe apparaît dans votre liste

### Voir une classe

Cliquer sur une classe pour accéder à sa page de détail (`/enseignant/classes/[id]`) :

- Liste des élèves (actifs et en attente)
- Tests passés par la classe
- Lien d'invitation à copier

---

## Gérer les élèves

### Ajouter un élève manuellement

1. Dans la page de la classe, section **Élèves**
2. Saisir l'**email** de l'élève
3. Cliquer **Ajouter** — l'élève reçoit une invitation

### Ajout en masse (bulk)

1. Saisir plusieurs emails séparés par des virgules ou des retours à la ligne
2. Cliquer **Ajouter tous**

### Accepter une demande d'adhésion

Quand un élève rejoint via `/classes/join`, son statut est **En attente**.

1. Dans la liste des élèves, repérer les demandes en attente
2. Cliquer **Accepter** pour chaque élève à valider

---

## Inviter des élèves via lien magique

1. Dans la page de la classe, cliquer **Générer un lien d'invitation**
2. Copier le lien et le partager (email, messagerie…)
3. L'élève clique sur le lien → il est automatiquement connecté et rattaché à la classe

---

## Suivre les résultats

Dans la page d'une classe (`/enseignant/classes/[id]`) :

- Voir la liste des **tests** passés avec leur date
- Cliquer sur un test pour voir :
  - Score moyen / min / max de la classe
  - Détail par question (taux de réussite)
  - Notes individuelles de chaque élève

---

## Problèmes fréquents

| Problème | Solution |
|---|---|
| Classe invisible | Vérifier que l'établissement est correctement configuré |
| Élève toujours "En attente" | Aller dans la classe et cliquer **Accepter** |
| Lien magique expiré | Générer un nouveau lien depuis la page de la classe |
| Pas accès à `/enseignant` | Vérifier que votre compte a bien le rôle `enseignant` (voir l'admin) |
