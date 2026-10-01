# Sprint 02 — J'enregistre mon cadrage dans .cadre/ depuis l'application, je le retrouve en rouvrant le projet, et je crée mon premier agent
Début : 2026-10-01 · Statut : terminé (2026-10-01)

## Planning (porte 2 déléguée à l'orchestrateur par le PO, 2026-10-01)
| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| US-077 | Enregistrer le cadrage depuis l'interface (zone sensible : porte 3) | 3 | Done (2026-10-01) | [#12](https://github.com/sudo-suLexitooow/GestionAgent/pull/12) |
| US-006 | Rouvrir un projet depuis `.cadre/` | 3 | Done (2026-10-01) | [#10](https://github.com/sudo-suLexitooow/GestionAgent/pull/10) |
| US-007 | Créer un agent (rôle, description, outil cible) | 2 | Done (2026-10-01) | [#13](https://github.com/sudo-suLexitooow/GestionAgent/pull/13) |
| US-076 | Aligner les commandes de lecture sur la racine du projet ouvert (zone sensible : porte 3) | 2 | Done (2026-10-01) | [#9](https://github.com/sudo-suLexitooow/GestionAgent/pull/9) |
| SP-02 | Spike : relevé de ce que Claude Code applique réellement | 3 | Done (2026-10-01) → [ADR-003](ADR-003-capacites-claude-code) | — |

Total : 13 points (vélocité du Sprint 1 : 11 points).

Ajouts au planning issus de la Sprint Review 1 : AC-006-6 et AC-077-4 (un dossier `.cadre/` sans `cadre.yaml` n'est pas un modèle : l'import est proposé ; voir [ADR-001](ADR-001-format-cadre-v1)).

## Journal de session
### 2026-10-01
- Fait : Sprint 1 terminé (11/11 points, US-005 mergée PR #4) ; Sprint Review et rétrospective tenues ([Sprint-01](Sprint-01)) ; Sprint 2 planifié.
- Prévu : SP-02, US-077, US-006, US-007, US-076, en appliquant les actions de la rétrospective 1 : checklist « sécurité fichiers » dans le brief des développeurs ; pas de stories parallèles touchant `lib.rs` / `Cargo.toml`, merge de `main` dans la branche avant revue ; cible cargo partagée `/home/user/.cargo-target-cadre` et nettoyage des worktrees ; relance du PO pour le wiki GitHub.
- Obstacles : publication du wiki GitHub en échec tant que le PO n'a pas créé la première page (non bloquant pour le code).
- Sprint Goal atteignable : oui — les dépendances (US-003, US-005) sont mergées ; deux stories en zone sensible (US-077, US-076) demandent chacune deux revues et la porte 3.

### 2026-10-01 (suite)
- Fait :
  - SP-02 Done (3 pts) : [ADR-003](ADR-003-capacites-claude-code). Permissions Claude Code par session, pas par sous-agent : Cadre lancera un processus par agent avec son propre `--settings`. Tout reste « non garanti » tant que les tests d'intégration réels (US-017/US-020) ne sont pas verts.
  - US-076 mergée (PR #9, merge `104406c`). Zone sensible : deux revues `relecteur` indépendantes ACCEPTÉ. Décision orchestrateur : aucun lien suivi en lecture, même interne ; trois assertions d'US-002 modifiées en conséquence, présentées au PO. Correction du texte de PR : la preuve RED du test d'architecture a été écrite après le code. Risque résiduel : voir [Backlog](Backlog), US-076.
  - US-006 mergée (PR #10, merge `b023a5b`). Revue : changements demandés (alias YAML en masse, rejets muets, contextes en erreur), corrigés, puis ACCEPTÉ. Détection à trois états `modele` / `aucun` / `incomplet` (décision orchestrateur, présentée au PO) ; AC-006-5 et AC-006-6 reformulés.
  - Nouvelle story US-079 (1 pt, MVP 0) ; AC-077-5 ajouté à US-077 ; dette ajoutée (voir [Backlog](Backlog), section 10).
- Prévu : terminer US-077 (zone sensible, porte 3), puis US-007.
- Obstacles : la limite d'usage de l'API a interrompu les agents vers 11:00 UTC ; reprise à 12:12 UTC sans perte grâce aux commits. Publication du wiki GitHub toujours en attente de la première page (non bloquant pour le code). Question [Q-23](Questions-PO) ouverte, non bloquante pour ce sprint.
- Sprint Goal atteignable : oui — 8/13 points Done ; restent US-077 (en développement) et US-007 (à faire), sans dépendance bloquante.

### 2026-10-01 (fin de sprint)
- Fait :
  - US-077 mergée (PR #12, merge `4ed19c7`). Zone sensible : deux revues `relecteur` indépendantes ACCEPTÉ, puis retouches confirmées (test nommé AC-077-5 ; bouton jamais bloqué après une exception, test RED puis `try/finally`). Décisions et risque résiduel : voir [Backlog](Backlog), US-077.
  - US-007 mergée (PR #13, merge `1f770a8`). Revue : changements demandés (impasse sur `AGENT_EXISTANT`), corrigés, relecture du correctif ACCEPTÉ. Décisions et dette : voir [Backlog](Backlog), US-007.
  - AC-006-5 élargi : un `cadre.yaml` invalide (YAML cassé, schéma, encodage, lien, alias en masse) donne aussi un modèle incomplet (alignement du texte sur les tests mergés en PR #10).
- Obstacles : deux coupures de la limite d'usage de l'API (≈ 11:00 et ≈ 13:30 UTC), agents en cours interrompus ; reprise sans perte grâce aux commits fréquents. Un relecteur n'a pas rendu son verdict : relancé.
- Sprint Goal atteint : oui — 13/13 points.

## Sprint Review
- Ce que l'utilisateur peut maintenant faire : ouvrir un projet, importer CLAUDE.md / AGENTS.md, créer un agent, enregistrer le tout dans `.cadre/` et le retrouver en rouvrant le projet.
- Décision : porte 4 déléguée à l'orchestrateur ; SP-02, US-076, US-006, US-077, US-007 acceptées par l'orchestrateur.
- Points présentés au PO : 8 tests d'US-005 modifiés (libellés d'erreur déplacés vers `src/ui/i18n`) ; 3 assertions d'US-002 modifiées (aucun lien suivi) ; les skills partagées par lien ne sont plus lues ; détection du modèle à trois états (`modele` / `aucun` / `incomplet`) ; course `MODELE_EXISTANT` hors verrou (risque résiduel d'US-077).
- Retours → nouvelles entrées backlog : dette d'US-077 et d'US-007 ajoutée ([Backlog](Backlog), section 10).

## Rétrospective
- Ce qui a bien marché : la checklist « sécurité fichiers » a été efficace (US-077 et US-076 acceptées sans faille relevant de la checklist, contre 4 tours de revue pour US-005) ; reprise sans perte après deux coupures de la limite d'usage grâce aux commits fréquents.
- Ce qui a mal marché : deux coupures de la limite d'usage de l'API (≈ 11:00 et ≈ 13:30 UTC) ont tué des agents en cours ; un relecteur n'a pas rendu son verdict (relancé) ; DoD « wiki à jour » faite après le merge plutôt que dans la PR de la story.
- Actions (responsable → vérification au Sprint 3) :
  - (a) Limiter à 2 agents simultanés pour réduire le risque de limite d'usage — orchestrateur → nombre de coupures au Sprint 3.
  - (b) Consignes « sois économe » dans les prompts des agents — orchestrateur → nombre de coupures au Sprint 3.
  - (c) Relancer une revue courte si un verdict ne vient pas — orchestrateur → fait au Sprint 2.

## Vélocité
Planifié : 13 pts · Done : 13 pts (SP-02 3, US-076 2, US-006 3, US-077 3, US-007 2)
