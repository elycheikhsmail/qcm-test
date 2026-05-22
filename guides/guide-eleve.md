# Guide de l'élève — Système QCM

## Création de compte

1. Aller sur `/signup`
2. Remplir : nom, prénom, email, mot de passe
3. Cliquer **S'inscrire**
4. Vous êtes redirigé vers votre tableau de bord

## Connexion

1. Aller sur `/login`
2. Saisir votre email et mot de passe
3. Cliquer **Se connecter**

> Vous pouvez aussi vous connecter avec votre compte Google via le bouton **Continuer avec Google**.

---

## Tableau de bord (`/dashboard`)

C'est votre page d'accueil après connexion. Vous y trouvez :

- Vos **classes** (celles où vous êtes inscrit)
- Un bouton **Vue Parent** pour partager un résumé de vos résultats
- Un accès rapide aux quiz

---

## Rejoindre une classe

1. Aller sur `/classes/join`
2. Saisir l'**identifiant de classe** fourni par votre enseignant
3. Votre demande est envoyée → statut **En attente**
4. Une fois accepté par l'enseignant, la classe apparaît dans votre tableau de bord

---

## Passer un quiz

### Via lien magique
Si votre enseignant vous envoie un lien, cliquez dessus directement — vous serez connecté automatiquement à la session.

### Via votre compte
1. Aller sur `/quiz/select`
2. Choisir une **matière**, un **niveau**, un **chapitre**
3. Cliquer **Démarrer le quiz**
4. Répondre à chaque question :
   - **QCM** : cocher la bonne réponse
   - **Vrai/Faux** : sélectionner Vrai ou Faux
   - **Texte libre** : saisir votre réponse puis appuyer sur **Entrée** ou **Valider**
5. Naviguer avec **Suivant** / **Précédent**
6. À la fin, cliquer **Terminer le quiz**

> Votre progression est sauvegardée automatiquement. Si vous fermez l'onglet, vous reprendrez où vous en étiez.

---

## Voir vos résultats

Après avoir terminé un quiz, vous êtes redirigé vers `/quiz/[session_id]/results` où vous voyez :

- Votre **score** (ex. 14/20)
- Le **récapitulatif** de chaque question : votre réponse, la bonne réponse, correct ou non

---

## Profil (`/profil`)

1. Cliquer sur votre nom ou accéder à `/profil`
2. Modifier votre **nom**, **prénom**, ou **mot de passe**
3. Cliquer **Enregistrer**

---

## Vue Parent (`/parent`)

Cette page est en lecture seule — elle présente un résumé de vos performances :

- Moyenne globale
- 5 derniers tests passés
- Indicateurs par matière (vert / orange / rouge)

Vous pouvez partager ce lien avec vos parents.

---

## Problèmes fréquents

| Problème | Solution |
|---|---|
| "Session expirée" | Se reconnecter sur `/login` |
| Quiz bloqué sur une question | Recharger la page — la progression est sauvegardée |
| Classe non trouvée | Vérifier l'identifiant auprès de l'enseignant |
| Mot de passe oublié | Contacter votre enseignant ou l'administrateur |
