# Méthode — Scrum + TDD piloté par agents

Miroir résumé de `CLAUDE.md` (dépôt de code), qui fait foi. Mis à jour le 2026-10-01.

## Rôles

| Rôle | Qui | Responsabilité |
| --- | --- | --- |
| Product Owner | L'humain | Valide backlog, priorités, Sprint Goal ; accepte ou refuse en Sprint Review |
| Scrum Master / orchestrateur | Session principale | Fait avancer le pipeline, délègue, s'arrête aux portes |
| `analyste-backlog` | Sous-agent | Cahier des charges → stories, critères, estimation |
| `developpeur-tdd` | Sous-agent | Implémente une story en RED → GREEN → REFACTOR |
| `relecteur` | Sous-agent, lecture seule | Revue indépendante |
| `scribe-wiki` | Sous-agent | Seul à écrire le wiki |

Règle d'or : celui qui écrit le code n'est jamais celui qui le valide.

## Pipeline

Cahier des charges → backlog (porte 1) → Sprint Planning (porte 2) → pour chaque story : branche + TDD + PR → CI verte → revue `relecteur` → zone sensible ? porte 3 → merge → traçabilité wiki → Sprint Review (porte 4) → Rétrospective (porte 5 pour tout changement de CLAUDE.md) → nouveau sprint.

## Portes et délégation actuelle (depuis le 2026-10-01)

Le PO a écrit à la porte 1 : « tu es le chef de projet je te laisse tout gérer donne moi juste un livrable fonctionnel ». Interprétation consignée :

| Porte | Objet | Tenue actuelle |
| --- | --- | --- |
| 1 | Backlog | Validé tel quel le 2026-10-01 ; options par défaut Q-01 à Q-22 acceptées |
| 2 | Sprint Goal + stories | Déléguée à l'orchestrateur |
| 3 | Zone sensible | Maintenue : tests renforcés, deux revues `relecteur` indépendantes, résumé en langage simple au PO ; risque résiduel noté dans la PR et le wiki |
| 4 | Acceptation en Sprint Review | Déléguée à l'orchestrateur |
| 5 | Changements de CLAUDE.md | Déléguée à l'orchestrateur |

Priorité du PO : un livrable fonctionnel.

Zones sensibles : arrêt et gestion des processus, worktrees Git, écritures de fichiers atomiques, permissions et portée des agents, stockage des clés, signature et mise à jour, paiement.

## Definition of Ready

- Format « En tant que… je veux… afin de… ».
- Au moins une exigence du cahier des charges référencée.
- Critères d'acceptation numérotés, testables, sans ambiguïté.
- Estimée à 5 points ou moins.
- Dépendances terminées ; inconnues techniques levées par un spike si besoin.

## Definition of Done

- Chaque critère couvert par au moins un test nommé avec son ID.
- Tests vus en échec (RED) avant le code, preuve dans la PR.
- Tests unitaires et d'intégration verts en local et en CI.
- Couverture du cœur ≥ 70 % (modèle, adaptateurs, validation, diff).
- Lint et typage sans erreur.
- Revue `relecteur` sans point bloquant ; relecture humaine si zone sensible.
- Aucune régression connue ; wiki à jour ; mergé dans la branche principale.

## Règles TDD

1. Pas de code de production sans test qui échoue d'abord, pour la bonne raison.
2. GREEN = le minimum pour passer.
3. REFACTOR seulement quand tout est vert.
4. Interdit de modifier, désactiver, sauter ou supprimer un test pour le faire passer ; un test faux → arrêt, explication dans la PR, le PO tranche.
5. Interdit d'affaiblir une assertion, de coder en dur une valeur attendue, de mocker le code testé.
6. Un bug = d'abord un test qui le reproduit.

## Commandes (fixées au Sprint 0, identiques en CI)

| Étape | Commande |
| --- | --- |
| Installation | `npm ci` |
| Garde-fou TDD (aucun test sauté, focalisé ou ignoré) | `npm run check:tdd` |
| Lint + format (ESLint strict, Prettier) | `npm run lint` |
| Typage | `npm run typecheck` |
| Tests + couverture `src/core/` (≥ 70 % par fichier, v8) | `npm run test:coverage` (`npm test` sans couverture) |
| Build de l'interface | `npm run build` |
| Rust (`src-tauri/`) | `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` |

CI : `.github/workflows/ci.yml`, TypeScript et Rust sur Ubuntu, Windows et macOS.
Code : cœur métier `src/core/`, interface `src/ui/`, système `src-tauri/src/`.

## Git

- Une branche par story `us/012-titre-court` ; spike `spike/sujet`.
- Conventional Commits avec l'ID : `test(us-012): ...` (RED), `feat(us-012): ...` (GREEN), `refactor(us-012): ...`.
- Une PR par story (modèle `.github/pull_request_template.md`) ; jamais de push direct sur la branche principale.
- Jamais de `push --force`, `reset --hard` ni réécriture d'historique partagé.

## Estimation et sprints

Points = complexité + risque + incertitude, relatifs à US-002 (2 points). Échelle 1, 2, 3, 5 ; au-delà, découper. Un sprint se termine quand son goal est atteint ou bloqué (Q-20). Vélocité suivie dans [Velocite](Velocite).

## Sessions

Début : lire [Sprint-courant](Sprint-courant), [Backlog](Backlog), dernière entrée du journal ; écrire un point de session. Fin : `scribe-wiki` met à jour le sprint et la story en cours.

## Wiki

Pages dans `docs/wiki/` du dépôt de code, publiées par `.github/workflows/wiki.yml` à chaque merge sur `main` ([ADR-002](ADR-002-wiki-depuis-docs)). Mise à jour via PR, de préférence la PR de la story. Ne jamais éditer le wiki GitHub à la main.
