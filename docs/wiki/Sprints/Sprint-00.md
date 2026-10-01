# Sprint 00 — Mise en place du projet, de la CI et du wiki
Début : 2026-10-01 · Statut : terminé

## Planning
Sprint de mise en place (CLAUDE.md, section Sprint 0), sans story ni points.

| Élément | Statut | PR |
| --- | --- | --- |
| Projet Tauri 2 + React/TypeScript (Vite 8, TS 6.0) + Rust | Mergé | [#1](https://github.com/sudo-suLexitooow/GestionAgent/pull/1) |
| Vitest + couverture v8 ≥ 70 % par fichier sur `src/core` | Mergé | #1 |
| ESLint strict + `@vitest/eslint-plugin`, Prettier | Mergé | #1 |
| Garde-fou `npm run check:tdd` | Mergé | #1 |
| CI TypeScript + Rust sur Ubuntu, Windows, macOS | Mergé | #1 |
| Modèle de PR | Mergé | #1 |
| Wiki : `Home`, `Methode`, `Cahier-des-charges` dans `docs/wiki/` | Ce commit | — |
| Backlog (`analyste-backlog`) puis porte 1 | Fait | — |

## Journal de session
### 2026-10-01
- Fait : mise en place mergée (PR #1) ; revue `relecteur` : changements demandés, puis accepté. Commandes inscrites dans CLAUDE.md, puis section Wiki modifiée (publication depuis `docs/wiki/`, [ADR-002](ADR-002-wiki-depuis-docs)) ; changements de CLAUDE.md validés par délégation du PO. Backlog produit par `analyste-backlog`, validé à la porte 1.
- Obstacles : le dépôt `.wiki.git` ne peut pas être poussé depuis la session cloud → ADR-002.

## Sprint Review
- Ce que l'utilisateur peut maintenant faire : rien de visible (mise en place technique).
- Décision du PO : sans objet (pas de story).

## Rétrospective
Non tenue (sprint de mise en place).

## Vélocité
Planifié : sans points · Done : sans points
