# Sprint 0 — Préparation pédagogique & Setup projet

**Dates :** 10 avril — 16 avril 2026  
**Durée :** 1 semaine  
**Sprint Goal :** Avoir un environnement fonctionnel + la matière pilote choisie + un script capable de lire un PDF et générer des questions au format JSON validé.

---

## Capacity

| Personne | Jours dispo | Notes |
|----------|-------------|-------|
| Dev solo | 5 j | — |
| **Total** | **5 j** | ~25 pts (5 pts/jour) |

---

## Sprint Backlog

| Priorité | Tâche | Estimation | Dépendances |
|----------|-------|------------|-------------|
| P0 | Choisir la matière pilote (ex: SVT, Mathématiques, Histoire-Géo) | 0.5 j | Décision humaine requise |
| P0 | Initialiser le projet Next.js (App Router) + Bun | 0.5 j | — |
| P0 | Configurer PostgreSQL local (créer la base `qcm_db`) | 0.5 j | PostgreSQL installé |
| P0 | Définir et documenter le format JSON intermédiaire de validation | 1 j | Matière choisie |
| P0 | Écrire le script Bun/TS `pdf-to-questions.ts` (lecture PDF → génération questions via Claude API) | 2 j | Format JSON défini |
| P1 | Rassembler les PDFs des manuels pour tous les niveaux de la matière pilote | 1 j | Matière choisie |
| P2 | Tester le script sur 1 chapitre d'un manuel → vérifier la qualité des questions | 0.5 j | Script fonctionnel + PDF disponible |

**Charge prévue :** 6 j  
**Capacité :** 5 j  
**Note :** La tâche P1 (collecte PDF) peut avancer en parallèle de la rédaction du script.

---

## Décisions ouvertes à trancher CE sprint

- [ ] **Matière pilote** — laquelle ? (SVT recommandée : facile à vérifier, multilingue)
- [ ] **Langue de l'interface** — français, arabe, ou bilingue ?
- [ ] **ORM ou SQL pur** — recommandation : SQL pur avec scripts `.sql` + Bun pour commencer vite

---

## Format JSON intermédiaire cible (à valider en sprint)

```json
{
  "source": "Manuel SVT 6ème Mauritanie 2023",
  "chapter": "La cellule végétale",
  "level": "6ème",
  "questions": [
    {
      "type": "qcm",
      "content": "Quel organite réalise la photosynthèse ?",
      "options": ["Le chloroplaste", "La mitochondrie", "Le noyau", "La vacuole"],
      "correct_answer": "Le chloroplaste",
      "difficulty": 1
    }
  ]
}
```

---

## Risks

| Risque | Impact | Mitigation |
|--------|--------|------------|
| PDFs non disponibles en numérique | Bloque la génération | Scanner ou trouver les PDF en ligne en priorité |
| Qualité médiocre des questions générées | Retarde Phase 1 | Affiner le prompt Claude dès ce sprint |
| Décision matière pilote retardée | Bloque tout | Décider en J1 |

---

## Definition of Done

- [ ] Projet Next.js + Bun qui démarre (`bun dev` fonctionne)
- [ ] Base PostgreSQL `qcm_db` créée et accessible
- [ ] Matière pilote documentée dans `spec/`
- [ ] Format JSON intermédiaire documenté dans `spec/`
- [ ] Script `scripts/pdf-to-questions.ts` génère ≥10 questions valides sur 1 chapitre pilote

---

## Key Dates

| Date | Événement |
|------|-----------|
| 10 avril | Décision matière pilote + démarrage |
| 13 avril | Mid-sprint : script en état de test |
| 16 avril | Sprint review + go/no-go Phase 1 |
