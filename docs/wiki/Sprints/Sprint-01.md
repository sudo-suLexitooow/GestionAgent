# Sprint 01 — J'ouvre un projet Claude Code existant, je vois ses skills et son CLAUDE.md, et Cadre enregistre un premier modèle .cadre/ qui ne peut pas être corrompu
Début : 2026-10-01 · Statut : en cours

## Planning (porte 2 déléguée à l'orchestrateur par le PO, 2026-10-01)
| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| SP-01 | Spike : format `.cadre/` (schéma YAML, versionnage) | 2 | Done | — (livrable [ADR-001](ADR-001-format-cadre-v1)) |
| US-001 | Ouvrir un dossier de projet | 2 | En cours | — |
| US-002 | Lister les skills du projet | 2 | À faire | — |
| US-003 | Importer CLAUDE.md et AGENTS.md comme contextes | 2 | À faire | — |
| US-005 | Enregistrer le modèle `.cadre/` de façon atomique (zone sensible : porte 3) | 3 | À faire | — |

Objectif à moyen terme fixé par l'orchestrateur : livrer le MVP 0 complet (Sprints 1 à 3) comme premier livrable fonctionnel.

## Journal de session
### 2026-10-01
- Fait : Sprint 0 mergé (PR #1) ; backlog validé (porte 1) avec délégation des portes 2, 4 et 5 ; options par défaut Q-01 à Q-22 acceptées ; Sprint 1 planifié ; wiki initialisé dans `docs/wiki/` ([ADR-002](ADR-002-wiki-depuis-docs)).
- Prévu : terminer SP-01 (ADR format `.cadre/`), puis US-001, US-002, US-003, US-005.
- Obstacles : aucun bloquant. US-005 est en zone sensible : deux revues `relecteur` et résumé au PO requis.
- Sprint Goal atteignable : oui — toutes les dépendances sont levées une fois SP-01 terminé, et aucune question PO ne bloque plus.

- Fait (suite) : SP-01 terminé, livrable [ADR-001 — Format .cadre/ v1](ADR-001-format-cadre-v1) (2 points Done). Décision de l'orchestrateur (PO délégant) suite à l'ADR : AC-005-2 étendu à `.cadre/backups/` et `.cadre/tmp/`. PR #2 (https://github.com/sudo-suLexitooow/GestionAgent/pull/2) ouverte pour la publication du wiki.
- En cours : US-001 (`developpeur-tdd`).
- Obstacles : aucun bloquant. Note : la spécification Agent Skills (agentskills.io) n'était pas joignable pendant le spike ; les règles de skills d'ADR-001 sont à confirmer par SP-04.
- Sprint Goal atteignable : oui — SP-01 a levé la dépendance de US-005.

## Sprint Review
À venir.

## Rétrospective
À venir.

## Vélocité
Planifié : 11 pts · Done : 2 pts (en cours : SP-01 Done)
