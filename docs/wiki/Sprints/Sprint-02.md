# Sprint 02 — J'enregistre mon cadrage dans .cadre/ depuis l'application, je le retrouve en rouvrant le projet, et je crée mon premier agent
Début : 2026-10-01 · Statut : en cours

## Planning (porte 2 déléguée à l'orchestrateur par le PO, 2026-10-01)
| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| US-077 | Enregistrer le cadrage depuis l'interface (zone sensible : porte 3) | 3 | À faire | — |
| US-006 | Rouvrir un projet depuis `.cadre/` | 3 | À faire | — |
| US-007 | Créer un agent (rôle, description, outil cible) | 2 | À faire | — |
| US-076 | Aligner les commandes de lecture sur la racine du projet ouvert (zone sensible : porte 3) | 2 | À faire | — |
| SP-02 | Spike : relevé de ce que Claude Code applique réellement | 3 | À faire | — |

Total : 13 points (vélocité du Sprint 1 : 11 points).

Ajouts au planning issus de la Sprint Review 1 : AC-006-6 et AC-077-4 (un dossier `.cadre/` sans `cadre.yaml` n'est pas un modèle : l'import est proposé ; voir [ADR-001](ADR-001-format-cadre-v1)).

## Journal de session
### 2026-10-01
- Fait : Sprint 1 terminé (11/11 points, US-005 mergée PR #4) ; Sprint Review et rétrospective tenues ([Sprint-01](Sprint-01)) ; Sprint 2 planifié.
- Prévu : SP-02, US-077, US-006, US-007, US-076, en appliquant les actions de la rétrospective 1 : checklist « sécurité fichiers » dans le brief des développeurs ; pas de stories parallèles touchant `lib.rs` / `Cargo.toml`, merge de `main` dans la branche avant revue ; cible cargo partagée `/home/user/.cargo-target-cadre` et nettoyage des worktrees ; relance du PO pour le wiki GitHub.
- Obstacles : publication du wiki GitHub en échec tant que le PO n'a pas créé la première page (non bloquant pour le code).
- Sprint Goal atteignable : oui — les dépendances (US-003, US-005) sont mergées ; deux stories en zone sensible (US-077, US-076) demandent chacune deux revues et la porte 3.

## Sprint Review
À venir.

## Rétrospective
À venir.

## Vélocité
Planifié : 13 pts · Done : 0 pt
