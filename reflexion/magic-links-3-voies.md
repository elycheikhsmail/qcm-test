# Magic links — 3 voies de génération + test e2e

## Contexte

L'élève accède aux quiz via un token UUID. Trois acteurs doivent pouvoir générer ce token :
- Claude code / scripts CLI (header `X-Admin-Token`)
- Admin pédagogique connecté (session)
- Enseignant connecté pour sa classe (session)

## Changements

### `app/api/magic-links/route.ts`

Acceptait uniquement `X-Admin-Token`. Étendu pour accepter aussi une session :
- Si le header `X-Admin-Token` est présent et valide → `created_by = admin_tech seed`
- Sinon → `getCurrentUser()` → exige rôle `admin_tech` ou `admin_ped`, sinon 401/403

Reste compatible avec `scripts/generate-magic-link.ts` et la global setup Playwright.

### `app/admin-ped/magic-links/page.tsx`

Nouveau formulaire : `expires_in`, `max_uses`, `level_id`, `classe_id`.
Affiche le résultat avec URL complète + bouton Copier.
Référencé depuis la nav admin-ped et le dashboard `/admin-ped`.

### `tests/e2e/flows/07-magic-links.spec.ts`

7 tests couvrant :
1. Génération via header `X-Admin-Token` → 201 + UUID + validation publique
2. Génération via session admin_ped (API directe) → 201
3. Génération via UI `/admin-ped/magic-links` → token visible dans le DOM
4. Génération via UI enseignant `/enseignant/classes/[id]` → bandeau "Magic link prêt"
5. Élève anonyme : token → `/quiz/select` + `sessionStorage.quiz_token` populé
6. Token UUID inexistant → message d'erreur affiché

## Résultat

`bunx playwright test tests/e2e/flows/07-magic-links.spec.ts` → 7 passed (51.4s).
