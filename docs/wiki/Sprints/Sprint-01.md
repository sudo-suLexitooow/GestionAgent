# Sprint 01 — J'ouvre un projet Claude Code existant, je vois ses skills et son CLAUDE.md, et Cadre enregistre un premier modèle .cadre/ qui ne peut pas être corrompu
Début : 2026-10-01 · Fin : 2026-10-01 · Statut : terminé

## Planning (porte 2 déléguée à l'orchestrateur par le PO, 2026-10-01)
| Story | Titre | Points | Statut | PR |
| --- | --- | --- | --- | --- |
| SP-01 | Spike : format `.cadre/` (schéma YAML, versionnage) | 2 | Done | — (livrable [ADR-001](ADR-001-format-cadre-v1)) |
| US-001 | Ouvrir un dossier de projet | 2 | Done (2026-10-01) | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) |
| US-002 | Lister les skills du projet | 2 | Done (2026-10-01) | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) |
| US-003 | Importer CLAUDE.md et AGENTS.md comme contextes | 2 | Done (2026-10-01) | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) |
| US-005 | Enregistrer le modèle `.cadre/` de façon atomique (zone sensible : porte 3) | 3 | Done (2026-10-01) | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) |

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

- Fait (clôture) :
  - US-005 mergée (PR #4, merge `b2ac398`). 3 tours de deux revues `relecteur` indépendantes (6 revues) ; toutes deux ACCEPTÉ aux révisions 3 et 4. 3 points Done.
  - Principales corrections issues des revues : résolution sûre unique `src-tauri/src/fs_atomique/acces.rs` (aucun lien ni jonction suivi ; R1 sur chaque segment : noms Windows réservés, noms courts 8.3, caractères ignorés par HFS+, `.git`, 255 octets) ; test d'architecture (`architecture_fichiers.rs`) qui interdit tout accès fichier hors de cette résolution ; racine du projet tenue côté Rust (`ouvrir_projet`) ; verrou entre instances `.cadre/tmp/verrou` (permanent, jamais supprimé) ; récupération à l'ouverture qui ne bloque jamais l'ouverture (avertissement) ; mise de côté `de-cote-txn-…` des transactions irrécupérables ; nouvelle tentative sur les erreurs d'entrée-sortie ; journal et index ≤ 1 Mio.
  - Porte 3 tenue par l'orchestrateur (délégation du PO) ; résumé en langage simple au PO dans le compte rendu de sprint.
  - Décision (orchestrateur, au titre de la délégation, présentée au PO) : le test `…_arborescence_strictement_identique` est renommé `test_ac_005_3_echec_dans_un_projet_sans_cadre_seul_residu_le_verrou_vide` : après un premier enregistrement raté, seul `.cadre/tmp/verrou` vide subsiste (conséquence du verrou permanent).
  - [ADR-001](ADR-001-format-cadre-v1) : écarts constatés passés « en vigueur ».
- Prévu : Sprint 2 ([Sprint-02](Sprint-02)).
- Obstacles : publication du wiki GitHub toujours en échec (première page non créée par le PO).
- Sprint Goal atteint : oui côté code (voir Sprint Review).

## Sprint Review
Porte 4 déléguée à l'orchestrateur ; tenue le 2026-10-01.

- Ce que l'utilisateur peut maintenant faire : ouvrir un projet (sélecteur ou glisser-déposer), voir ses skills, se voir proposer l'import de `CLAUDE.md` / `AGENTS.md` (modèle en mémoire). L'enregistrement `.cadre/` atomique existe côté système mais n'a pas encore de bouton dans l'interface (US-077, Sprint 2).
- Décision (orchestrateur, délégation du PO) : SP-01, US-001, US-002, US-003, US-005 acceptées.
- Retours → backlog : la détection d'un modèle doit reposer sur `.cadre/cadre.yaml`, pas sur le dossier `.cadre/`. Intégré comme critère supplémentaire (et non comme story US-078) : AC-006-6 et AC-077-4 « un dossier `.cadre/` sans `cadre.yaml` (p. ex. seulement `tmp/verrou`) n'est pas un modèle : l'import est proposé ».
- Risque résiduel d'US-005 (zone sensible, accepté au titre de la porte 3) :
  - coupure de courant réelle non testée ;
  - pas de fsync de dossier sous Windows ;
  - fichier verrouillé par un antivirus → échec et annulation ;
  - systèmes de fichiers réseau ou synchronisés non garantis ;
  - courses de quelques millisecondes possibles ;
  - un journal forgé livré avec un dépôt peut modifier un fichier du projet au contenu connu ;
  - une webview compromise peut ouvrir un autre dossier ;
  - R1 partielle (NFC) et appliquée aussi aux lectures ;
  - `.gitignore` ou cible en lien → enregistrement refusé ;
  - erreur d'entrée-sortie persistante pendant une reprise → `ANNULATION_INCOMPLETE` répété.

## Rétrospective
- Ce qui a bien marché : TDD tenu ; revues indépendantes efficaces (failles réelles trouvées avant merge) ; CI sur 3 OS qui a attrapé des défauts Windows.
- Ce qui a mal marché : US-005 a demandé 4 tours de revue, faute de checklist de sécurité fichiers en amont ; conflits entre branches parallèles touchant `lib.rs` / `Cargo.toml` ; disque du conteneur saturé ; wiki GitHub non publié (amorçage manquant côté PO).
- Actions (responsable → vérification au Sprint 2) :
  - (a) Checklist « sécurité fichiers » ajoutée au brief des développeurs — orchestrateur → le `relecteur` vérifie qu'aucune revue du Sprint 2 ne trouve de faille relevant de la checklist.
  - (b) Ne pas paralléliser deux stories qui touchent `lib.rs` / `Cargo.toml` ; merger `main` dans la branche avant la revue — orchestrateur → nombre de conflits au Sprint 2.
  - (c) Cible cargo partagée `/home/user/.cargo-target-cadre` et nettoyage des worktrees après merge — orchestrateur → pas de disque saturé au Sprint 2.
  - (d) Relancer le PO pour la création de la première page du wiki GitHub — orchestrateur → wiki publié au Sprint 2.

## Vélocité
Planifié : 11 pts · Done : 11 pts (SP-01, US-001, US-002, US-003, US-005)
