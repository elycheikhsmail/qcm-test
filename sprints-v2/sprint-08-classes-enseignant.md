# Sprint 8 — Classes enseignant

**Dates :** 8 juin — 14 juin 2026
**Durée :** 1 semaine
**Sprint Goal :** Un enseignant (compte créé en seed ou via outil admin) peut créer une classe, y ajouter des élèves, accepter leurs demandes d'adhésion, et générer un magic link classe pour évaluation rapide.

**Prérequis Sprint 7 :** Auth élève + tableau de bord.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts |

---

## Sprint Backlog

| Priorité | Tâche | Estimation | Spec ID |
|----------|-------|------------|---------|
| P0 | Script `scripts/create-admin-ped.ts` + `create-enseignant.ts` (seed rapide de comptes pour tester) | 0.5 j | — |
| P0 | Auth : étendre `role` check dans les middlewares → permettre routes enseignant | 0.5 j | — |
| P0 | Route `POST /api/etablissements` + `GET /api/etablissements` (CRUD minimal) | 0.5 j | — |
| P0 | Route `POST /api/classes` — enseignant crée une classe (etablissement, niveau, filière, nom, année) | 0.5 j | ENS-01 |
| P0 | Route `GET /api/classes` (mes classes) + `GET /api/classes/:id` | 0.5 j | ENS-01 |
| P0 | Route `POST /api/classes/:id/eleves` — ajoute un élève (par email ou bulk) | 0.5 j | ENS-02 |
| P0 | Route `POST /api/classes/:id/join` — élève envoie une demande d'adhésion (status=pending) | 0.5 j | ELV-03 |
| P0 | Route `POST /api/classes/:id/eleves/:eleve_id/accept` — enseignant valide (pending→active) | 0.25 j | ENS-03 |
| P0 | Route `POST /api/magic-links/classe` — magic link rattaché à une classe (évaluation ponctuelle anonyme — spec ENS-04) | 0.5 j | ENS-04 |
| P0 | Page enseignant `/enseignant/classes` — liste de mes classes | 0.5 j | — |
| P0 | Page enseignant `/enseignant/classes/[id]` — détails classe, liste élèves, demandes en attente, bouton magic link | 1 j | ENS-01→04 |
| P0 | Page élève `/dashboard` — nouvelle section "Mes classes" + bouton "Rejoindre une classe" | 0.5 j | ELV-03 |
| P1 | Import CSV d'élèves (1 colonne email) | 0.5 j | — |
| P1 | Route élève `POST /api/eleves/demande-individuelle` (ELV-04) | 0.5 j | ELV-04 |
| P2 | Notifications visuelles (badge "demande en attente") côté enseignant | 0.25 j | — |

**Charge prévue :** 7.5 j — **Capacité :** 5 j — P1 et P2 reportables à un sprint bis ou S10.

**Priorité absolue P0** : ENS-01, ENS-02, ENS-03, ENS-04, ELV-03 — ces 5 cas d'utilisation sont la colonne vertébrale Phase 2.

---

## Flux enseignant ↔ élève

```
Enseignant                                   Élève
─────────                                    ─────
POST /classes          ──► classe créée
GET  /classes/:id      ◄── vue vide
                                             POST /classes/:id/join (pending)
                             [notification]
POST /accept           ──► status=active
                                             GET /dashboard → classe visible
POST /magic-links/classe ──► URL            
                             [partage URL]
                                             Accès anonyme via token (S4 reutilisé)
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Complexité RBAC (qui peut faire quoi sur quelle classe) | Sécurité | Helper `canManageClasse(user, classe_id)` centralisé, utilisé partout |
| Magic link classe vs magic link global (S4) — deux flux à tenir | Régression MVP | Un seul type `magic_links` avec colonne `classe_id` nullable — pas de table séparée |
| Table `classe_enseignants` : plusieurs profs par classe ? | Complexité UI | OUI (spec structure classe) — le créateur est dans `classe_enseignants` + possibilité d'en ajouter en S10 |

---

## Definition of Done

- [ ] Un enseignant (via compte seedé) peut créer une classe via UI
- [ ] Un élève peut demander à rejoindre → voit "en attente"
- [ ] L'enseignant voit la demande et peut l'accepter → élève passe actif
- [ ] L'enseignant peut générer un magic link classe, partage l'URL, l'élève anonyme peut passer un test
- [ ] Un enseignant ne peut pas voir les classes d'un autre enseignant
- [ ] Un élève ne peut pas "rejoindre" 2× la même classe (contrainte UNIQUE ou check)

---

## Key Dates

| Date | Événement |
|------|-----------|
| 8 juin | Démarrage — CRUD classes en J1-J2 |
| 11 juin | Mid-sprint : demandes d'adhésion fonctionnelles |
| 14 juin | Sprint review — démo enseignant + élève |
