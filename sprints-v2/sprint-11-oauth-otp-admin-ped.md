# Sprint 11 — OAuth Google + OTP téléphone + Admin Pédagogique

**Dates :** 29 juin — 5 juillet 2026
**Durée :** 1 semaine
**Sprint Goal :** Diversifier les méthodes d'inscription (Google + téléphone OTP) et livrer l'interface Admin Pédagogique pour valider les questions `pending` et gérer matières/niveaux/chapitres.

**Prérequis Sprint 10 :** Phase 2 livrée.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

### Volet 1 — Auth étendue

| Priorité | Tâche | Estimation | Spec ID |
|----------|-------|------------|---------|
| P0 | Google OAuth — route `/api/auth/google`, callback, stockage `google_id` | 1 j | ELV-01 |
| P0 | Bouton "Se connecter avec Google" sur `/login` et `/signup` | 0.25 j | — |
| P1 | OTP téléphone — choisir provider SMS (Twilio ou local mauritanien Chinguitel ?) | 0.25 j | — |
| P1 | Route `/api/auth/otp/request` — envoie code | 0.5 j | ELV-01 |
| P1 | Route `/api/auth/otp/verify` — vérifie code + crée user/session | 0.5 j | ELV-01 |
| P1 | Page `/login/phone` — saisie téléphone + code | 0.5 j | — |

### Volet 2 — Admin Pédagogique

| Priorité | Tâche | Estimation | Spec ID |
|----------|-------|------------|---------|
| P0 | Rôle `admin_ped` dans middleware + layout `/admin-ped` | 0.25 j | AP |
| P0 | Page `/admin-ped/questions` — liste questions `validated=false`, filtres matière/niveau/chapitre | 0.75 j | AP-04 |
| P0 | Actions approuver / rejeter / éditer une question | 0.75 j | AP-04 |
| P0 | Page `/admin-ped/matieres` — CRUD matières (spec structure data) | 0.5 j | AP-01 |
| P0 | Page `/admin-ped/niveaux` — CRUD niveaux | 0.25 j | AP-02 |
| P0 | Page `/admin-ped/chapitres` — CRUD chapitres | 0.5 j | AP-03 |
| P1 | Page `/admin-ped/comptes` — création manuelle enseignant/directeur, désactivation (AP-05, AP-06, AP-08) | 0.75 j | AP-05/06/08 |
| P1 | Page `/admin-ped/directeurs` — assigner classes à un directeur | 0.5 j | AP-07 |

**Charge prévue :** 7.25 j — **Capacité :** 5 j — OTP téléphone reporté si provider SMS pas trivial.

---

## Décisions à trancher en J1

- [ ] Provider SMS pour la Mauritanie : Twilio international, Chinguitel local, ou skip OTP ce sprint ?
- [ ] Google OAuth : un seul Client ID pour dev + prod, ou deux projets GCP ?
- [ ] Approbation questions : l'admin péda peut-il éditer le `content` ou seulement approuver/rejeter ?

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| OTP coûts (SMS Mauritanie ~$0.05/msg) | Budget | Limiter à 5 OTP/numéro/24h dès le départ |
| OAuth Google : config domaines autorisés → friction dev | Retard | Tester avec `localhost:3000` inscrit comme URI autorisé |
| Admin péda interface devient lourde | Hors scope time | Templating rapide avec tables HTML + Tailwind — pas d'admin framework |
| Validation question : admin péda modifie `correct_answer` mais des élèves ont déjà répondu | Scores deviennent faux | Afficher warning + bouton "recalculer scores" (non-P0) |

---

## Definition of Done

- [ ] Inscription/connexion Google fonctionne bout-en-bout
- [ ] Admin péda peut approuver une question `pending` → elle devient visible dans les quiz autonomes
- [ ] Admin péda peut rejeter une question (supprimée ou archivée)
- [ ] Admin péda peut CRUD matières/niveaux/chapitres
- [ ] Un user non admin_ped ne peut pas accéder à `/admin-ped`
- [ ] OTP téléphone fonctionne **OU** explicitement différé (documenté dans retro)

---

## Key Dates

| Date | Événement |
|------|-----------|
| 29 juin | Démarrage — décisions OTP en J1 |
| 2 juillet | Mid-sprint : OAuth Google OK |
| 5 juillet | Sprint review — admin péda valide une vraie question |
