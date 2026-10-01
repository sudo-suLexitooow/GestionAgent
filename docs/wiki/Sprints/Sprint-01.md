# Sprint 01 — J'ouvre un projet Claude Code existant, je vois ses skills et son CLAUDE.md, et Cadre enregistre un premier modèle .cadre/ qui ne peut pas être corrompu
Début : 2026-10-01 · Statut : en cours

## Planning (porte 2 déléguée à l'orchestrateur par le PO, 2026-10-01)
| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| SP-01 | Spike : format `.cadre/` (schéma YAML, versionnage) | 2 | Done | — (livrable [ADR-001](ADR-001-format-cadre-v1)) |
| US-001 | Ouvrir un dossier de projet | 2 | Done (2026-10-01) | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) |
| US-002 | Lister les skills du projet | 2 | Done (2026-10-01) | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) |
| US-003 | Importer CLAUDE.md et AGENTS.md comme contextes | 2 | Done (2026-10-01) | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) |
| US-005 | Enregistrer le modèle `.cadre/` de façon atomique (zone sensible : porte 3) | 3 | En cours | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) |

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

- Fait (point de session) :
  - US-001 mergée (PR #3). Revue `relecteur` : changements demandés (CI Windows rouge : manifeste Windows absent des exécutables de test, puis origine IPC `http://tauri.localhost` sous Windows) → corrigé → accepté. 2 points Done.
  - US-002 mergée (PR #5). Revue : changements demandés (lecture sans plafond ni contrôle de type : `/dev/zero`, FIFO ; liens non testés ; garantie surestimée ; préfixes Windows ; fichier à la place d'un dossier) → corrigé → accepté. 2 points Done. Décisions : plafond 8 Mio (`too-large`), commandes de lecture async, liens suivis en lecture (skills partagées), fichier `.claude/skills` ou `.cadre` traité comme absent (décision orchestrateur).
  - US-003 mergée (PR #6). Revue : accepté. 2 points Done. Livrée sans écriture (modèle en mémoire, « Non enregistré ») car US-005 pas encore mergée. CLAUDE.md non UTF-8 importé tel quel avec avertissement.
  - US-005 (PR #4, zone sensible) : deux revues indépendantes → changements demandés (liens symboliques/jonctions dans `.cadre`, journaux forgés, blocages permanents, verrou entre instances, racine choisie par le front) → corrigé → deux nouvelles revues indépendantes → changements demandés (lecture via liens recopiant un fichier extérieur dans `.gitignore`, sauvegarde via lien dans `.cadre/backups/<sous-dossier>`, ouverture impossible d'un projet en lecture seule, noms courts 8.3 Windows, blocage par `.cadre/tmp` forgé).
  - Décisions orchestrateur sur US-005 : annulation (pas rejeu) à la récupération ; `.gitignore` seulement si projet Git (racine ou parent) ; AC-005-6 accepté au niveau résultat typé (affichage avec le bouton Enregistrer) ; racine tenue côté Rust via `ouvrir_projet`. Écarts au format consignés dans [ADR-001](ADR-001-format-cadre-v1) (en attente du merge d'US-005).
  - Backlog : US-076 et US-077 ajoutées (À faire, MVP 0), section Dette technique créée.
- Prévu : terminer les corrections d'US-005 (principe unique : toute opération de fichier passe par une résolution sûre qui refuse tout lien/jonction sur chaque segment), puis deux nouvelles revues indépendantes et porte 3.
- Obstacles :
  - Disque du conteneur saturé par les compilations : résolu par une cible cargo partagée.
  - Publication du wiki en échec : le dépôt wiki n'existe pas encore côté GitHub ; le PO doit enregistrer la première page depuis l'interface web.
- Sprint Goal atteignable : oui — dépend du merge d'US-005.

## Sprint Review
À venir.

## Rétrospective
À venir.

## Vélocité
Planifié : 11 pts · Done : 8 pts (SP-01, US-001, US-002, US-003 ; US-005 en cours)
