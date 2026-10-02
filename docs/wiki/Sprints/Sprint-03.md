# Sprint 03 — Un projet Claude Code existant fait l'aller-retour Cadre → Claude Code sans perte (porte MVP 0)
Début : 2026-10-01 · Statut : en cours

## Planning (porte 2 déléguée à l'orchestrateur par le PO, 2026-10-01)
| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| US-004 | Importer les skills existantes sans perte | 3 | Done (2026-10-02) | [#15](https://github.com/sudo-suLexitooow/GestionAgent/pull/15) |
| US-008 | Exporter un agent vers Claude Code (zone sensible : porte 3) | 3 | En revue | [#16](https://github.com/sudo-suLexitooow/GestionAgent/pull/16) |
| US-009 | Exporter skills et contextes vers Claude Code, aller-retour sans perte (zone sensible : porte 3) | 3 | À faire | — |
| US-010 | Importer les sous-agents Claude Code existants | 3 | À faire | — |
| US-011 | Dupliquer, renommer et supprimer un agent (zone sensible : porte 3) | 2 | À faire | — |
| US-079 | Message dédié quand un dossier de cadrage est un lien | 1 | À faire | — |

Total : 15 points (vélocité : Sprint 1 11 points, Sprint 2 13 points).

Reporté : SP-03 (machine et projet de référence, 2 points) au Sprint 4, car il dépend de Q-11 (runners GitHub).

## Journal de session
### 2026-10-01
- Fait : Sprint 2 terminé (13/13 points ; US-077 PR #12, US-007 PR #13) ; Sprint Review et rétrospective tenues ([Sprint-02](Sprint-02)) ; Sprint 3 planifié.
- Prévu : US-004, US-008, US-009, US-010, US-011, US-079, en appliquant les actions de la rétrospective 2 : (a) au plus 2 agents simultanés ; (b) consignes « sois économe » dans les prompts ; (c) relance d'une revue courte si un verdict ne vient pas.
- Obstacles : risque de coupure par la limite d'usage de l'API (deux coupures au Sprint 2).
- Sprint Goal atteignable : oui — les dépendances hors sprint sont Done (US-002, US-003, US-005, US-007, US-076, SP-01) ; dépendances internes : US-008 avant US-009, US-010 et US-011, US-004 avant US-009 ; trois stories en zone sensible (US-008, US-009, US-011) demandent chacune deux revues et la porte 3 ; 15 points planifiés pour une vélocité mesurée de 13.

### 2026-10-02
- Fait : US-004 Done (PR #15, merge 18c7071) ; première revue refusée (lien ou dossier illisible sur `.claude/skills` : création du modèle en échec, régression d'US-007, et import de CLAUDE.md caché, régression d'US-003), acceptée en re-revue après correction, CI verte sur Linux, Windows et macOS. Décisions d'import des skills prises par l'orchestrateur sur délégation du PO, consignées dans [Backlog](Backlog) (US-004) ; dette ajoutée en section 10. US-008 en revue (PR #16, zone sensible) : première revue acceptée, corrections en cours, seconde revue à venir.
- Prévu : terminer US-008 (seconde revue, porte 3), puis US-009, US-010, US-011, US-079.
- Obstacles : deux coupures par la limite d'usage (vers 20:15 UTC le 2026-10-01, reprise le 2026-10-02 au matin).
- Sprint Goal atteignable : oui — US-004 Done et US-008 en revue ; 12 points restent à faire ou en cours.

## Sprint Review
À venir.

## Rétrospective
À venir.

## Vélocité
Planifié : 15 pts · Done : 3 pts au 2026-10-02 (US-004)
