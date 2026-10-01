# Sprint courant

Sprint actif : [Sprint 01](Sprint-01) — début 2026-10-01 · en cours.

Sprint Goal : « J'ouvre un projet Claude Code existant, je vois ses skills et son CLAUDE.md, et Cadre enregistre un premier modèle .cadre/ qui ne peut pas être corrompu. »

| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| SP-01 | Spike : format `.cadre/` (schéma YAML, versionnage) | 2 | Done | — (livrable [ADR-001](ADR-001-format-cadre-v1)) |
| US-001 | Ouvrir un dossier de projet | 2 | Done (2026-10-01) | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) |
| US-002 | Lister les skills du projet | 2 | Done (2026-10-01) | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) |
| US-003 | Importer CLAUDE.md et AGENTS.md comme contextes | 2 | Done (2026-10-01) | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) |
| US-005 | Enregistrer le modèle `.cadre/` de façon atomique (zone sensible) | 3 | En cours | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) |

Total : 11 points · Done : 8.

En cours : US-005 (zone sensible, PR #4). Deuxième série de revues : changements demandés ; corrections en cours (`developpeur-tdd`) avec un principe unique : toute opération de fichier passe par une résolution sûre qui refuse tout lien/jonction sur chaque segment. Ensuite : deux nouvelles revues `relecteur` indépendantes, puis porte 3 (résumé au PO).

Obstacle : publication du wiki en échec, le dépôt wiki n'existe pas encore côté GitHub ; le PO doit enregistrer la première page depuis l'interface web.

Ajoutées au backlog le 2026-10-01 : US-076, US-077 (MVP 0, À faire) et une section Dette technique, voir [Backlog](Backlog).

Mis à jour le 2026-10-01.
