# Product Backlog — Cadre

Version : 2026-10-01 · Auteur : analyste-backlog · Mis à jour le 2026-10-01 par scribe-wiki (porte 1 ; puis merges US-001/002/003/005, ajout US-076, US-077 et section Dette ; Sprint Review 1 : AC-006-6 et AC-077-4 ; Sprint 2 planifié ; 2026-10-01 : SP-02, US-076, US-006 Done, US-079 et AC-077-5 ajoutés, AC-006-5/6 reformulés, dette complétée).

**Statut : validé par le PO le 2026-10-01 (porte 1), tel quel.** Options par défaut Q-01 à Q-22 acceptées par délégation : les stories auparavant « Bloquée (Q-xx) » sont « À faire ». SP-03 suit l'option Q-11 (runners GitHub).

Source : [Cahier des charges](Cahier-des-charges). Questions ouvertes : [Questions-PO](Questions-PO). Traçabilité : [Tracabilite](Tracabilite).

> Sprint 1 terminé le 2026-10-01 (11/11 points) : voir [Sprint-01](Sprint-01). Sprint 2 planifié le 2026-10-01 : voir [Sprint-02](Sprint-02).

## Sommaire

1. [Analyse des exigences](#1-analyse-des-exigences)
2. [Story de référence et échelle](#2-story-de-référence-et-échelle)
3. [Backlog priorisé](#3-backlog-priorisé)
4. [Spikes](#4-spikes)
5. [Détail des stories — MVP 0](#5-détail-des-stories--mvp-0)
6. [Détail des stories — MVP 1 Must](#6-détail-des-stories--mvp-1-must)
7. [Détail des stories — MVP 1 Should](#7-détail-des-stories--mvp-1-should)
8. [Exigences non fonctionnelles transverses](#8-exigences-non-fonctionnelles-transverses)
9. [Proposition de découpage en sprints](#9-proposition-de-découpage-en-sprints)
10. [Dette technique](#10-dette-technique)

---

## 1. Analyse des exigences

| Classe | Exigences |
| --- | --- |
| Fonctionnalité | PRJ-01 à PRJ-08, SKL-01 à SKL-08, CTX-01 à CTX-04, AGT-01 à AGT-10, ADP-03 à ADP-06, RUN-01 à RUN-10, CLI-01 à CLI-03, VAL-01 à VAL-05, GIT-01, GIT-02, ACC-02 à ACC-05 |
| Contrainte technique | ADP-01 (interface commune d'adaptateur), ADP-02 (formats Claude Code), §7 (Tauri 2, TS pour le métier, Rust pour le système, git2, schémas JSON), §7.4 (format `.cadre/`), NF-05, NF-06, NF-08, NF-09, NF-19 |
| Contrainte métier | ACC-01 (sans compte), RUN-03 (pas d'exécution sans Git), RUN-08 (un agent à la fois), NF-07 (aucun envoi vers les serveurs de Cadre), NF-10 (pas d'exécution sans action explicite), NF-11 (n'afficher « garanti » que si l'outil cible l'applique), §3.3 (configuration et surveillance, pas de blocage propre), §10 (CLI officielles uniquement, sans contournement), GIT-03 (hors périmètre) |
| Non fonctionnelle | NF-01 à NF-04 (performance), NF-12 à NF-14 (fiabilité), NF-15 à NF-17 (ergonomie, accessibilité, i18n), NF-18 (maintenabilité), indicateur « plantages < 0,1 % » |
| Critère d'acceptation (produit) | §13.1 (recette MVP), §2 (« 100 % du jeu de tests de dérive signalé », « 2 fois plus rapide ») |

**Réponse à la question de l'analyste** : Cadre doit permettre de cadrer des agents IA dans un modèle unique (`.cadre/`), de l'exporter vers Claude Code en indiquant honnêtement ce qui est garanti, de lancer un agent dans un worktree isolé et de voir, signaler et annuler tout ce qu'il a modifié hors de sa portée. On saura que c'est correctement fait quand : l'import/export d'un projet existant est sans perte, le jeu de tests de dérive (création, modification, suppression, renommage hors portée) est signalé à 100 %, un rejet laisse le dépôt principal identique à l'état de départ, et un arrêt ne laisse aucun processus.

---

## 2. Story de référence et échelle

**Story de référence (2 points) : US-002 — Lister les skills du projet.** Lecture d'un dossier connu (`.claude/skills/*/SKILL.md`), analyse d'un en-tête YAML, affichage d'une liste, gestion d'un cas d'erreur (en-tête invalide). Pas de zone sensible, pas d'inconnue technique.

- 1 point : nettement plus simple (une vue dérivée de données déjà disponibles).
- 3 points : un peu plus de règles, de cas d'erreur ou d'interactions avec le système.
- 5 points : plusieurs règles imbriquées, zone sensible avec tests renforcés multiplateformes, ou forte incertitude résiduelle.

Les spikes sont estimés en points uniquement pour la capacité du sprint ; leur livrable est un ADR, pas du code de production.

---

## 3. Backlog priorisé

Ordre = valeur + réduction du risque, en fermant d'abord la boucle centrale : **cadrer → générer → lancer → voir les changements → détecter une violation → restaurer**. Les stories `~N` sont des estimations grossières, à affiner.

| Ordre | ID | Titre | Étape | Points | Statut | Exigences | Zone sensible |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SP-01 | Spike : format `.cadre/` (schéma YAML, versionnage) | MVP 0 | 2 | Done (Sprint 1, 2026-10-01) | §7.4, PRJ-02, NF-12 | non |
| 2 | US-001 | Ouvrir un dossier de projet | MVP 0 | 2 | Done (Sprint 1, PR #3, 2026-10-01) | PRJ-01, ACC-01 | non |
| 3 | US-002 | Lister les skills du projet (**référence**) | MVP 0 | 2 | Done (Sprint 1, PR #5, 2026-10-01) | SKL-01, PRJ-02 | non |
| 4 | US-003 | Importer CLAUDE.md et AGENTS.md comme contextes | MVP 0 | 2 | Done (Sprint 1, PR #6, 2026-10-01) | PRJ-02, ADP-02 | non |
| 5 | US-005 | Enregistrer le modèle `.cadre/` de façon atomique | MVP 0 | 3 | Done (Sprint 1, PR #4, 2026-10-01) | §7.4, NF-12, NF-13 | **oui** (écritures atomiques) |
| 6 | US-004 | Importer les skills existantes sans perte | MVP 0 | 3 | À faire | PRJ-02, ADP-01, ADP-02 | non |
| 7 | SP-02 | Spike : relevé de ce que Claude Code applique réellement | MVP 0 | 3 | Done (Sprint 2, 2026-10-01, [ADR-003](ADR-003-capacites-claude-code)) | AGT-06, AGT-07, ADP-05, NF-11, §13.2 | non |
| 8 | US-006 | Rouvrir un projet depuis `.cadre/` | MVP 0 | 3 | Done (Sprint 2, PR #10, 2026-10-01) | §7.4, PRJ-02 | non |
| 9 | US-007 | Créer un agent (rôle, description, outil cible) | MVP 0 | 2 | Sprint 2 (À faire) | AGT-01, AGT-02 | non |
| 10 | US-008 | Exporter un agent vers Claude Code | MVP 0 | 3 | À faire | ADP-01, ADP-02, NF-12, NF-19 | **oui** (écritures atomiques) |
| 11 | US-009 | Exporter skills et contextes vers Claude Code, aller-retour sans perte | MVP 0 | 3 | À faire | ADP-02, PRJ-02, NF-12 | **oui** (écritures atomiques, fichiers de l'utilisateur) |
| 12 | US-010 | Importer les sous-agents Claude Code existants | MVP 0 | 3 | À faire | PRJ-02, ADP-02 | non |
| 13 | US-011 | Dupliquer, renommer et supprimer un agent | MVP 0 | 2 | À faire | AGT-01 | **oui** (suppression de fichiers générés) |
| 14 | US-076 | Aligner les commandes de lecture sur la racine du projet ouvert | MVP 0 | 2 | Done (Sprint 2, PR #9, 2026-10-01) | SKL-01, PRJ-02 (proposées) | **oui** (portée) |
| 15 | US-077 | Enregistrer le cadrage depuis l'interface | MVP 0 | 3 | Sprint 2 (en développement) | §7.4, NF-12, PRJ-02 (proposées) | **oui** (écritures atomiques) |
| 15b | US-079 | Message dédié quand `.claude`, `.claude/skills` ou `.cadre` est un lien | MVP 0 | 1 | À faire | SKL-01, PRJ-02 (proposées) | non |
| 16 | SP-03 | Spike : machine et projet de référence | MVP 0 | 2 | À faire | NF-04, NF-01 à NF-03 | non |
| 17 | US-012 | Attacher et détacher des skills à un agent | MVP 1 | 2 | À faire | AGT-05 | non |
| 18 | US-013 | Déclarer la portée d'un agent par dossier | MVP 1 | 3 | À faire | AGT-07 | **oui** (portée des agents) |
| 19 | US-014 | Exporter la portée vers Claude Code avec son niveau de garantie | MVP 1 | 3 | À faire | AGT-07, ADP-02, ADP-05, NF-11 | **oui** (permissions, portée) |
| 20 | US-015 | Déclarer les outils autorisés d'un agent | MVP 1 | 2 | À faire | AGT-06 | **oui** (permissions) |
| 21 | US-016 | Exporter les outils autorisés avec leur niveau de garantie | MVP 1 | 3 | À faire | AGT-06, ADP-02, ADP-05, NF-11 | **oui** (permissions) |
| 22 | US-017 | Détecter Claude Code et sa version | MVP 1 | 3 | À faire | CLI-01, CLI-03, NF-06 | non |
| 23 | SP-06 | Spike : worktree, diff et application au dépôt avec git2 | MVP 1 | 3 | À faire | RUN-03, RUN-04, RUN-05 | **oui** (worktrees) |
| 24 | SP-05 | Spike : pseudo-terminal et arbre de processus Windows/macOS | MVP 1 | 3 | À faire | RUN-01, RUN-02, RUN-06 | **oui** (processus) |
| 25 | US-019 | Créer un worktree Git dédié pour une exécution | MVP 1 | 3 | À faire | RUN-03 | **oui** (worktrees) |
| 26 | US-020 | Lancer un agent sur une tâche avec son cadrage | MVP 1 | 3 | À faire | RUN-01, NF-07, NF-10 | **oui** (processus) |
| 27 | US-021 | Suivre la sortie de l'agent dans un terminal intégré | MVP 1 | 3 | À faire | RUN-02 | non |
| 28 | US-022 | Un seul agent à la fois par projet (verrou) | MVP 1 | 2 | À faire | RUN-08 | **oui** (gestion des processus) |
| 29 | US-023 | Lister les changements d'une exécution | MVP 1 | 3 | À faire | RUN-04 | non |
| 30 | US-024 | Afficher le diff d'un fichier changé | MVP 1 | 2 | À faire | RUN-04 | non |
| 31 | US-025 | Signaler les changements hors portée | MVP 1 | 3 | À faire | RUN-05, AGT-07 | **oui** (portée des agents) |
| 32 | US-026 | Rejeter toute une exécution | MVP 1 | 3 | À faire | RUN-05 | **oui** (worktrees) |
| 33 | US-027 | Accepter toute une exécution | MVP 1 | 5 | À faire | RUN-05 | **oui** (worktrees, écritures) |
| 34 | US-028 | Accepter ou rejeter fichier par fichier | MVP 1 | 3 | À faire | RUN-05 | **oui** (worktrees, écritures) |
| 35 | US-029 | Arrêter l'agent et tous ses processus | MVP 1 | 5 | À faire | RUN-06 | **oui** (arrêt des processus) |
| 36 | US-030 | Fermer l'app pendant une exécution | MVP 1 | 3 | À faire | RUN-07 | **oui** (arrêt des processus) |
| 37 | US-018 | Guider l'utilisateur quand Claude Code est absent | MVP 1 | 2 | À faire | CLI-02, ACC-03 | non |
| 38 | US-039 | Afficher le niveau de support de chaque réglage | MVP 1 | 2 | À faire | ADP-05, NF-11 | **oui** (permissions affichées) |
| 39 | US-040 | Aperçu du cadrage final de l'agent | MVP 1 | 3 | À faire | AGT-08 | non |
| 40 | SP-04 | Spike : spécification Agent Skills pour le validateur | MVP 1 | 2 | À faire (doit confirmer les règles de skills d'ADR-001) | SKL-05 | non |
| 41 | US-031 | Créer, renommer, dupliquer et supprimer une skill | MVP 1 | 3 | À faire | SKL-02 | non |
| 42 | US-032 | Éditer une skill (formulaire + Markdown) | MVP 1 | 3 | À faire | SKL-03 | non |
| 43 | US-033 | Valider une skill selon la spécification Agent Skills | MVP 1 | 3 | À faire | SKL-05 | non |
| 44 | US-034 | Voir les agents qui utilisent une skill | MVP 1 | 1 | À faire | SKL-08 | non |
| 45 | US-035 | Éditer les fichiers de contexte | MVP 1 | 3 | À faire | CTX-01 | non |
| 46 | US-036 | Lier un contexte à des agents | MVP 1 | 2 | À faire | CTX-03 | non |
| 47 | US-041 | Panneau Santé du cadrage | MVP 1 | 3 | À faire | VAL-01 | non |
| 48 | US-042 | Détecter les skills sans description, inutilisées ou en double | MVP 1 | 3 | À faire | VAL-02 | non |
| 49 | US-043 | Détecter les contradictions de portée | MVP 1 | 3 | À faire | VAL-03 | non |
| 50 | US-044 | Carte agents × skills | MVP 1 | 3 | À faire | VAL-04 | non |
| 51 | US-037 | Paramètres libres d'un agent | MVP 1 | 2 | À faire | AGT-03 | non |
| 52 | US-038 | Paramètres prédéfinis d'un agent | MVP 1 | 3 | À faire | AGT-04 | non |
| 53 | US-046 | Arborescence du projet | MVP 1 | 3 | À faire | PRJ-05 | non |
| 54 | US-045 | Projets récents avec leur état de cadrage | MVP 1 | 2 | À faire | PRJ-04 | non |
| 55 | US-049 | Branche courante et fichiers de cadrage modifiés | MVP 1 | 2 | À faire | GIT-01 | non |
| 56 | SP-07 | Spike : surveillance du dossier, écritures de Cadre vs externes | MVP 1 | 2 | À faire | PRJ-07, PRJ-08 | non |
| 57 | US-047 | Recharger le cadrage modifié hors de l'app | MVP 1 | 5 | À faire | PRJ-07 | **oui** (fichiers modifiés par l'utilisateur) |
| 58 | US-048 | Résoudre un conflit entre Cadre et l'extérieur | MVP 1 | 3 | À faire | PRJ-08 | **oui** (écritures, fichiers de l'utilisateur) |
| 59 | US-051 | Annuler la dernière écriture d'un fichier de cadrage | MVP 1 | 2 | À faire | NF-13 | **oui** (écritures atomiques) |
| 60 | US-050 | Réglages : éditeur externe, chemins des CLI, thème, langue | MVP 1 | 3 | À faire | ACC-03, NF-17 | non |
| 61 | US-052 | Installer la bêta signée sur Windows et macOS | MVP 1 | 3 | À faire | NF-05, NF-09 | **oui** (signature) |
| 62 | US-053 | Historique des exécutions | MVP 1 (Should) | 3 | À faire | RUN-09 | non |
| 63 | US-054 | Prévisualiser le diff avant d'écrire les fichiers générés | MVP 1 (Should) | 3 | À faire | ADP-06 | non |
| 64 | US-055 | Exporter vers le format générique (SKILL.md, AGENTS.md) | MVP 1 (Should) | 3 | À faire | ADP-03, NF-19 | **oui** (écritures atomiques) |
| 65 | US-056 | Gérer les fichiers annexes d'une skill | MVP 1 (Should) | 3 | À faire | SKL-04 | non |
| 66 | US-057 | Estimer la taille du contexte envoyé à l'IA | MVP 1 (Should) | 2 | À faire | CTX-04 | non |
| 67 | US-058 | Ouvrir un fichier dans l'éditeur externe | MVP 1 (Should) | 1 | À faire | PRJ-06 | non |
| 68 | US-059 | Assistant de rédaction du contexte par sections | MVP 1 (Should) | 3 | À faire | CTX-02 | non |
| 69 | US-060 | Mise à jour automatique signée | MVP 1 (Should) | 5 | À faire | ACC-04, NF-09 | **oui** (signature et mise à jour) |
| 70 | US-061 | Importer un projet Codex | MVP 2 | ~5 | À affiner | ADP-04 | non |
| 71 | US-062 | Exporter vers Codex avec niveaux de garantie | MVP 2 | ~5 | À affiner | ADP-04, NF-11 | **oui** (permissions) |
| 72 | US-063 | Vue comparée des capacités par outil | MVP 2 | ~3 | À affiner | ADP-05, §4.3 | non |
| 73 | US-064 | Bibliothèque personnelle de skills | MVP 2 | ~5 | À affiner | SKL-06 | non |
| 74 | US-065 | Modèles d'agents prêts à l'emploi | MVP 2 | ~3 | À affiner | AGT-09 | non |
| 75 | US-066 | Créer un projet à partir d'un modèle de cadrage | MVP 2 | ~3 | À affiner | PRJ-03 | non |
| 76 | US-067 | Commit assisté des fichiers de cadrage | MVP 2 | ~3 | À affiner | GIT-02 | non |
| 77 | US-068 | Comptes, offre Pro et paiement | V1 | > 5, à découper | À affiner | ACC-02, NF-08 | **oui** (paiement, stockage des clés) |
| 78 | US-069 | Statistiques d'usage anonymes opt-in | V1 | ~3 | À affiner | ACC-05, NF-07 | non |
| 79 | US-070 | Support Linux (Ubuntu 22.04+) | V1 | ~5 | À affiner | NF-05 | **oui** (processus, worktrees sur un nouvel OS) |
| 80 | US-071 | Documentation complète | V1 | ~3 | À affiner | §4.4, NF-15 | non |
| 81 | US-072 | Importer une skill depuis un dépôt Git public ou une archive | Future | ~3 | À affiner | SKL-07 | non |
| 82 | US-073 | Comparer deux agents côte à côte | Future | ~2 | À affiner | AGT-10 | non |
| 83 | US-074 | Suggestions d'amélioration générées par IA | Future | ~5 | À affiner | VAL-05 | non |
| 84 | US-075 | Plusieurs agents en parallèle | Future | > 5, à découper | À affiner | RUN-10 | **oui** (processus, worktrees) |

### Totaux

| Étape | Stories | Points stories | Spikes | Total |
| --- | --- | --- | --- | --- |
| MVP 0 | 14 (US-001 à US-011, US-076, US-077, US-079) | 34 | 3 (SP-01 à SP-03) = 7 | 41 |
| MVP 1 Must | 41 (US-012 à US-052) | 116 | 4 (SP-04 à SP-07) = 10 | 126 |
| MVP 1 Should | 8 (US-053 à US-060) | 23 | — | 23 |
| MVP 2 | 7 (US-061 à US-067) | ~27 | — | ~27 |
| V1 commerciale | 4 (US-068 à US-071) | ~19 (US-068 > 5, à découper) | — | ~19+ |
| Future | 4 (US-072 à US-075) | ~13+ | — | ~13+ |

---

## 4. Spikes

Un spike a une durée limitée (au plus la moitié d'un sprint) et produit **une décision documentée** (`Decisions/ADR-NNN-...`), jamais du code de production. Le code jetable éventuel reste sur une branche `spike/sujet` non fusionnée.

### SP-01 — Format `.cadre/` (schéma YAML et versionnage)
- Question : quel schéma exact pour `cadre.yaml`, `agents/*.yaml`, `skills/`, `contexte/` ; comment `schema_version` et `generator_version` sont écrits, comparés et migrés ; quels identifiants stables (nom vs identifiant interne) pour permettre le renommage ; comment marquer un fichier exporté comme « généré par Cadre ».
- Livrable : ADR « Format .cadre/ v1 » + schémas JSON (YAML → JSON) cités dans l'ADR + exemples de projet valides et invalides servant de jeu de tests.
- Débloque : US-004, US-005, US-006, US-007, US-008. Exigences : §7.4, PRJ-02, NF-12. Estimation : 2.
- **Statut : Done (2026-10-01)** — livrable : [ADR-001 — Format .cadre/ v1](ADR-001-format-cadre-v1). Conséquence : AC-005-2 étendu. Spécification Agent Skills non joignable pendant le spike : règles des skills à confirmer par SP-04.

### SP-02 — Relevé de ce que Claude Code applique réellement (point en suspens 13.2)
- Question : pour chaque réglage de Cadre (portée écriture / lecture seule / interdit par dossier, outils terminal / navigateur / paquets / réseau, paramètres prédéfinis), quel mécanisme natif de Claude Code existe (`settings.json` permissions allow/deny, sous-agents `.claude/agents/` et leur champ outils, sandbox, mode de permission), et le support est-il **exact, approximatif ou absent** ? Comment la CLI est-elle lancée de façon non ambiguë avec ce cadrage (options de ligne de commande, répertoire de travail) ? Quelles versions sont testées ?
- Méthode : expériences reproductibles par réglage, résultats consignés dans un tableau « réglage → mécanisme → niveau → preuve ».
- Livrable : ADR « Capacités de l'adaptateur Claude Code » + tableau de capacités + liste des versions testées.
- Débloque : US-014, US-016, US-017, US-020, US-038, US-039. Exigences : AGT-06, AGT-07, ADP-05, NF-06, NF-11. Estimation : 3.
- **Statut : Done (2026-10-01)** — livrable : [ADR-003 — Capacités de l'adaptateur Claude Code](ADR-003-capacites-claude-code). Points clés :
  - les permissions Claude Code sont par session et non par sous-agent : Cadre lance un processus par agent avec un `--settings` propre ;
  - tout reste « non garanti » tant que les tests d'intégration réels (US-017/US-020) ne sont pas verts ;
  - question ouverte pour le PO : [Q-23](Questions-PO) (clé d'API Anthropic en secret de CI pour ces tests).

### SP-03 — Machine et projet de référence (NF-04)
- Question : quelle machine de référence par OS (matériel ou runner CI), quel projet de référence (10 000 fichiers, 500 Mo, 200 fichiers de cadrage : généré par script, reproductible), comment mesurer automatiquement NF-01 (démarrage), NF-02 (ouverture), NF-03 (mémoire au repos) à chaque version.
- Livrable : ADR « Référence de performance » + générateur du projet de référence décrit + protocole de mesure. Nécessite une réponse du PO (Q-11).
- Débloque : mesures NF-01 à NF-03, livrable de la porte MVP 0 (§11.1). Estimation : 2.

### SP-04 — Spécification Agent Skills pour le validateur
- Question : quelle version de la spécification Agent Skills fait foi ; quelles règles (champs obligatoires de l'en-tête, contraintes sur `name` et `description`, longueurs, structure du dossier, fichiers annexes) sont des erreurs ou des avertissements ; quelles différences avec ce que Claude Code accepte réellement.
- Livrable : ADR « Règles de validation des skills » + liste numérotée des règles (chacune deviendra un test) + exemples valides/invalides.
- Débloque : US-033, US-042. Exigence : SKL-05. Estimation : 2.

### SP-05 — Pseudo-terminal et arbre de processus sur Windows et macOS
- Question : comment lancer la CLI dans un pseudo-terminal côté Rust (ConPTY sous Windows, PTY sous macOS), relayer la sortie vers xterm.js, et arrêter **tout l'arbre** de processus (groupe de processus / job object), d'abord proprement puis de force ; comment prouver en CI qu'aucun processus ne survit.
- Livrable : ADR « Exécution et arrêt des processus » + stratégie de test multiplateforme.
- Débloque : US-020, US-021, US-029, US-030. Exigences : RUN-01, RUN-02, RUN-06, RUN-07. Estimation : 3.

### SP-06 — Worktree, diff et application au dépôt principal avec git2
- Question : création/suppression d'un worktree et d'une branche dédiés avec git2 ; état de départ de référence quand le dépôt principal a des modifications non commitées ; détection fiable des renommages ; comment appliquer les changements acceptés (tout ou fichier par fichier) au dépôt principal sans toucher aux modifications en cours de l'utilisateur ; nettoyage d'un worktree orphelin après plantage.
- Livrable : ADR « Cycle de vie d'une exécution dans un worktree » + cas de test de référence (création, modification, suppression, renommage, dans et hors portée). Nécessite Q-05.
- Débloque : US-019, US-023, US-025 à US-028. Estimation : 3.

### SP-07 — Surveillance du dossier, écritures de Cadre vs externes
- Question : bibliothèque de surveillance côté Rust, regroupement des événements, comment reconnaître une écriture faite par Cadre (empreinte du contenu écrit, fenêtre temporelle) pour ne pas la recharger, comportement sur les gros projets (NF-02).
- Livrable : ADR « Surveillance du dossier ». Débloque : US-047, US-048. Estimation : 2.

---

## 5. Détail des stories — MVP 0

Les étiquettes `[EXIGENCE]` sur chaque critère servent à la traçabilité. Chaque critère deviendra au moins un test nommé avec son ID (ex. `test_ac_001_2_...`).

### US-001 — Ouvrir un dossier de projet
En tant que développeur solo, je veux ouvrir un dossier de projet local via un sélecteur ou un glisser-déposer afin de commencer à cadrer ce projet dans Cadre.
- Étape : MVP 0 · Estimation : 2 points · Dépendances : aucune · Zone sensible : non
- Exigences : PRJ-01, ACC-01
- Done le 2026-10-01 (PR #3).

Critères d'acceptation :
- AC-001-1 [PRJ-01] : Étant donné l'écran d'accueil, quand l'utilisateur choisit un dossier existant dans le sélecteur, alors l'écran principal s'affiche avec le nom et le chemin du projet.
- AC-001-2 [PRJ-01] : Étant donné l'écran d'accueil, quand l'utilisateur dépose un dossier dans la fenêtre, alors le projet s'ouvre comme avec le sélecteur.
- AC-001-3 [PRJ-01] : Étant donné l'écran d'accueil, quand l'utilisateur dépose un fichier (pas un dossier) ou plusieurs dossiers, alors rien ne s'ouvre et un message explique qu'il faut déposer un seul dossier.
- AC-001-4 [PRJ-01] : Étant donné un dossier inexistant ou illisible (droits insuffisants), quand l'utilisateur tente de l'ouvrir, alors un message d'erreur clair s'affiche et l'app reste sur l'accueil sans planter.
- AC-001-5 [PRJ-01] : Étant donné le sélecteur ouvert, quand l'utilisateur annule, alors l'app reste sur l'accueil sans message d'erreur.
- AC-001-6 [ACC-01] : Étant donné une installation neuve sans connexion réseau, quand l'utilisateur ouvre un dossier, alors aucune création de compte ni connexion n'est demandée.

### US-002 — Lister les skills du projet (story de référence, 2 points)
En tant que développeur solo, je veux voir la liste des skills présentes dans mon projet afin de savoir de quelles capacités disposent mes agents.
- Étape : MVP 0 · Estimation : 2 points · Dépendances : US-001 · Zone sensible : non
- Exigences : SKL-01, PRJ-02
- Done le 2026-10-01 (PR #5). Décisions d'implémentation : lecture plafonnée à 8 Mio (motif `too-large`) ; commandes de lecture async ; liens suivis en lecture (skills partagées ; **remplacé le 2026-10-01 par US-076 : aucun lien suivi**) ; un fichier `.claude/skills` ou `.cadre` est traité comme absent (décision orchestrateur).

Critères d'acceptation :
- AC-002-1 [SKL-01] : Étant donné un projet contenant `.claude/skills/a/SKILL.md` et `.claude/skills/b/SKILL.md` avec un en-tête valide, quand le projet est ouvert, alors la liste affiche les skills `a` et `b` avec leur nom et leur description.
- AC-002-2 [SKL-01] : Étant donné un projet sans dossier `.claude/skills/`, quand il est ouvert, alors la liste est vide et indique « aucune skill détectée », sans erreur.
- AC-002-3 [SKL-01] : Étant donné une skill dont l'en-tête YAML est invalide, quand le projet est ouvert, alors la skill apparaît marquée « en erreur » avec la raison, et les autres skills sont listées normalement.
- AC-002-4 [SKL-01] : Étant donné un sous-dossier de `.claude/skills/` sans fichier `SKILL.md`, quand le projet est ouvert, alors il n'est pas listé comme skill.
- AC-002-5 [PRJ-02] : Étant donné un projet qui possède déjà un modèle `.cadre/`, quand il est ouvert, alors la liste affiche les skills du modèle (et non une seconde copie de celles de `.claude/skills/`).

### US-003 — Importer CLAUDE.md et AGENTS.md comme contextes
En tant que développeur qui code déjà avec Claude Code, je veux que Cadre détecte mes fichiers CLAUDE.md et AGENTS.md et me propose de les importer afin de ne pas repartir de zéro.
- Étape : MVP 0 · Estimation : 2 points · Dépendances : US-001, SP-01 · Zone sensible : non
- Exigences : PRJ-02, ADP-02
- Note : le traitement complet du format générique (AGENTS.md en export) relève d'US-055 ; voir Q-04.
- Done le 2026-10-01 (PR #6). Livrée sans écriture : modèle en mémoire, affiché « Non enregistré » (US-005 pas encore mergée ; enregistrement → US-077). Un CLAUDE.md non UTF-8 est importé tel quel avec un avertissement.

Critères d'acceptation :
- AC-003-1 [PRJ-02] : Étant donné un projet sans `.cadre/` contenant `CLAUDE.md` à la racine, quand il est ouvert, alors Cadre propose l'import en listant les fichiers détectés.
- AC-003-2 [PRJ-02] : Étant donné que l'utilisateur accepte l'import, quand l'import se termine, alors le modèle contient un contexte par fichier détecté (CLAUDE.md, AGENTS.md) dont le contenu est identique octet pour octet au fichier source (encodage et fins de ligne compris).
- AC-003-3 [PRJ-02] : Étant donné que l'utilisateur refuse l'import, quand il continue, alors aucun fichier n'est créé ni modifié dans le projet.
- AC-003-4 [ADP-02] : Étant donné un `CLAUDE.md` vide ou non UTF-8, quand l'import a lieu, alors un contexte vide est créé pour le premier cas, et un avertissement indique l'encodage non supporté pour le second, sans planter.
- AC-003-5 [PRJ-02] : Étant donné un import réussi, quand il se termine, alors les fichiers d'origine (CLAUDE.md, AGENTS.md) sont inchangés sur le disque.

### US-004 — Importer les skills existantes sans perte
En tant que développeur qui code déjà avec Claude Code, je veux importer mes skills existantes dans le modèle Cadre afin de les gérer au même endroit sans rien perdre.
- Étape : MVP 0 · Estimation : 3 points · Dépendances : US-002, US-005, SP-01 · Zone sensible : non
- Exigences : PRJ-02, ADP-01, ADP-02

Critères d'acceptation :
- AC-004-1 [PRJ-02] : Étant donné une skill avec en-tête, corps et fichiers annexes (sous-dossiers compris), quand elle est importée, alors le modèle contient le même nom, la même description, le même corps et tous les fichiers annexes, identiques octet pour octet.
- AC-004-2 [PRJ-02] : Étant donné un en-tête contenant des champs inconnus de Cadre, quand la skill est importée puis enregistrée, alors ces champs sont conservés.
- AC-004-3 [ADP-02] : Étant donné une skill dont l'en-tête est invalide, quand l'import a lieu, alors elle est importée telle quelle, marquée en erreur, et l'import des autres skills continue.
- AC-004-4 [ADP-01] : Étant donné le cœur de Cadre, quand il importe un projet, alors il passe par l'opération « importer » de l'interface d'adaptateur (vérifié par un test avec un adaptateur factice), sans code propre à Claude Code dans le cœur.
- AC-004-5 [PRJ-02] : Étant donné un projet de 200 skills, quand l'import a lieu, alors aucune skill n'est perdue (comptage avant/après identique).

### US-005 — Enregistrer le modèle `.cadre/` de façon atomique
En tant que développeur solo, je veux que mon cadrage soit enregistré dans `.cadre/` sans jamais pouvoir être corrompu afin de ne pas perdre mon travail en cas de plantage.
- Étape : MVP 0 · Estimation : 3 points · Dépendances : US-001, SP-01 · **Zone sensible : oui (écritures atomiques) → porte 3**
- Exigences : §7.4, NF-12, NF-13
- Done le 2026-10-01 (PR #4, merge `b2ac398`). Zone sensible : 3 tours de deux revues `relecteur` indépendantes (6 revues), toutes deux ACCEPTÉ aux révisions 3 et 4 ; porte 3 tenue par l'orchestrateur (délégation du PO), résumé en langage simple au PO dans le compte rendu de sprint. Risque résiduel : voir [Sprint-01](Sprint-01), Sprint Review. Le système d'enregistrement n'a pas encore de bouton (US-077).
- Décisions orchestrateur : annulation (pas rejeu) à la récupération ; `.gitignore` seulement si projet Git (racine ou parent) ; AC-005-6 accepté au niveau résultat typé (l'affichage viendra avec le bouton Enregistrer, US-077) ; racine tenue côté Rust via `ouvrir_projet`. Écarts au format : voir [ADR-001](ADR-001-format-cadre-v1), section « Écarts constatés ».

Critères d'acceptation :
- AC-005-1 [§7.4] : Étant donné un projet sans `.cadre/`, quand l'utilisateur enregistre, alors `.cadre/cadre.yaml` est créé avec `schema_version`, `generator_version` et les outils actifs, conforme au schéma de SP-01.
- AC-005-2 [§7.4] : Étant donné un projet Git, quand `.cadre/` est créé, alors `.cadre/runs/`, `.cadre/backups/` et `.cadre/tmp/` sont ajoutés au `.gitignore` (créé s'il n'existe pas, sans dupliquer une ligne déjà présente, sans modifier les autres lignes). (modifié le 2026-10-01, ADR-001 : [ADR-001](ADR-001-format-cadre-v1))
- AC-005-3 [NF-12] : Étant donné un enregistrement de plusieurs fichiers, quand l'écriture est interrompue au milieu (erreur simulée après le premier fichier), alors aucun fichier de `.cadre/` n'est modifié : soit tous les nouveaux contenus sont présents, soit aucun.
- AC-005-4 [NF-12] : Étant donné une écriture de fichier, quand elle est interrompue avant le remplacement, alors le fichier d'origine est intact et aucun fichier temporaire ne reste après le prochain démarrage.
- AC-005-5 [NF-13] : Étant donné un fichier de cadrage existant, quand il est réécrit, alors sa version précédente est conservée et récupérable.
- AC-005-6 [NF-12] : Étant donné un disque en lecture seule ou plein (simulé), quand l'utilisateur enregistre, alors un message d'erreur clair s'affiche et les fichiers existants sont inchangés.
- AC-005-7 [NF-05] : Les critères AC-005-3 à AC-005-6 passent en CI sur Windows et macOS.

### US-006 — Rouvrir un projet depuis `.cadre/`
En tant que développeur solo, je veux retrouver mon cadrage en rouvrant un projet afin de reprendre mon travail là où je l'ai laissé.
- Étape : MVP 0 · Estimation : 3 points · Dépendances : US-005 · Zone sensible : non
- Exigences : §7.4, PRJ-02
- Done le 2026-10-01 (PR #10, merge `b023a5b`). Revue `relecteur` : changements demandés (alias YAML en masse, rejets muets, contextes en erreur), corrigés, puis ACCEPTÉ.
- Décisions :
  - détection à trois états (décision orchestrateur, présentée au PO) : `modele` = `.cadre/cadre.yaml` présent ; `aucun` = `.cadre/` absent, ou ne contenant que `tmp/`, `runs/`, `backups/` ; `incomplet` = autre contenu ;
  - interpréteur JSON Schema maison sans `eval`, compatible avec la CSP ;
  - codes d'erreur `YAML_ALIASES` et `YAML_SYNTAX` ;
  - ligne d'erreur YAML = début de la clé fautive (perte de précision acceptée).

Critères d'acceptation :
- AC-006-1 [§7.4] : Étant donné un projet enregistré, quand il est rouvert, alors le modèle chargé est identique à celui enregistré (agents, skills, contextes).
- AC-006-2 [§7.4] : Étant donné un `cadre.yaml` dont la `schema_version` est plus récente que celle supportée, quand le projet est ouvert, alors Cadre refuse de le modifier, l'ouvre en lecture seule et invite à mettre à jour l'app.
- AC-006-3 [§7.4] : Étant donné un fichier `.cadre/agents/x.yaml` invalide (YAML cassé ou non conforme au schéma), quand le projet est ouvert, alors le projet s'ouvre, l'agent est marqué en erreur avec le fichier et la ligne, et rien n'est réécrit automatiquement.
- AC-006-4 [PRJ-02] : Étant donné un projet qui a un `.cadre/` et aussi un `CLAUDE.md`, quand il est ouvert, alors aucun import n'est reproposé et `.cadre/` fait foi.
- AC-006-5 [§7.4] (reformulés le 2026-10-01, décision orchestrateur) : Étant donné un dossier `.cadre/` sans `cadre.yaml` qui contient autre chose que `tmp/`, `runs/` et `backups/` (état `incomplet`), quand le projet est ouvert, alors Cadre signale un modèle incomplet et propose de le réparer, sans rien écrire sans accord, et l'import n'est pas proposé.
- AC-006-6 [§7.4, PRJ-02] (ajouté le 2026-10-01, Sprint Review 1 ; reformulés le 2026-10-01, décision orchestrateur) : Étant donné un projet sans `.cadre/`, ou dont le dossier `.cadre/` ne contient que `tmp/`, `runs/` et/ou `backups/` sans `cadre.yaml` (p. ex. seulement `tmp/verrou`), quand le projet est ouvert, alors ce n'est pas un modèle (état `aucun`) : l'import est proposé. Un modèle = présence de `.cadre/cadre.yaml` ([ADR-001](ADR-001-format-cadre-v1)).

### US-007 — Créer un agent
En tant que développeur solo, je veux créer un agent en lui donnant un nom, un rôle, une description et un outil cible afin de commencer à le cadrer.
- Étape : MVP 0 · Estimation : 2 points · Dépendances : US-005 · Zone sensible : non
- Exigences : AGT-01, AGT-02

Critères d'acceptation :
- AC-007-1 [AGT-01] : Étant donné un projet ouvert, quand l'utilisateur crée un agent avec un nom, un rôle et une description, alors l'agent apparaît dans l'arborescence et `.cadre/agents/<nom>.yaml` est écrit à l'enregistrement.
- AC-007-2 [AGT-02] : Étant donné le formulaire de création, quand l'utilisateur choisit l'outil cible, alors seuls les outils dont un adaptateur est disponible sont proposés (Claude Code au MVP 0).
- AC-007-3 [AGT-01] : Étant donné un agent `frontend` existant, quand l'utilisateur crée un autre agent `frontend` (casse comprise : `Frontend`), alors la création est refusée avec un message.
- AC-007-4 [AGT-01] : Étant donné un nom vide, contenant des caractères interdits dans un nom de fichier sous Windows ou macOS, ou un nom réservé (ex. `CON`), quand l'utilisateur valide, alors la création est refusée avec la règle violée.
- AC-007-5 [AGT-02] : Étant donné un rôle ou une description vide, quand l'utilisateur valide, alors l'agent est créé et un avertissement « description manquante » est affiché.

### US-008 — Exporter un agent vers Claude Code
En tant que développeur solo, je veux que Cadre génère les fichiers Claude Code de mon agent afin que Claude Code l'utilise sans que j'écrive ces fichiers à la main.
- Étape : MVP 0 · Estimation : 3 points · Dépendances : US-007, US-005 · **Zone sensible : oui (écritures atomiques de plusieurs fichiers) → porte 3**
- Exigences : ADP-01, ADP-02, NF-12, NF-19

Critères d'acceptation :
- AC-008-1 [ADP-02] : Étant donné un agent `frontend` avec rôle et description, quand l'utilisateur exporte vers Claude Code, alors `.claude/agents/frontend.md` est créé avec l'en-tête et le corps attendus par Claude Code (format établi par SP-02).
- AC-008-2 [ADP-02] : Étant donné le fichier généré, quand la version testée de Claude Code charge le projet, alors l'agent est reconnu sans erreur (test d'intégration avec la CLI, ou vérification de conformité au format documenté si la CLI n'est pas disponible en CI).
- AC-008-3 [NF-12] : Étant donné un export qui écrit plusieurs fichiers, quand une erreur survient sur l'un d'eux, alors aucun fichier n'est modifié et l'erreur est affichée.
- AC-008-4 [ADP-02] : Étant donné un fichier `.claude/agents/frontend.md` existant non généré par Cadre, quand l'utilisateur exporte, alors Cadre ne l'écrase pas sans confirmation explicite.
- AC-008-5 [ADP-01] : Étant donné un adaptateur factice enregistré, quand le cœur exporte, alors il appelle « valider » puis « exporter » sur l'adaptateur, et un modèle invalide n'est pas exporté.
- AC-008-6 [NF-19] : Étant donné le code du cœur, quand on recherche des références à Claude Code hors de l'adaptateur, alors il n'y en a aucune (vérification automatisée).

### US-009 — Exporter skills et contextes vers Claude Code, aller-retour sans perte
En tant que développeur solo, je veux que mes skills et contextes soient réécrits dans les fichiers Claude Code afin que mon cadrage Cadre soit bien celui que Claude Code utilise.
- Étape : MVP 0 · Estimation : 3 points · Dépendances : US-003, US-004, US-008 · **Zone sensible : oui (écritures atomiques, fichiers de l'utilisateur) → porte 3**
- Exigences : ADP-02, PRJ-02, NF-12
- Note : le comportement sur un CLAUDE.md déjà présent dépend de Q-02.

Critères d'acceptation :
- AC-009-1 [ADP-02] : Étant donné des skills dans le modèle, quand l'utilisateur exporte, alors chaque skill est écrite dans `.claude/skills/<nom>/SKILL.md` avec ses fichiers annexes.
- AC-009-2 [ADP-02] : Étant donné les contextes du modèle, quand l'utilisateur exporte, alors `CLAUDE.md` est généré selon la règle décidée en Q-02.
- AC-009-3 [PRJ-02] : Étant donné un projet importé puis exporté sans aucune modification, quand on compare les fichiers avant/après, alors ils sont identiques octet pour octet (aller-retour sans perte, §13.1).
- AC-009-4 [NF-12] : Étant donné un export interrompu en cours (erreur simulée), quand on examine le projet, alors tous les fichiers sont dans leur état d'avant l'export.
- AC-009-5 [ADP-02] : Étant donné une skill supprimée du modèle depuis le dernier export, quand l'utilisateur exporte, alors Cadre indique quel fichier `.claude/skills/` serait supprimé et ne le supprime qu'après confirmation.
- AC-009-6 [NF-05] : Les critères AC-009-3 et AC-009-4 passent en CI sur Windows et macOS.

### US-010 — Importer les sous-agents Claude Code existants
En tant que développeur qui a déjà des sous-agents Claude Code, je veux les importer comme agents Cadre afin de les cadrer dans l'app.
- Étape : MVP 0 · Estimation : 3 points · Dépendances : US-007, US-008 · Zone sensible : non
- Exigences : PRJ-02, ADP-02

Critères d'acceptation :
- AC-010-1 [PRJ-02] : Étant donné `.claude/agents/revue.md` avec en-tête (nom, description, outils) et corps, quand il est importé, alors un agent `revue` est créé avec ces informations.
- AC-010-2 [PRJ-02] : Étant donné un sous-agent importé puis réexporté sans modification, quand on compare, alors le fichier est identique octet pour octet.
- AC-010-3 [ADP-02] : Étant donné un champ d'en-tête que le modèle ne sait pas représenter, quand l'import a lieu, alors il est conservé tel quel et un avertissement l'indique.
- AC-010-4 [ADP-02] : Étant donné un fichier de sous-agent invalide, quand l'import a lieu, alors il est signalé en erreur et les autres sont importés.
- AC-010-5 [PRJ-02] : Étant donné un sous-agent dont le nom entre en conflit avec un agent déjà présent dans le modèle, quand l'import a lieu, alors l'utilisateur choisit entre renommer et ignorer ; rien n'est écrasé silencieusement.

### US-011 — Dupliquer, renommer et supprimer un agent
En tant que développeur solo, je veux dupliquer, renommer et supprimer un agent afin de faire évoluer mon cadrage sans repartir de zéro.
- Étape : MVP 0 · Estimation : 2 points · Dépendances : US-008 · **Zone sensible : oui (suppression de fichiers générés) → porte 3**
- Exigences : AGT-01

Critères d'acceptation :
- AC-011-1 [AGT-01] : Étant donné un agent `frontend`, quand l'utilisateur le duplique, alors un agent `frontend-copie` (suffixe numéroté si déjà pris) est créé avec les mêmes réglages.
- AC-011-2 [AGT-01] : Étant donné un agent exporté, quand l'utilisateur le renomme, alors au prochain export l'ancien fichier `.claude/agents/<ancien>.md` est retiré et le nouveau créé, en une seule opération atomique.
- AC-011-3 [AGT-01] : Étant donné un agent, quand l'utilisateur demande la suppression, alors une confirmation est demandée ; en cas d'annulation rien ne change.
- AC-011-4 [AGT-01] : Étant donné un agent supprimé, quand l'utilisateur exporte, alors son fichier généré est retiré ; un fichier non généré par Cadre portant le même nom n'est jamais supprimé.
- AC-011-5 [AGT-01] : Étant donné un renommage vers un nom déjà pris ou invalide, quand l'utilisateur valide, alors il est refusé avec les mêmes règles qu'AC-007-3 et AC-007-4.

### US-076 — Aligner les commandes de lecture sur la racine du projet ouvert
En tant que développeur solo, je veux que Cadre ne lise que dans le projet que j'ai ouvert afin qu'aucun fichier extérieur au projet ne puisse être lu ou recopié à mon insu.
- Étape : MVP 0 · Estimation proposée : 2 points · Dépendances : US-005 · **Zone sensible : oui (portée) → porte 3**
- Exigences (proposées, héritées d'US-002 et US-003) : SKL-01, PRJ-02
- Origine : revues d'US-005 (PR #4), 2026-10-01. Ajoutée au backlog le 2026-10-01, statut « À faire » ; estimation et exigences à confirmer au prochain Sprint Planning.
- Contenu : `list_project_dir` et `read_project_file` utilisent la racine tenue côté Rust (état posé par `ouvrir_projet`) et la même résolution sûre que l'écriture (refus de tout lien/jonction sur chaque segment).
- Done le 2026-10-01 (PR #9, merge `104406c`). Zone sensible : deux revues `relecteur` indépendantes, toutes deux ACCEPTÉ.
- Décision orchestrateur : aucun lien suivi en lecture, même interne au projet. Trois assertions d'US-002 modifiées en conséquence (`/dev/zero` → `Link` ; lien interne non suivi ; liens listés comme liens), présentées au PO.
- Correction du texte de PR : la preuve RED du test d'architecture a été écrite après le code.
- Risque résiduel : course TOCTOU ; un lien physique (hard link) reste lisible ; points de montage ; webview compromise ; les skills partagées par lien ne sont plus lues.

Critères d'acceptation :
- AC-076-1 : Étant donné qu'aucun projet n'est ouvert, quand une commande de lecture est appelée, alors elle est refusée.
- AC-076-2 : Étant donné un projet ouvert, quand une commande de lecture vise une autre racine, alors elle est refusée.
- AC-076-3 : Étant donné un lien symbolique ou une jonction qui pointe hors du projet, quand une commande de lecture le traverse, alors elle est refusée.
- AC-076-4 : Les tests d'US-002 et d'US-003 restent verts (non-régression).

### US-077 — Enregistrer le cadrage depuis l'interface
En tant que développeur solo, je veux un bouton « Enregistrer » qui écrit mon cadrage dans `.cadre/` afin de ne pas perdre les contextes importés.
- Étape : MVP 0 · Estimation proposée : 3 points · Dépendances : US-003, US-005 · **Zone sensible : oui (écritures atomiques) → porte 3**
- Exigences (proposées, héritées d'US-003 et US-005) : §7.4, NF-12, PRJ-02
- Origine : US-003 livrée sans écriture (modèle en mémoire, « Non enregistré ») car US-005 n'était pas mergée. Ajoutée au backlog le 2026-10-01, statut « À faire » ; estimation et exigences à confirmer au prochain Sprint Planning.

Critères d'acceptation :
- AC-077-1 : Étant donné un projet ouvert avec des contextes importés (US-003), quand l'utilisateur clique « Enregistrer », alors `.cadre/` est écrit via US-005 : `cadre.yaml`, les contextes importés, et leur adoption dans `generated.yaml` selon [ADR-001](ADR-001-format-cadre-v1) D5.
- AC-077-2 : Étant donné un échec d'enregistrement (cas d'AC-005-6), quand l'utilisateur enregistre, alors le message d'erreur correspondant s'affiche.
- AC-077-3 : Étant donné un enregistrement réussi, quand il se termine, alors l'état « Non enregistré » disparaît.
- AC-077-4 (ajouté le 2026-10-01, Sprint Review 1) : Étant donné un dossier `.cadre/` sans `cadre.yaml` (p. ex. seulement `tmp/verrou`), quand le projet est ouvert, alors ce n'est pas un modèle : l'import est proposé.
- AC-077-5 (ajouté le 2026-10-01, issu d'US-006) : Étant donné un modèle ouvert en lecture seule (format plus récent, AC-006-2), quand l'utilisateur veut enregistrer, alors l'enregistrement est refusé avec une explication.

### US-079 — Message dédié quand un dossier de cadrage est un lien
En tant que développeur solo, je veux un message explicite quand `.claude`, `.claude/skills` ou `.cadre` est lui-même un lien afin de comprendre pourquoi Cadre ne lit pas ce dossier.
- Étape : MVP 0 · Estimation : 1 point · Dépendances : US-076 · Zone sensible : non
- Exigences (proposées, héritées d'US-076) : SKL-01, PRJ-02
- Origine : dette relevée sur US-076 (PR #9), 2026-10-01. Statut : À faire.

Critères d'acceptation :
- AC-079-1 : Étant donné un projet dont `.claude` ou `.claude/skills` est un lien, quand le projet est ouvert, alors un message dédié indique que ce dossier est un lien non pris en charge, sans le suivre.
- AC-079-2 : Étant donné un projet dont `.cadre` est un lien, quand le projet est ouvert, alors un message dédié indique que ce dossier est un lien non pris en charge, sans le suivre ni y écrire.

---

## 6. Détail des stories — MVP 1 Must

### US-012 — Attacher et détacher des skills à un agent
En tant que développeur solo, je veux attacher ou détacher une skill à un agent en un clic afin de contrôler les capacités de chaque agent.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-007, US-004 · Zone sensible : non
- Exigences : AGT-05

Critères d'acceptation :
- AC-012-1 [AGT-05] : Étant donné un agent et une skill non attachée, quand l'utilisateur clique sur « attacher », alors la skill apparaît dans l'onglet Skills de l'agent et dans `.cadre/agents/<nom>.yaml` après enregistrement.
- AC-012-2 [AGT-05] : Étant donné une skill attachée, quand l'utilisateur clique sur « détacher », alors elle disparaît de l'agent sans être supprimée du projet.
- AC-012-3 [AGT-05] : Étant donné une skill déjà attachée, quand l'utilisateur tente de l'attacher à nouveau, alors elle n'apparaît qu'une fois.
- AC-012-4 [AGT-05] : Étant donné une skill en erreur de validation, quand l'utilisateur l'attache, alors l'attachement est permis et un avertissement est affiché.
- AC-012-5 [AGT-05] : Étant donné un agent exporté, quand ses skills changent puis sont exportées, alors le fichier Claude Code de l'agent reflète les skills attachées.

### US-013 — Déclarer la portée d'un agent par dossier
En tant que développeur junior, je veux déclarer pour chaque dossier si mon agent peut écrire, seulement lire ou ne pas toucher afin d'éviter qu'il modifie ce qu'il ne doit pas.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-007 · **Zone sensible : oui (portée des agents) → porte 3**
- Exigences : AGT-07
- Note : la règle pour les chemins non couverts dépend de Q-10.

Critères d'acceptation :
- AC-013-1 [AGT-07] : Étant donné un agent, quand l'utilisateur ajoute la règle `src/api/` = lecture seule et `infra/` = interdit, alors l'onglet Portée les affiche et `.cadre/agents/<nom>.yaml` les contient après enregistrement.
- AC-013-2 [AGT-07] : Étant donné une règle sur un chemin hors du projet (ex. `../autre` ou chemin absolu extérieur), quand l'utilisateur valide, alors elle est refusée.
- AC-013-3 [AGT-07] : Étant donné une règle sur un dossier qui n'existe pas encore, quand l'utilisateur valide, alors elle est acceptée avec un avertissement « dossier inexistant ».
- AC-013-4 [AGT-07] : Étant donné des chemins écrits différemment (`src/api`, `./src/api/`, `src\api` sous Windows), quand ils sont enregistrés, alors ils sont normalisés en une seule forme et une règle en double est refusée.
- AC-013-5 [AGT-07] : Étant donné une règle existante, quand l'utilisateur change son niveau ou la supprime, alors le changement est reflété après enregistrement.

### US-014 — Exporter la portée vers Claude Code avec son niveau de garantie
En tant que développeur junior, je veux que la portée déclarée soit traduite dans les réglages natifs de Claude Code et marquée garantie ou non garantie afin de savoir ce qui est réellement empêché.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-013, US-008, SP-02 · **Zone sensible : oui (permissions et portée) → porte 3**
- Exigences : AGT-07, ADP-02, ADP-05, NF-11

Critères d'acceptation :
- AC-014-1 [AGT-07] : Étant donné une règle « interdit » sur `infra/`, quand l'agent est exporté, alors les réglages de permissions Claude Code contiennent la règle native correspondante établie par SP-02.
- AC-014-2 [NF-11] : Étant donné chaque niveau de portée, quand il est exporté, alors son marquage (exact, approximation, non supporté) est celui du tableau de capacités de SP-02, et un réglage n'est jamais affiché « garanti » si SP-02 ne l'a pas prouvé.
- AC-014-3 [NF-11] : Étant donné une règle exportée comme « exact », quand un test d'intégration lance la version testée de Claude Code et tente l'action interdite, alors l'action est refusée par Claude Code.
- AC-014-4 [ADP-05] : Étant donné une règle non supportée, quand l'agent est exporté, alors l'export réussit, la règle est marquée « non garantie » et sera seulement surveillée après exécution (US-025).
- AC-014-5 [ADP-02] : Étant donné un fichier de réglages Claude Code contenant déjà des règles écrites par l'utilisateur, quand Cadre exporte, alors ces règles sont conservées (ou un conflit est présenté), jamais supprimées silencieusement.

### US-015 — Déclarer les outils autorisés d'un agent
En tant que développeur solo, je veux cocher les outils autorisés de mon agent (terminal, navigateur, paquets, réseau) afin de limiter ce qu'il peut faire.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-007 · **Zone sensible : oui (permissions) → porte 3**
- Exigences : AGT-06

Critères d'acceptation :
- AC-015-1 [AGT-06] : Étant donné un agent, quand l'utilisateur coche ou décoche terminal, navigateur, paquets ou réseau, alors l'état est enregistré dans `.cadre/agents/<nom>.yaml`.
- AC-015-2 [AGT-06] : Étant donné un nouvel agent, quand il est créé, alors les outils ont une valeur par défaut explicite et visible (voir Q-09), jamais un état indéterminé.
- AC-015-3 [AGT-06] : Étant donné un fichier d'agent contenant un outil inconnu, quand il est chargé, alors l'outil est signalé en avertissement et conservé.

### US-016 — Exporter les outils autorisés avec leur niveau de garantie
En tant que développeur solo, je veux que les outils autorisés soient exportés vers le mécanisme natif de Claude Code quand il existe, sinon marqués « non garanti », afin de ne pas avoir de faux sentiment de sécurité.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-015, US-008, SP-02 · **Zone sensible : oui (permissions) → porte 3**
- Exigences : AGT-06, ADP-02, ADP-05, NF-11

Critères d'acceptation :
- AC-016-1 [AGT-06] : Étant donné « terminal » décoché, quand l'agent est exporté, alors la règle native correspondante (selon SP-02) est écrite.
- AC-016-2 [NF-11] : Étant donné chaque outil, quand il est affiché après export, alors son marquage correspond au tableau de capacités de SP-02.
- AC-016-3 [NF-11] : Étant donné un outil marqué « exact », quand un test d'intégration avec la version testée de Claude Code tente de l'utiliser alors qu'il est interdit, alors la tentative est refusée.
- AC-016-4 [ADP-05] : Étant donné un outil sans mécanisme natif (ex. réseau si SP-02 le confirme), quand il est exporté, alors il est marqué « non garanti » avec une explication courte.

### US-017 — Détecter Claude Code et sa version
En tant que développeur solo, je veux que Cadre vérifie que Claude Code est installé et dans une version testée afin d'éviter une exécution qui échoue ou se comporte mal.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : SP-02 · Zone sensible : non
- Exigences : CLI-01, CLI-03, NF-06

Critères d'acceptation :
- AC-017-1 [CLI-01] : Étant donné Claude Code installé dans le PATH, quand l'app démarre, alors sa version est détectée et affichée.
- AC-017-2 [CLI-01] : Étant donné une exécution demandée, quand elle va démarrer, alors la présence et la version sont revérifiées (la CLI a pu être désinstallée ou mise à jour entre-temps).
- AC-017-3 [CLI-03] : Étant donné une version absente de la liste des versions testées, quand elle est détectée, alors un avertissement non bloquant affiche la liste des versions compatibles.
- AC-017-4 [CLI-01] : Étant donné une CLI qui ne répond pas à la demande de version dans le délai prévu ou renvoie une sortie illisible, quand la détection a lieu, alors l'état « version inconnue » est affiché sans bloquer l'app.
- AC-017-5 [NF-06] : Étant donné l'app, quand l'utilisateur ouvre l'écran « À propos » ou Réglages, alors la liste des versions de Claude Code testées est affichée.

### US-018 — Guider l'utilisateur quand Claude Code est absent
En tant que développeur débutant, je veux un message clair et un moyen d'indiquer le chemin de la CLI quand Cadre ne la trouve pas afin de pouvoir lancer mes agents quand même.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-017 · Zone sensible : non
- Exigences : CLI-02, ACC-03

Critères d'acceptation :
- AC-018-1 [CLI-02] : Étant donné Claude Code absent du PATH, quand l'app démarre, alors un message explique le problème avec un lien vers la documentation officielle d'installation, et l'édition du cadrage reste possible.
- AC-018-2 [CLI-02] : Étant donné ce message, quand l'utilisateur indique un chemin valide vers l'exécutable, alors la CLI est détectée et le chemin est mémorisé dans les réglages.
- AC-018-3 [CLI-02] : Étant donné un chemin qui n'existe pas ou n'est pas un exécutable, quand l'utilisateur le valide, alors il est refusé avec la raison.
- AC-018-4 [CLI-02] : Étant donné Claude Code absent, quand l'utilisateur tente de lancer un agent, alors le lancement est désactivé avec la même explication.

### US-019 — Créer un worktree Git dédié pour une exécution
En tant que développeur solo, je veux que chaque tâche s'exécute dans un worktree Git dédié, sur sa propre branche, afin que mon dépôt principal ne soit jamais touché tant que je n'accepte pas.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : SP-06 · **Zone sensible : oui (worktrees Git) → porte 3**
- Exigences : RUN-03

Critères d'acceptation :
- AC-019-1 [RUN-03] : Étant donné un projet Git, quand une exécution est préparée, alors un worktree est créé sur une nouvelle branche au nom unique, en dehors de l'arborescence suivie du dépôt principal.
- AC-019-2 [RUN-03] : Étant donné un projet sans Git, quand l'utilisateur ouvre l'écran Exécution, alors le lancement est désactivé avec une explication.
- AC-019-3 [RUN-03] : Étant donné des modifications non commitées dans le dépôt principal, quand le worktree est créé, alors ces modifications sont intactes dans le dépôt principal, et l'état de départ du worktree suit la règle décidée en Q-05.
- AC-019-4 [RUN-03] : Étant donné une erreur pendant la création (nom de branche déjà pris, disque plein, dépôt verrouillé), quand elle survient, alors aucune branche ni worktree partiel ne subsiste et l'erreur est affichée.
- AC-019-5 [RUN-03] : Étant donné un dépôt dans un état particulier (HEAD détachée, aucun commit, opération Git en cours), quand une exécution est préparée, alors Cadre refuse avec une explication plutôt que de créer un worktree incohérent.
- AC-019-6 [NF-05] : Les critères AC-019-1, AC-019-3 et AC-019-4 passent en CI sur Windows et macOS.

### US-020 — Lancer un agent sur une tâche avec son cadrage
En tant que développeur solo, je veux choisir un agent, saisir une tâche et lancer Claude Code avec le cadrage de cet agent afin de déléguer le travail sans sortir de Cadre.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-019, US-017, US-014, US-016, SP-05 · **Zone sensible : oui (gestion des processus) → porte 3**
- Exigences : RUN-01, NF-07, NF-10

Critères d'acceptation :
- AC-020-1 [RUN-01] : Étant donné un agent exporté et une tâche saisie, quand l'utilisateur clique sur « Lancer », alors la CLI officielle installée est lancée dans le worktree avec le cadrage de l'agent.
- AC-020-2 [NF-10] : Étant donné n'importe quel chemin de l'app (ouverture de projet, import, export, rechargement), quand il est parcouru, alors aucune exécution d'agent ne démarre sans clic explicite sur « Lancer ».
- AC-020-3 [NF-07] : Étant donné une première exécution sur ce poste, quand l'utilisateur lance, alors un rappel indique que le projet est envoyé au fournisseur de l'agent selon ses conditions, et l'exécution n'a lieu qu'après confirmation.
- AC-020-4 [RUN-01] : Étant donné une tâche vide, quand l'utilisateur lance, alors le lancement est refusé.
- AC-020-5 [RUN-01] : Étant donné un cadrage non exporté ou en erreur de validation, quand l'utilisateur lance, alors Cadre exporte d'abord (ou refuse en affichant les erreurs bloquantes).
- AC-020-6 [RUN-01] : Étant donné une CLI qui échoue au démarrage, quand l'échec survient, alors le statut « échec au lancement » et le code de sortie sont affichés, et le worktree reste disponible pour rejet.

### US-021 — Suivre la sortie de l'agent dans un terminal intégré
En tant que développeur solo, je veux voir la sortie de l'agent en direct dans un terminal intégré afin de suivre et d'interagir avec ce qu'il fait.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-020, SP-05 · Zone sensible : non
- Exigences : RUN-02

Critères d'acceptation :
- AC-021-1 [RUN-02] : Étant donné une exécution en cours, quand la CLI écrit sur sa sortie, alors le texte apparaît dans le terminal intégré sans attendre la fin de l'exécution.
- AC-021-2 [RUN-02] : Étant donné une sortie avec couleurs et caractères spéciaux (codes ANSI, Unicode), quand elle est affichée, alors le rendu est fidèle.
- AC-021-3 [RUN-02] : Étant donné une CLI qui pose une question, quand l'utilisateur tape dans le terminal intégré, alors la saisie est transmise à la CLI.
- AC-021-4 [RUN-02] : Étant donné une sortie très volumineuse, quand elle défile, alors l'app reste réactive (aucun gel de l'interface).
- AC-021-5 [RUN-02] : Étant donné un redimensionnement de la fenêtre, quand il a lieu, alors la taille du pseudo-terminal est mise à jour.

### US-022 — Un seul agent à la fois par projet
En tant que développeur solo, je veux que Cadre empêche de lancer deux agents en même temps sur le même projet afin d'éviter des changements entremêlés.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-020 · **Zone sensible : oui (gestion des processus) → porte 3**
- Exigences : RUN-08

Critères d'acceptation :
- AC-022-1 [RUN-08] : Étant donné une exécution en cours, quand l'utilisateur tente d'en lancer une autre sur le même projet, alors le lancement est refusé avec un message.
- AC-022-2 [RUN-08] : Étant donné deux fenêtres ou instances de Cadre ouvertes sur le même projet, quand l'une lance un agent, alors l'autre ne peut pas lancer.
- AC-022-3 [RUN-08] : Étant donné un verrou laissé par une app qui a planté, quand l'app redémarre, alors le verrou orphelin est détecté et levé après vérification qu'aucun processus de l'exécution ne tourne encore.
- AC-022-4 [RUN-08] : Étant donné une exécution terminée, arrêtée ou en échec, quand elle se termine, alors le verrou est libéré.

### US-023 — Lister les changements d'une exécution
En tant que développeur junior, je veux voir à la fin d'une exécution la liste des fichiers créés, modifiés, supprimés et renommés afin de savoir exactement ce que l'agent a fait.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-019, SP-06 · Zone sensible : non
- Exigences : RUN-04

Critères d'acceptation :
- AC-023-1 [RUN-04] : Étant donné une exécution terminée qui a créé, modifié, supprimé et renommé un fichier chacun, quand la liste s'affiche, alors les quatre apparaissent avec le bon type de changement.
- AC-023-2 [RUN-04] : Étant donné un agent qui a commité lui-même dans le worktree, quand la liste s'affiche, alors les changements commités sont inclus (comparaison avec l'état de départ, pas avec le dernier commit).
- AC-023-3 [RUN-04] : Étant donné un agent qui a fait un `reset` ou un `checkout` dans le worktree, quand la liste s'affiche, alors elle reflète toujours la différence avec l'état de départ.
- AC-023-4 [RUN-04] : Étant donné une exécution sans aucun changement, quand elle se termine, alors la liste indique « aucun changement ».
- AC-023-5 [RUN-04] : Étant donné des fichiers ignorés par Git créés par l'agent, quand la liste s'affiche, alors ils sont listés séparément (voir Q-13).

### US-024 — Afficher le diff d'un fichier changé
En tant que développeur solo, je veux afficher le diff de chaque fichier changé afin de relire précisément le travail de l'agent.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-023 · Zone sensible : non
- Exigences : RUN-04

Critères d'acceptation :
- AC-024-1 [RUN-04] : Étant donné un fichier texte modifié, quand l'utilisateur le sélectionne, alors le diff ligne à ligne s'affiche.
- AC-024-2 [RUN-04] : Étant donné un fichier binaire, quand il est sélectionné, alors Cadre indique « fichier binaire modifié » avec les tailles avant/après.
- AC-024-3 [RUN-04] : Étant donné un fichier renommé et modifié, quand il est sélectionné, alors l'ancien et le nouveau nom et le diff de contenu s'affichent.
- AC-024-4 [RUN-04] : Étant donné un fichier très volumineux, quand il est sélectionné, alors le diff s'affiche sans geler l'interface (affichage tronqué avec option d'ouverture complète).

### US-025 — Signaler les changements hors portée
En tant que développeur junior, je veux que Cadre signale chaque changement fait hors de la portée de l'agent afin de détecter immédiatement une dérive.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-023, US-013 · **Zone sensible : oui (portée des agents) → porte 3**
- Exigences : RUN-05, AGT-07
- Note : la règle pour les chemins non couverts dépend de Q-10.

Critères d'acceptation :
- AC-025-1 [RUN-05] : Étant donné `infra/` interdit, quand l'agent crée, modifie ou supprime un fichier dans `infra/`, alors chaque changement est signalé « hors portée ».
- AC-025-2 [RUN-05] : Étant donné `src/api/` en lecture seule, quand l'agent y modifie un fichier, alors le changement est signalé « hors portée ».
- AC-025-3 [RUN-05] : Étant donné un renommage d'un fichier autorisé vers un dossier interdit, ou d'un dossier interdit vers un dossier autorisé, quand la liste s'affiche, alors le renommage est signalé.
- AC-025-4 [RUN-05] : Étant donné des règles imbriquées (`src/` écriture, `src/api/` lecture seule), quand l'agent modifie `src/api/x.ts`, alors la règle la plus précise s'applique et le changement est signalé.
- AC-025-5 [RUN-05] : Étant donné le jeu de tests de référence de SP-06 (création, modification, suppression, renommage hors portée), quand il est exécuté, alors 100 % des cas sont signalés et aucun changement dans la portée n'est signalé à tort.
- AC-025-6 [RUN-05] : Étant donné des chemins avec une casse différente sous Windows et macOS (systèmes insensibles à la casse), quand ils sont comparés aux règles, alors la comparaison respecte le comportement du système.

### US-026 — Rejeter toute une exécution
En tant que développeur solo, je veux rejeter toute une exécution afin de revenir exactement à l'état de départ.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-023, SP-06 · **Zone sensible : oui (worktrees Git) → porte 3**
- Exigences : RUN-05

Critères d'acceptation :
- AC-026-1 [RUN-05] : Étant donné une exécution terminée, quand l'utilisateur rejette tout et confirme, alors le worktree et sa branche sont supprimés.
- AC-026-2 [RUN-05] : Étant donné des modifications non commitées de l'utilisateur dans le dépôt principal, quand l'exécution est rejetée, alors le dépôt principal est exactement dans son état de départ, ces modifications comprises (§13.1).
- AC-026-3 [RUN-05] : Étant donné un fichier du worktree verrouillé (ouvert par un autre programme sous Windows), quand le rejet a lieu, alors Cadre signale ce qui n'a pas pu être supprimé et propose de réessayer, sans toucher au dépôt principal.
- AC-026-4 [RUN-05] : Étant donné une interruption au milieu du rejet (plantage simulé), quand l'app redémarre, alors elle détecte le worktree partiellement supprimé et termine le nettoyage.
- AC-026-5 [NF-05] : AC-026-2 à AC-026-4 passent en CI sur Windows et macOS.

### US-027 — Accepter toute une exécution
En tant que développeur solo, je veux accepter tous les changements d'une exécution afin de les intégrer à mon projet.
- Étape : MVP 1 · Estimation : 5 points · Dépendances : US-023, SP-06, Q-05 · **Zone sensible : oui (worktrees, écritures) → porte 3**
- Exigences : RUN-05

Critères d'acceptation :
- AC-027-1 [RUN-05] : Étant donné une exécution terminée, quand l'utilisateur accepte tout, alors tous les changements sont appliqués au dépôt principal selon la règle de fusion décidée en Q-05, puis le worktree est supprimé.
- AC-027-2 [RUN-05] : Étant donné des changements hors portée, quand l'utilisateur accepte tout, alors une confirmation supplémentaire liste ces changements avant d'appliquer.
- AC-027-3 [RUN-05] : Étant donné un fichier modifié à la fois par l'agent et par l'utilisateur dans le dépôt principal pendant l'exécution, quand l'utilisateur accepte, alors Cadre n'écrase rien, affiche le conflit et laisse choisir.
- AC-027-4 [RUN-05] : Étant donné une interruption au milieu de l'application (plantage simulé), quand l'app redémarre, alors le dépôt principal est soit entièrement dans l'état d'avant, soit entièrement dans l'état accepté, jamais entre les deux.
- AC-027-5 [RUN-05] : Étant donné une branche principale qui a avancé pendant l'exécution, quand l'utilisateur accepte, alors les changements sont appliqués sans perdre les commits intervenus entre-temps, ou un conflit est présenté.
- AC-027-6 [NF-05] : AC-027-3 et AC-027-4 passent en CI sur Windows et macOS.

### US-028 — Accepter ou rejeter fichier par fichier
En tant que développeur solo, je veux accepter certains fichiers et rejeter les autres afin de ne garder que le bon travail de l'agent.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-026, US-027 · **Zone sensible : oui (worktrees, écritures) → porte 3**
- Exigences : RUN-05

Critères d'acceptation :
- AC-028-1 [RUN-05] : Étant donné trois fichiers changés, quand l'utilisateur en accepte un et rejette deux, alors seul le premier est appliqué au dépôt principal.
- AC-028-2 [RUN-05] : Étant donné un renommage, quand l'utilisateur l'accepte, alors l'ancien fichier est retiré et le nouveau créé ensemble (un renommage n'est jamais appliqué à moitié).
- AC-028-3 [RUN-05] : Étant donné une sélection partielle, quand elle est appliquée, alors le worktree est supprimé ensuite et les fichiers rejetés ne laissent aucune trace dans le dépôt principal.
- AC-028-4 [RUN-05] : Étant donné une interruption au milieu de l'application d'une sélection, quand l'app redémarre, alors l'état est cohérent comme en AC-027-4.

### US-029 — Arrêter l'agent et tous ses processus
En tant que développeur solo, je veux arrêter un agent à tout moment sans laisser de processus en arrière-plan afin de garder le contrôle de ma machine.
- Étape : MVP 1 · Estimation : 5 points · Dépendances : US-020, SP-05 · **Zone sensible : oui (arrêt des processus) → porte 3**
- Exigences : RUN-06
- Note : la valeur par défaut du délai dépend de Q-06.

Critères d'acceptation :
- AC-029-1 [RUN-06] : Étant donné une exécution en cours, quand l'utilisateur clique sur « Arrêter », alors un arrêt propre est demandé à la CLI et à ses processus enfants.
- AC-029-2 [RUN-06] : Étant donné une CLI qui ne s'arrête pas dans le délai configuré, quand le délai expire, alors tout l'arbre de processus est arrêté de force.
- AC-029-3 [RUN-06] : Étant donné une CLI qui a lancé des processus enfants et petits-enfants (ex. serveur de développement), quand l'arrêt est terminé, alors aucun processus de l'arbre n'est encore actif (vérifié en CI sur Windows et macOS).
- AC-029-4 [RUN-06] : Étant donné le réglage du délai, quand l'utilisateur saisit une valeur hors des bornes autorisées ou non numérique, alors elle est refusée.
- AC-029-5 [RUN-06] : Étant donné une exécution arrêtée, quand l'arrêt est terminé, alors son statut est « arrêtée », les changements faits jusque-là sont listés (US-023) et peuvent être acceptés ou rejetés.
- AC-029-6 [RUN-06] : Étant donné un processus qui s'est détaché de l'arbre (double fork / démon), quand l'arrêt est terminé, alors Cadre l'indique s'il a pu le détecter ; les cas non détectables sont documentés comme risque résiduel.

### US-030 — Fermer l'app pendant une exécution
En tant que développeur solo, je veux être averti si je ferme Cadre pendant une exécution afin de ne pas laisser un agent tourner sans surveillance.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-029 · **Zone sensible : oui (arrêt des processus) → porte 3**
- Exigences : RUN-07

Critères d'acceptation :
- AC-030-1 [RUN-07] : Étant donné une exécution en cours, quand l'utilisateur ferme la fenêtre ou quitte l'app, alors un avertissement demande confirmation.
- AC-030-2 [RUN-07] : Étant donné l'avertissement, quand l'utilisateur annule, alors l'app reste ouverte et l'exécution continue.
- AC-030-3 [RUN-07] : Étant donné l'avertissement, quand l'utilisateur confirme, alors l'arrêt propre puis forcé d'US-029 a lieu avant la fermeture, et aucun processus ne reste actif.
- AC-030-4 [RUN-07] : Étant donné une fermeture demandée par le système (arrêt de la session, mise à jour), quand elle survient pendant une exécution, alors Cadre tente l'arrêt propre ; au redémarrage, le worktree de l'exécution interrompue est retrouvé et proposé à l'acceptation ou au rejet (comportement proposé, à confirmer : Q-18).

### US-031 — Créer, renommer, dupliquer et supprimer une skill
En tant que développeur indé, je veux gérer mes skills depuis l'app afin de ne plus manipuler les dossiers à la main.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-004 · Zone sensible : non
- Exigences : SKL-02

Critères d'acceptation :
- AC-031-1 [SKL-02] : Étant donné un projet, quand l'utilisateur crée une skill avec un nom valide, alors elle apparaît dans la liste avec un `SKILL.md` minimal valide.
- AC-031-2 [SKL-02] : Étant donné une skill attachée à des agents, quand elle est renommée, alors les agents référencent le nouveau nom.
- AC-031-3 [SKL-02] : Étant donné une skill, quand elle est dupliquée, alors la copie contient le corps et les fichiers annexes, avec un nom unique.
- AC-031-4 [SKL-02] : Étant donné une skill utilisée par des agents, quand l'utilisateur demande la suppression, alors la confirmation liste ces agents ; après confirmation la skill est détachée de tous et supprimée.
- AC-031-5 [SKL-02] : Étant donné un nom invalide selon les règles de SP-04 ou déjà pris, quand l'utilisateur valide, alors l'opération est refusée avec la règle violée.

### US-032 — Éditer une skill
En tant que développeur indé, je veux éditer l'en-tête d'une skill dans un formulaire et son corps dans un éditeur Markdown afin de ne plus casser l'en-tête YAML par erreur.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-031 · Zone sensible : non
- Exigences : SKL-03

Critères d'acceptation :
- AC-032-1 [SKL-03] : Étant donné une skill, quand l'utilisateur modifie nom ou description dans le formulaire et enregistre, alors l'en-tête YAML est réécrit correctement.
- AC-032-2 [SKL-03] : Étant donné l'éditeur Markdown, quand l'utilisateur modifie le corps et enregistre, alors le corps est enregistré et l'en-tête inchangé.
- AC-032-3 [SKL-03] : Étant donné une description contenant des caractères spéciaux YAML (`:`, `#`, guillemets, retours à la ligne), quand elle est enregistrée puis relue, alors elle est identique.
- AC-032-4 [SKL-03] : Étant donné des champs d'en-tête inconnus du formulaire, quand la skill est enregistrée, alors ils sont conservés.
- AC-032-5 [SKL-03] : Étant donné des modifications non enregistrées, quand l'utilisateur quitte la skill, alors il est averti.

### US-033 — Valider une skill selon la spécification Agent Skills
En tant que développeur indé, je veux que chaque skill soit validée selon la spécification Agent Skills afin de savoir avant d'exécuter qu'elle sera chargée correctement.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : SP-04, US-002 · Zone sensible : non
- Exigences : SKL-05

Critères d'acceptation :
- AC-033-1 [SKL-05] : Étant donné chaque règle numérotée de SP-04, quand une skill la viole, alors l'erreur ou l'avertissement correspondant est produit avec le champ concerné.
- AC-033-2 [SKL-05] : Étant donné une skill conforme, quand elle est validée, alors aucun message n'est produit.
- AC-033-3 [SKL-05] : Étant donné le validateur, quand il est appelé hors de l'interface (test unitaire sans React), alors il fonctionne : il est indépendant de l'interface.
- AC-033-4 [SKL-05] : Étant donné une skill modifiée dans l'éditeur, quand l'utilisateur tape, alors la validation est mise à jour sans enregistrer.

### US-034 — Voir les agents qui utilisent une skill
En tant que développeur solo, je veux voir sur chaque skill quels agents l'utilisent afin de mesurer l'impact d'une modification.
- Étape : MVP 1 · Estimation : 1 point · Dépendances : US-012 · Zone sensible : non
- Exigences : SKL-08

Critères d'acceptation :
- AC-034-1 [SKL-08] : Étant donné une skill attachée à deux agents, quand l'utilisateur ouvre la skill, alors les deux agents sont listés et cliquables.
- AC-034-2 [SKL-08] : Étant donné une skill attachée à aucun agent, quand l'utilisateur l'ouvre, alors « utilisée par aucun agent » s'affiche.
- AC-034-3 [SKL-08] : Étant donné un attachement modifié, quand l'utilisateur revient sur la skill, alors la liste est à jour.

### US-035 — Éditer les fichiers de contexte
En tant que développeur solo, je veux éditer mes fichiers de contexte (projet, conventions, architecture) dans l'app afin de tenir mon cadrage à jour au même endroit.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-003 · Zone sensible : non
- Exigences : CTX-01

Critères d'acceptation :
- AC-035-1 [CTX-01] : Étant donné un contexte, quand l'utilisateur modifie son contenu et enregistre, alors `.cadre/contexte/<titre>.md` est mis à jour.
- AC-035-2 [CTX-01] : Étant donné le formulaire de création, quand l'utilisateur crée un contexte en choisissant un type (projet, conventions, architecture), alors il est créé avec ce type.
- AC-035-3 [CTX-01] : Étant donné un titre déjà pris ou invalide comme nom de fichier, quand l'utilisateur valide, alors la création est refusée.
- AC-035-4 [CTX-01] : Étant donné un contexte lié à des agents, quand il est supprimé, alors la confirmation liste ces agents.
- AC-035-5 [CTX-01] : Étant donné des modifications non enregistrées, quand l'utilisateur quitte, alors il est averti.

### US-036 — Lier un contexte à des agents
En tant que développeur solo, je veux lier un fichier de contexte à un ou plusieurs agents afin que chacun reçoive seulement le contexte qui le concerne.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-035, US-007 · Zone sensible : non
- Exigences : CTX-03

Critères d'acceptation :
- AC-036-1 [CTX-03] : Étant donné un contexte et deux agents, quand l'utilisateur le lie aux deux, alors chacun le liste et l'aperçu (US-040) l'inclut.
- AC-036-2 [CTX-03] : Étant donné un lien, quand l'utilisateur le retire, alors l'agent ne reçoit plus ce contexte à l'export.
- AC-036-3 [CTX-03] : Étant donné l'export Claude Code, quand un contexte est lié à un seul agent, alors il est exporté de façon à n'être reçu que par cet agent si SP-02 l'a établi possible ; sinon le lien est marqué « approximation ».

### US-037 — Paramètres libres d'un agent
En tant que développeur solo, je veux ajouter et retirer des paramètres libres (clé, valeur) à un agent afin d'exprimer des réglages que Cadre ne prévoit pas.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-007 · Zone sensible : non
- Exigences : AGT-03

Critères d'acceptation :
- AC-037-1 [AGT-03] : Étant donné un agent, quand l'utilisateur ajoute la paire `framework` = `react`, alors elle est enregistrée dans le fichier de l'agent.
- AC-037-2 [AGT-03] : Étant donné une clé vide ou déjà présente sur cet agent, quand l'utilisateur valide, alors l'ajout est refusé.
- AC-037-3 [AGT-03] : Étant donné une clé qui correspond à un paramètre prédéfini, quand l'utilisateur l'ajoute en libre, alors un message renvoie vers le paramètre prédéfini.
- AC-037-4 [AGT-03] : Étant donné un paramètre, quand l'utilisateur le retire, alors il disparaît du fichier après enregistrement.
- AC-037-5 [AGT-03] : Étant donné une valeur contenant des caractères spéciaux YAML, quand elle est enregistrée puis relue, alors elle est identique.

### US-038 — Paramètres prédéfinis d'un agent
En tant que développeur junior, je veux régler l'autonomie, la taille maximale des changements, la langue et le style de commit de mon agent afin de cadrer son comportement sans écrire de consignes.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-007, SP-02 · Zone sensible : non · Débloquée le 2026-10-01 (Q-07 : option par défaut acceptée)
- Exigences : AGT-04

Critères d'acceptation (à compléter après Q-07) :
- AC-038-1 [AGT-04] : Étant donné un agent, quand l'utilisateur ouvre l'onglet Paramètres, alors les quatre paramètres prédéfinis sont proposés avec leurs valeurs autorisées et une valeur par défaut.
- AC-038-2 [AGT-04] : Étant donné une valeur hors des valeurs autorisées dans le fichier de l'agent, quand il est chargé, alors une erreur de validation est produite.
- AC-038-3 [AGT-04] : Étant donné chaque paramètre, quand l'agent est exporté, alors il est traduit selon le tableau de capacités de SP-02 et marqué exact, approximation ou non supporté.

### US-039 — Afficher le niveau de support de chaque réglage
En tant que développeur junior, je veux voir à côté de chaque réglage s'il est appliqué exactement, approximativement ou pas du tout par l'outil cible afin de ne pas avoir de faux sentiment de sécurité.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-014, US-016 · **Zone sensible : oui (affichage des permissions) → porte 3**
- Exigences : ADP-05, NF-11

Critères d'acceptation :
- AC-039-1 [ADP-05] : Étant donné un agent, quand l'utilisateur ouvre ses onglets Paramètres, Skills et Portée, alors chaque réglage porte un badge exact / approximation / non supporté issu de la déclaration de capacités de l'adaptateur.
- AC-039-2 [NF-11] : Étant donné un réglage dont l'adaptateur ne déclare pas de capacité, quand il est affiché, alors il est marqué « non supporté » par défaut (jamais « exact » par défaut).
- AC-039-3 [ADP-05] : Étant donné un badge, quand l'utilisateur le survole ou le sélectionne au clavier, alors le mécanisme natif utilisé (ou son absence) est expliqué.
- AC-039-4 [NF-16] : Étant donné les badges, quand ils sont lus par un lecteur d'écran ou vus sans couleur, alors le niveau reste compréhensible (texte, pas seulement couleur).

### US-040 — Aperçu du cadrage final de l'agent
En tant que développeur solo, je veux voir le cadrage complet que l'agent va recevoir afin de vérifier avant de lancer.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-012, US-014, US-036 · Zone sensible : non
- Exigences : AGT-08

Critères d'acceptation :
- AC-040-1 [AGT-08] : Étant donné un agent avec skills, contextes, outils et portée, quand l'utilisateur ouvre l'aperçu, alors il voit le contenu exact des fichiers qui seront générés pour cet agent.
- AC-040-2 [AGT-08] : Étant donné une modification non enregistrée de l'agent, quand l'aperçu est affiché, alors il reflète la modification.
- AC-040-3 [AGT-08] : Étant donné un cadrage en erreur de validation, quand l'aperçu est demandé, alors les erreurs sont affichées à la place des parties concernées.
- AC-040-4 [AGT-08] : Étant donné l'aperçu, quand il est généré, alors aucun fichier n'est écrit sur le disque.

### US-041 — Panneau Santé du cadrage
En tant que développeur solo, je veux un panneau listant les erreurs et avertissements de mon cadrage afin de corriger les problèmes avant qu'ils fassent dériver l'IA.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-033 · Zone sensible : non
- Exigences : VAL-01

Critères d'acceptation :
- AC-041-1 [VAL-01] : Étant donné un cadrage avec erreurs et avertissements, quand l'utilisateur ouvre le panneau, alors ils sont listés séparément, avec leur nombre, triés par gravité.
- AC-041-2 [VAL-01] : Étant donné une entrée du panneau (ex. skill sans description), quand l'utilisateur clique dessus, alors l'élément concerné s'ouvre sur le champ concerné (parcours 4, §8.2).
- AC-041-3 [VAL-01] : Étant donné une correction, quand elle est enregistrée, alors l'entrée disparaît du panneau sans recharger le projet.
- AC-041-4 [VAL-01] : Étant donné un cadrage sans problème, quand le panneau s'ouvre, alors il indique « aucun problème ».

### US-042 — Détecter les skills sans description, inutilisées ou en double
En tant que développeur solo, je veux être alerté des skills sans description, inutilisées ou en double afin de garder un cadrage propre.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-041, US-012 · Zone sensible : non
- Exigences : VAL-02

Critères d'acceptation :
- AC-042-1 [VAL-02] : Étant donné une skill dont la description est absente ou vide (espaces seulement), quand le cadrage est validé, alors une alerte « sans description » est produite.
- AC-042-2 [VAL-02] : Étant donné une skill attachée à aucun agent, quand le cadrage est validé, alors un avertissement « inutilisée » est produit.
- AC-042-3 [VAL-02] : Étant donné deux skills de même nom (casse ignorée) ou de corps identique, quand le cadrage est validé, alors une alerte « en double » cite les deux.
- AC-042-4 [VAL-02] : Étant donné un projet sans agent, quand le cadrage est validé, alors les skills ne sont pas toutes signalées « inutilisées » une par une, mais par un seul avertissement global.

### US-043 — Détecter les contradictions de portée
En tant que développeur junior, je veux être alerté quand les règles de portée se contredisent afin de savoir ce que l'agent a vraiment le droit de faire.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-013, US-041 · Zone sensible : non · Débloquée le 2026-10-01 (Q-08 : option par défaut acceptée)
- Exigences : VAL-03

Critères d'acceptation (à confirmer après Q-08) :
- AC-043-1 [VAL-03] : Étant donné, pour un même agent, `src/` interdit et `src/ui/` en écriture, quand le cadrage est validé, alors une alerte de contradiction cite les deux règles.
- AC-043-2 [VAL-03] : Étant donné une règle de portée qui interdit un dossier contenant une skill ou un contexte attaché à l'agent, quand le cadrage est validé, alors une alerte est produite.
- AC-043-3 [VAL-03] : Étant donné des règles cohérentes, quand le cadrage est validé, alors aucune alerte de portée n'est produite.

### US-044 — Carte agents × skills
En tant que développeur solo, je veux une carte qui croise agents et skills afin de voir d'un coup d'œil qui utilise quoi.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-012 · Zone sensible : non
- Exigences : VAL-04

Critères d'acceptation :
- AC-044-1 [VAL-04] : Étant donné 3 agents et 5 skills, quand l'utilisateur ouvre la carte, alors chaque attachement est visible à l'intersection agent × skill.
- AC-044-2 [VAL-04] : Étant donné la carte, quand l'utilisateur active une intersection, alors la skill est attachée ou détachée (même effet qu'US-012).
- AC-044-3 [VAL-04] : Étant donné un projet sans agent ou sans skill, quand la carte s'ouvre, alors un état vide explicite s'affiche.
- AC-044-4 [NF-15] : Étant donné la carte, quand l'utilisateur la parcourt au clavier, alors chaque intersection est atteignable et activable.

### US-045 — Projets récents avec leur état de cadrage
En tant que développeur indé avec plusieurs projets, je veux voir mes projets récents et leur état de cadrage afin de reprendre vite le bon projet.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-001, US-041 · Zone sensible : non
- Exigences : PRJ-04
- Note : le contenu de « état de cadrage » est à préciser (Q-14).

Critères d'acceptation :
- AC-045-1 [PRJ-04] : Étant donné trois projets ouverts précédemment, quand l'accueil s'affiche, alors ils sont listés du plus récent au plus ancien avec leur état de cadrage.
- AC-045-2 [PRJ-04] : Étant donné un projet récent dont le dossier a été déplacé ou supprimé, quand l'accueil s'affiche, alors il est marqué introuvable et peut être retiré de la liste.
- AC-045-3 [PRJ-04] : Étant donné un projet de la liste, quand l'utilisateur clique dessus, alors il s'ouvre.
- AC-045-4 [PRJ-04] : Étant donné un fichier de projets récents corrompu, quand l'app démarre, alors la liste est vide et l'app démarre normalement.

### US-046 — Arborescence du projet
En tant que développeur solo, je veux voir l'arborescence du projet avec le cadrage mis en avant et le code source en lecture afin de m'orienter sans quitter Cadre.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-001 · Zone sensible : non
- Exigences : PRJ-05

Critères d'acceptation :
- AC-046-1 [PRJ-05] : Étant donné un projet, quand l'écran principal s'affiche, alors le cadrage (agents, skills, contextes) est présenté en premier, séparé du code source.
- AC-046-2 [PRJ-05] : Étant donné un fichier de code source, quand l'utilisateur l'ouvre, alors il s'affiche en lecture seule, sans possibilité de modification.
- AC-046-3 [PRJ-05] : Étant donné le projet de référence (10 000 fichiers), quand l'arborescence s'affiche, alors l'interface reste réactive (chargement progressif des dossiers).
- AC-046-4 [PRJ-05] : Étant donné des dossiers ignorés par Git (`node_modules`, etc.), quand l'arborescence s'affiche, alors ils sont repliés par défaut.

### US-047 — Recharger le cadrage modifié hors de l'app
En tant que développeur qui édite aussi dans VS Code, je veux que Cadre recharge le cadrage modifié à l'extérieur afin de ne jamais travailler sur une version périmée.
- Étape : MVP 1 · Estimation : 5 points · Dépendances : SP-07, US-006 · **Zone sensible : oui (fichiers modifiés par l'utilisateur) → porte 3**
- Exigences : PRJ-07

Critères d'acceptation :
- AC-047-1 [PRJ-07] : Étant donné un projet ouvert, quand un fichier de `.cadre/` est modifié par un autre programme, alors le modèle est rechargé et l'interface mise à jour.
- AC-047-2 [PRJ-07] : Étant donné une écriture faite par Cadre lui-même, quand l'événement de surveillance arrive, alors elle n'est pas traitée comme une écriture externe.
- AC-047-3 [PRJ-07] : Étant donné une modification externe qui rend un fichier invalide, quand le rechargement a lieu, alors l'erreur est affichée et le dernier modèle valide reste affiché, sans réécriture automatique.
- AC-047-4 [PRJ-07] : Étant donné une rafale de modifications (ex. `git checkout` qui change 50 fichiers), quand elle a lieu, alors un seul rechargement est effectué après stabilisation.
- AC-047-5 [PRJ-07] : Étant donné un fichier généré (ex. `CLAUDE.md`) modifié à l'extérieur, quand la modification est détectée, alors elle est traitée selon la règle de Q-03.
- AC-047-6 [NF-05] : AC-047-1, AC-047-2 et AC-047-4 passent en CI sur Windows et macOS.

### US-048 — Résoudre un conflit entre Cadre et l'extérieur
En tant que développeur qui édite aussi dans VS Code, je veux choisir quelle version garder quand un fichier a été modifié à la fois dans Cadre et à l'extérieur afin de ne rien perdre.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-047 · **Zone sensible : oui (écritures, fichiers de l'utilisateur) → porte 3**
- Exigences : PRJ-08

Critères d'acceptation :
- AC-048-1 [PRJ-08] : Étant donné une modification non enregistrée dans Cadre et une modification externe du même fichier, quand la modification externe est détectée, alors le diff entre les deux versions est affiché.
- AC-048-2 [PRJ-08] : Étant donné le conflit, quand l'utilisateur garde la version de Cadre, alors elle est écrite et la version externe est conservée comme version précédente (NF-13).
- AC-048-3 [PRJ-08] : Étant donné le conflit, quand l'utilisateur garde la version externe, alors les modifications de Cadre sont abandonnées après confirmation.
- AC-048-4 [PRJ-08] : Étant donné un conflit non résolu, quand l'utilisateur tente d'enregistrer ou d'exporter, alors l'action est bloquée jusqu'à résolution.
- AC-048-5 [PRJ-08] : Étant donné un fichier supprimé à l'extérieur pendant qu'il est modifié dans Cadre, quand la suppression est détectée, alors l'utilisateur choisit entre le recréer et abandonner.

### US-049 — Branche courante et fichiers de cadrage modifiés
En tant que développeur solo, je veux voir la branche courante et les fichiers de cadrage modifiés depuis le dernier commit afin de savoir ce que je dois commiter.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-001 · Zone sensible : non
- Exigences : GIT-01

Critères d'acceptation :
- AC-049-1 [GIT-01] : Étant donné un projet Git sur la branche `main`, quand l'écran principal s'affiche, alors `main` est affiché.
- AC-049-2 [GIT-01] : Étant donné des fichiers de cadrage (`.cadre/`, fichiers générés) modifiés et non commités, quand l'écran s'affiche, alors ils sont listés, et les fichiers de code modifiés ne le sont pas.
- AC-049-3 [GIT-01] : Étant donné une HEAD détachée ou un projet sans Git, quand l'écran s'affiche, alors l'état correspondant est indiqué sans erreur.
- AC-049-4 [GIT-01] : Étant donné un changement de branche fait à l'extérieur, quand il a lieu, alors l'affichage est mis à jour.

### US-050 — Réglages : éditeur externe, chemins des CLI, thème, langue
En tant que développeur solo, je veux régler mon éditeur externe, les chemins des CLI, le thème et la langue afin d'adapter Cadre à mon poste.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : US-018 · Zone sensible : non
- Exigences : ACC-03, NF-17

Critères d'acceptation :
- AC-050-1 [ACC-03] : Étant donné l'écran Réglages, quand l'utilisateur change le thème (sombre par défaut, clair), alors l'interface change immédiatement et le choix persiste au redémarrage.
- AC-050-2 [NF-17] : Étant donné la langue réglée sur anglais, quand l'utilisateur parcourt l'app, alors tous les textes de l'interface sont en anglais ; idem en français.
- AC-050-3 [ACC-03] : Étant donné un chemin d'éditeur externe ou de CLI invalide, quand l'utilisateur l'enregistre, alors il est refusé avec la raison.
- AC-050-4 [ACC-03] : Étant donné un fichier de réglages corrompu, quand l'app démarre, alors les valeurs par défaut sont utilisées et l'utilisateur est averti.

### US-051 — Annuler la dernière écriture d'un fichier de cadrage
En tant que développeur solo, je veux annuler la dernière écriture d'un fichier de cadrage afin de revenir en arrière après une erreur.
- Étape : MVP 1 · Estimation : 2 points · Dépendances : US-005 · **Zone sensible : oui (écritures atomiques) → porte 3**
- Exigences : NF-13
- Note : seule NF transformée en story, car « annulation possible » est une action visible de l'utilisateur ; à confirmer par le PO (Q-15).

Critères d'acceptation :
- AC-051-1 [NF-13] : Étant donné un fichier de cadrage réécrit par Cadre, quand l'utilisateur demande l'annulation, alors la version précédente est restaurée de façon atomique.
- AC-051-2 [NF-13] : Étant donné un fichier sans version précédente (créé par la dernière écriture), quand l'utilisateur annule, alors Cadre propose de le supprimer.
- AC-051-3 [NF-13] : Étant donné un fichier modifié à l'extérieur depuis la dernière écriture de Cadre, quand l'utilisateur annule, alors un conflit est présenté (US-048) au lieu d'écraser.

### US-052 — Installer la bêta signée sur Windows et macOS
En tant que bêta-testeur, je veux installer Cadre sans alerte de sécurité bloquante afin de l'essayer en confiance.
- Étape : MVP 1 · Estimation : 3 points · Dépendances : toutes les stories Must du MVP 1 ; débloquée le 2026-10-01 (Q-12 : option par défaut acceptée) · **Zone sensible : oui (signature) → porte 3**
- Exigences : NF-05, NF-09

Critères d'acceptation :
- AC-052-1 [NF-09] : Étant donné l'installeur macOS, quand il est vérifié, alors il est signé et notarisé, et s'ouvre sans alerte bloquante sur macOS 13+ Intel et Apple Silicon.
- AC-052-2 [NF-09] : Étant donné l'installeur Windows, quand il est vérifié, alors il est signé et s'installe sur Windows 10 et 11.
- AC-052-3 [NF-05] : Étant donné la CI, quand une version est construite, alors les installeurs des deux systèmes sont produits par le pipeline, sans étape manuelle autre que la fourniture des secrets de signature.
- AC-052-4 [NF-09] : Étant donné les secrets de signature, quand la CI les utilise, alors ils ne sont jamais affichés dans les journaux ni versionnés.

---

## 7. Détail des stories — MVP 1 Should

### US-053 — Historique des exécutions
En tant que développeur solo, je veux consulter l'historique des exécutions de chaque agent afin de comprendre ce qui s'est passé.
- Étape : MVP 1 (Should) · Estimation : 3 points · Dépendances : US-023 · Zone sensible : non
- Exigences : RUN-09
- AC-053-1 [RUN-09] : Étant donné une exécution terminée, quand l'utilisateur ouvre l'onglet Historique de l'agent, alors il voit tâche, durée, fichiers touchés, statut et code de sortie.
- AC-053-2 [RUN-09] : Étant donné l'historique, quand il est écrit, alors il se trouve dans `.cadre/runs/`, ignoré par Git.
- AC-053-3 [RUN-09] : Étant donné une exécution interrompue par un plantage, quand l'app redémarre, alors elle apparaît avec le statut « interrompue ».
- AC-053-4 [RUN-09] : Étant donné un fichier d'historique corrompu, quand il est lu, alors l'entrée est ignorée avec un avertissement et le reste s'affiche.

### US-054 — Prévisualiser le diff avant d'écrire les fichiers générés
En tant que développeur expérimenté, je veux voir le diff des fichiers générés avant qu'ils soient écrits afin de valider ce que Cadre change dans mon dépôt.
- Étape : MVP 1 (Should) · Estimation : 3 points · Dépendances : US-009 · Zone sensible : non
- Exigences : ADP-06
- AC-054-1 [ADP-06] : Étant donné des changements dans le modèle, quand l'utilisateur demande l'export, alors le diff de chaque fichier généré (créé, modifié, supprimé) s'affiche avant écriture.
- AC-054-2 [ADP-06] : Étant donné la prévisualisation, quand l'utilisateur annule, alors aucun fichier n'est écrit.
- AC-054-3 [ADP-06] : Étant donné un export sans changement, quand il est demandé, alors « rien à écrire » s'affiche.
- AC-054-4 [ADP-01] : Le diff est calculé par l'opération « calculer le diff » de l'adaptateur.

### US-055 — Exporter vers le format générique (SKILL.md, AGENTS.md)
En tant que développeur multi-outils, je veux exporter mon cadrage au format générique afin que d'autres outils le lisent.
- Étape : MVP 1 (Should) · Estimation : 3 points · Dépendances : US-009 · **Zone sensible : oui (écritures atomiques) → porte 3**
- Exigences : ADP-03, NF-19
- AC-055-1 [ADP-03] : Étant donné le format générique activé, quand l'utilisateur exporte, alors `AGENTS.md` et les `SKILL.md` sont générés.
- AC-055-2 [ADP-03] : Étant donné un `AGENTS.md` importé puis exporté sans modification, quand on compare, alors il est identique.
- AC-055-3 [NF-19] : Étant donné l'ajout de cet adaptateur, quand on examine les changements, alors aucun fichier du cœur n'a été modifié en dehors de l'enregistrement de l'adaptateur.
- AC-055-4 [ADP-03] : Étant donné les deux adaptateurs actifs, quand l'export échoue pour l'un, alors aucun fichier d'aucun adaptateur n'est écrit.

### US-056 — Gérer les fichiers annexes d'une skill
En tant que développeur indé, je veux ajouter, renommer et supprimer les fichiers annexes d'une skill afin de la compléter (scripts, exemples).
- Étape : MVP 1 (Should) · Estimation : 3 points · Dépendances : US-032 · Zone sensible : non
- Exigences : SKL-04
- AC-056-1 [SKL-04] : Étant donné une skill, quand l'utilisateur ajoute un fichier annexe, alors il est copié dans le dossier de la skill.
- AC-056-2 [SKL-04] : Étant donné un fichier annexe, quand il est renommé ou supprimé (après confirmation), alors le dossier de la skill est mis à jour.
- AC-056-3 [SKL-04] : Étant donné un nom de fichier déjà présent, quand l'utilisateur ajoute un fichier du même nom, alors il choisit entre remplacer et renommer.
- AC-056-4 [SKL-04] : Étant donné un fichier hors du dossier de la skill (lien symbolique sortant), quand il est détecté, alors un avertissement est affiché.

### US-057 — Estimer la taille du contexte envoyé à l'IA
En tant que développeur solo, je veux voir la taille estimée du contexte de chaque agent et être alerté s'il est trop gros afin d'éviter un agent qui perd le fil.
- Étape : MVP 1 (Should) · Estimation : 2 points · Dépendances : US-040 · Zone sensible : non
- Exigences : CTX-04 · Note : seuil d'alerte à définir (Q-16).
- AC-057-1 [CTX-04] : Étant donné un agent, quand l'aperçu s'affiche, alors la taille estimée du cadrage reçu est indiquée.
- AC-057-2 [CTX-04] : Étant donné une taille au-dessus du seuil, quand elle est calculée, alors un avertissement apparaît dans le panneau Santé.
- AC-057-3 [CTX-04] : Étant donné l'estimation, quand elle est affichée, alors il est précisé qu'il s'agit d'une estimation.

### US-058 — Ouvrir un fichier dans l'éditeur externe
En tant que développeur solo, je veux ouvrir un fichier dans mon éditeur habituel afin de modifier le code sans quitter mon flux de travail.
- Étape : MVP 1 (Should) · Estimation : 1 point · Dépendances : US-050, US-046 · Zone sensible : non
- Exigences : PRJ-06
- AC-058-1 [PRJ-06] : Étant donné un éditeur externe réglé, quand l'utilisateur choisit « Ouvrir dans l'éditeur », alors le fichier s'ouvre dans cet éditeur.
- AC-058-2 [PRJ-06] : Étant donné aucun éditeur réglé, quand l'utilisateur choisit l'action, alors l'application par défaut du système est utilisée.
- AC-058-3 [PRJ-06] : Étant donné un éditeur introuvable, quand l'action échoue, alors un message propose de corriger le réglage.

### US-059 — Assistant de rédaction du contexte par sections
En tant que développeur junior, je veux être guidé section par section pour rédiger mon contexte de projet afin de ne rien oublier d'important.
- Étape : MVP 1 (Should) · Estimation : 3 points · Dépendances : US-035 · Zone sensible : non
- Exigences : CTX-02 · Note : liste des sections à valider (Q-16).
- AC-059-1 [CTX-02] : Étant donné un nouveau contexte de type projet, quand l'utilisateur lance l'assistant, alors les sections proposées s'affichent une à une avec une aide courte.
- AC-059-2 [CTX-02] : Étant donné une section laissée vide, quand l'assistant se termine, alors elle n'est pas écrite dans le fichier.
- AC-059-3 [CTX-02] : Étant donné un contexte existant, quand l'utilisateur ouvre l'assistant, alors son contenu n'est jamais écrasé sans confirmation.

### US-060 — Mise à jour automatique signée
En tant que bêta-testeur, je veux recevoir les mises à jour automatiquement et en sécurité afin de toujours avoir la dernière version sans risque.
- Étape : MVP 1 (Should) · Estimation : 5 points · Dépendances : US-052 · **Zone sensible : oui (signature et mise à jour) → porte 3**
- Exigences : ACC-04, NF-09
- AC-060-1 [ACC-04] : Étant donné une nouvelle version publiée, quand l'app démarre en ligne, alors l'utilisateur est informé et peut installer.
- AC-060-2 [ACC-04] : Étant donné une mise à jour dont la signature est invalide ou absente, quand elle est téléchargée, alors elle est refusée et rien n'est installé.
- AC-060-3 [ACC-04] : Étant donné une exécution d'agent en cours, quand une mise à jour est prête, alors l'installation est différée jusqu'à la fin de l'exécution.
- AC-060-4 [NF-14] : Étant donné l'app hors ligne, quand elle démarre, alors l'absence de vérification de mise à jour ne produit aucune erreur bloquante.
- AC-060-5 [ACC-04] : Étant donné un téléchargement interrompu, quand l'app redémarre, alors la version installée est intacte.

---

## 8. Exigences non fonctionnelles transverses

Les NF ne deviennent pas des stories (sauf NF-13 « annulation », voir US-051, et l'enabler de livraison US-052). Elles deviennent :

| NF | Traitement | Où |
| --- | --- | --- |
| NF-01, NF-02, NF-03 | Critère de jalon, mesuré automatiquement après SP-03 | Point de DoD à ajouter **après SP-03** : « aucune régression de performance au-delà de la tolérance de l'ADR » ; recette §13.1 |
| NF-04 | Spike | SP-03 |
| NF-05 | Point de DoD | Toute story MVP 1 : CI verte sur Windows et macOS ; obligatoire pour les zones sensibles (critères AC-xxx « passent en CI sur Windows et macOS ») |
| NF-06 | Critère transverse | US-017 (liste des versions testées), tests de compatibilité à chaque nouvelle version de CLI |
| NF-07 | Critère transverse + DoD | US-020 (rappel à la première exécution) ; DoD : aucun appel réseau vers un serveur de Cadre (vérifié en revue) |
| NF-08 | Critère transverse | Aucun secret stocké au MVP 1 (la CLI gère sa propre connexion) ; s'applique à US-068 (V1) ; zone sensible « stockage des clés » |
| NF-09 | Enabler de livraison | US-052, US-060 |
| NF-10 | Critère transverse | AC-020-2 ; revue : aucun chemin de code ne lance un agent sans action explicite |
| NF-11 | Critère transverse | US-014, US-016, US-039 ; DoD de toute story touchant aux permissions : aucun « garanti » sans preuve SP-02 + test d'intégration |
| NF-12 | Critère transverse + DoD | US-005 (mécanisme), toute story qui écrit un fichier passe par l'écrivain atomique (vérifié en revue) |
| NF-13 | Critère transverse + story | AC-005-5 (conservation), US-051 (annulation) |
| NF-14 | Point de DoD | Toute fonctionnalité hors exécution fonctionne sans réseau (test hors ligne) |
| NF-15 | Point de DoD | Toute story d'interface : action principale accessible au clavier ; raccourcis documentés dans une page d'aide |
| NF-16 | Point de DoD | Toute story d'interface : contrastes WCAG 2.1 AA ; libellés accessibles aux lecteurs d'écran |
| NF-17 | Point de DoD | Tout texte d'interface passe par l'i18n, en français et en anglais (US-050 pour le choix de langue) |
| NF-18 | Point de DoD (déjà présent) | Couverture du cœur ≥ 70 % |
| NF-19 | Critère transverse | AC-008-6, AC-004-4, AC-055-3 ; revue : aucun code propre à un outil hors de son adaptateur |
| Qualité « plantages < 0,1 % » (§2) | Non mesurable au MVP 1 sans télémétrie | Voir Q-17 |

---

## 9. Proposition de découpage en sprints

**Proposition indicative ; Sprint 1 retenu tel quel le 2026-10-01 (porte 2 déléguée) ; Sprint 2 replanifié le 2026-10-01 (voir ci-dessous) ; sprints suivants à replanifier selon la vélocité (Sprint 1 : 11 points).** La vélocité est inconnue : le Sprint 1 est volontairement modeste (11 points) pour l'étalonner. Les sprints suivants seront redimensionnés selon la vélocité mesurée.

| Sprint | Sprint Goal proposé | Contenu | Points |
| --- | --- | --- | --- |
| **1** | **« J'ouvre un projet Claude Code existant, je vois ses skills et son CLAUDE.md, et Cadre enregistre un premier modèle `.cadre/` qui ne peut pas être corrompu. »** | SP-01 (2), US-001 (2), US-002 (2), US-003 (2), US-005 (3, zone sensible) | 11 |
| **2 (retenu le 2026-10-01)** | **« J'enregistre mon cadrage dans .cadre/ depuis l'application, je le retrouve en rouvrant le projet, et je crée mon premier agent. »** | US-077 (3, sensible), US-006 (3), US-007 (2), US-076 (2, sensible), SP-02 (3) | 13 |
| 2 (proposition initiale, remplacée) | « Je crée un agent et Cadre génère son fichier Claude Code. » | US-004 (3), US-006 (3), US-007 (2), US-008 (3, sensible), SP-02 (3) | 14 |
| 3 | « Un projet existant fait l'aller-retour Cadre → Claude Code sans perte » (**porte MVP 0**) | US-009 (3, sensible), US-010 (3), US-011 (2, sensible), SP-03 (2) | 10 |
| 4 | « Je cadre un agent (skills, portée, outils) et je sais ce qui est garanti. » | US-012 (2), US-013 (3), US-014 (3), US-015 (2), US-016 (3), US-017 (3) | 16 |
| 5 | « Je lance un agent dans un worktree isolé et je suis sa sortie. » | SP-05 (3), SP-06 (3), US-019 (3), US-020 (3), US-021 (3), US-022 (2) | 17 |
| 6 | « Je vois ce que l'agent a changé, les violations sont signalées et je peux tout rejeter. » | US-023 (3), US-024 (2), US-025 (3), US-026 (3), US-018 (2) | 13 |
| 7 | « J'accepte ou je rejette le travail de l'agent et je l'arrête proprement » (**boucle centrale fermée**) | US-027 (5), US-028 (3), US-029 (5), US-030 (3) | 16 |
| 8 | « J'édite mes skills et contextes dans l'app avec validation. » | SP-04 (2), US-031 (3), US-032 (3), US-033 (3), US-034 (1), US-035 (3), US-036 (2) | 17 |
| 9 | « Je vois la santé de mon cadrage et l'aperçu de chaque agent. » | US-039 (2), US-040 (3), US-041 (3), US-042 (3), US-043 (3), US-044 (3) | 17 |
| 10 | « Cadre suit mes modifications externes sans rien perdre. » | US-037 (2), US-038 (3), SP-07 (2), US-047 (5), US-048 (3), US-051 (2) | 17 |
| 11 | « La bêta est installable et confortable » (**porte MVP 1** si Must terminés) | US-045 (2), US-046 (3), US-049 (2), US-050 (3), US-052 (3) | 13 |
| 12+ | Should du MVP 1 selon la valeur mesurée en bêta | US-053 à US-060 | 23 |

Remarques :
- Les sprints 5 à 7 concentrent les zones sensibles (processus, worktrees) : chacune exige deux revues `relecteur` et la porte 3, ce qui ralentit le débit ; il vaut mieux les traiter tôt que juste avant la bêta.
- SP-02 est placé au Sprint 2 car il conditionne tout le marquage de garantie (NF-11), principal risque produit (« faux sentiment de sécurité »). Le PO peut choisir de l'avancer au Sprint 1.
- La boucle centrale est fermée à la fin du Sprint 7, avant les éditeurs visuels : on prouve d'abord la valeur différenciante (exécution surveillée), puis le confort d'édition.

---

## 10. Dette technique

Points relevés le 2026-10-01, non transformés en stories (le message dédié pour un dossier de cadrage lié est devenu US-079). À reprendre au Sprint Planning ou dans la story concernée.

| Point | À traiter |
| --- | --- |
| Ouverture en double possible (double clic) — US-001 | à planifier |
| Import des contextes en double possible — US-003 | à planifier |
| Liens symboliques sur les fichiers cibles et conservation des droits | avant US-008 / US-009 |
| Casse de `claude.md` à vérifier | en SP-02 |
| IPC binaire (`tauri::ipc::Response`) | pour US-004 |
| Couverture Rust non mesurée | à planifier |
| Commandes d'écriture synchrones | à planifier |
| `lire_fichier_projet` : lecture bornée et asynchrone — US-076 | à planifier |
| Ouverture des fichiers avec `O_NOFOLLOW` — US-076 | à planifier |
| Faux `InMemoryProjectFiles` à aligner sur le motif `outside-project` — US-076 | à planifier |
| Test « racine = sous-dossier » — US-076 | à planifier |
| Noms spéciaux Windows `CONIN$` et `CONOUT$` — US-076 | à planifier |
| `tools.terminal: {}` dans `agent.json` accepte n'importe quelle valeur — US-006 | avant US-015 |
| Bouton de réparation d'un modèle incomplet — US-006 | à planifier |
| Contrôles d'unicité de D11 ([ADR-001](ADR-001-format-cadre-v1)) — US-006 | à planifier |

---

**Backlog validé (porte 1) le 2026-10-01. Sprint 1 retenu tel que proposé ci-dessus (porte 2 déléguée).**
