# Cahier des charges — Cadre

Oct 1, 2026 · @YNGLXS

## 1. Présentation du projet

Cadre (nom provisoire) est une application desktop qui centralise le cadrage d'un projet développé avec des agents IA : skills, contexte, agents et leurs règles, dans une seule interface, avec la possibilité de lancer les agents depuis l'app.

### 1.1 Contexte

Le « vibe coding » consiste à déléguer l'écriture du code à des agents IA (Claude Code, Codex, etc.). Pour que ces agents produisent un travail fiable, il faut les cadrer : fichiers de contexte (AGENTS.md, CLAUDE.md), skills (SKILL.md), conventions, permissions. Ce cadrage est aujourd'hui éparpillé dans des fichiers Markdown répartis dans le dépôt, propres à chaque outil.

### 1.2 Problème

- Aucune vue d'ensemble : on ne sait pas quel agent utilise quelle skill, ni ce qu'il a le droit de toucher.
- Chaque outil a son format et son emplacement : passer de Claude Code à Codex oblige à tout dupliquer.
- Un cadrage flou ou contradictoire fait dériver l'IA : fichiers modifiés hors périmètre, conventions ignorées, PR trop grosses.
- L'édition se fait à la main, sans validation : une faute dans un en-tête YAML casse une skill sans avertissement.

### 1.3 Vision

Vibe coder en gardant le contrôle. Cadre est la couche « en dessous » de Git : Git versionne le code et le cadrage, Cadre sert à concevoir, éditer, vérifier et exécuter ce cadrage.

### 1.4 Proposition de valeur

- Une vue unique et lisible de tout ce qui encadre l'IA dans un projet.
- Un panneau par agent pour ajouter ou retirer des paramètres, skills, outils et zones autorisées en quelques clics.
- Un seul modèle de cadrage, exporté automatiquement vers les formats de Claude Code, Codex et le format générique.
- Le lancement des agents depuis l'app, avec le cadrage appliqué et le suivi de ce qu'ils modifient.

## 2. Objectifs et indicateurs de succès

L'objectif est de prouver la valeur du produit avec un MVP gratuit centré sur Claude Code, puis d'ajouter Codex, puis la monétisation. Les valeurs cibles ci-dessous sont des hypothèses à valider.

| Objectif | Indicateur | Cible (hypothèse) | Échéance |
| --- | --- | --- | --- |
| Livrer le MVP 1 | Exigences « Must » terminées et recettées | 100 % | Jalon MVP 1 |
| Faire gagner du temps | Temps pour cadrer un nouveau projet, comparé à une configuration manuelle des mêmes fichiers | Au moins 2 fois plus rapide | Tests bêta |
| Surveiller la dérive | Modifications hors portée signalées après exécution, sur le jeu de tests de référence (création, modification, suppression, renommage) | 100 % des cas du jeu de tests | Jalon MVP 1 |
| Adoption | Utilisateurs actifs mensuels | \[À DÉFINIR\] | 6 mois après MVP 1 |
| Monétisation | Taux de conversion gratuit vers Pro | \[À DÉFINIR\] | 12 mois après la V1 commerciale |
| Rétention | Utilisateurs encore actifs à 30 jours | \[À DÉFINIR\] | Suivi continu |
| Qualité | Plantages par session | < 0,1 % | Suivi continu |

## 3. Cible et positionnement

La cible prioritaire est le développeur solo qui code déjà avec des agents IA et veut garder la main sur leur comportement. Les équipes sont une cible secondaire, prévue après le MVP.

### 3.1 Personas

| Persona | Profil | Besoin principal | Frustration actuelle |
| --- | --- | --- | --- |
| Le dev indé | Développeur freelance ou indie hacker, plusieurs projets en parallèle | Lancer vite un projet bien cadré et réutiliser ses skills | Recopie ses fichiers de contexte de projet en projet |
| L'étudiant ou junior | Apprend en déléguant beaucoup à l'IA | Comprendre et contrôler ce que fait l'agent | L'agent modifie des fichiers qu'il ne devrait pas toucher |
| Le dev multi-outils | Alterne entre Claude Code et Codex | Un seul cadrage pour tous ses outils | Doit maintenir CLAUDE.md et AGENTS.md en double |

### 3.2 Analyse concurrentielle

| Solution | Ce qu'elle fait | Ce qui manque par rapport à Cadre |
| --- | --- | --- |
| Skills managers (applis desktop open source) | Gèrent et synchronisent une bibliothèque de skills entre outils | Pas de gestion des agents, de leur portée ni de leur exécution |
| Gestionnaires MCP pour Claude Code | Gèrent les serveurs MCP, commandes et skills | Centrés sur un seul outil, pas de vue projet complète |
| App Codex (OpenAI) | Centre de pilotage d'agents en parallèle, revue des diffs | Centrée exécution, pas d'édition structurée du cadrage, un seul fournisseur |
| Devin Desktop | Plusieurs agents dans une même fenêtre | Centré exécution, pas sur le cadrage |
| Éditeurs IA (Cursor, VS Code + Copilot) | Éditent le code avec un agent intégré | Cadrage géré comme des fichiers texte ordinaires |

### 3.3 Positionnement

Cadre n'est ni un éditeur de code ni un simple gestionnaire de skills. C'est l'outil de conception et de surveillance du cadrage, indépendant du fournisseur d'IA, qui exécute ensuite les agents dans ce cadre.

**Niveau de contrôle retenu : configuration et surveillance.** Cadre configure les agents et vérifie après coup ce qu'ils ont modifié. Il ne garantit pas le blocage : quand une restriction doit être empêchée techniquement, Cadre s'appuie sur les mécanismes natifs de l'outil cible (règles de permission, sandbox) et indique clairement si la règle est appliquée exactement, approximativement ou pas du tout. Un sandbox propre à Cadre est hors périmètre.

Face à la simplicité des fichiers natifs (« pourquoi installer une app pour modifier CLAUDE.md ? »), la valeur de Cadre repose sur ce que VS Code, Markdown et Git n'offrent pas ensemble : la visualisation, la validation, le multi-outils et l'exécution surveillée.

## 4. Périmètre

Le produit se construit en quatre étapes. Chacune doit être utilisable seule ; on ne passe à la suivante que si la précédente a prouvé sa valeur. Le cœur à démontrer en premier est une seule boucle complète : cadrer un agent, générer sa configuration, le lancer, voir exactement ce qu'il a modifié, détecter une violation et restaurer si besoin.

### 4.1 MVP 0 — Prototype

Objectif : prouver que le modèle de cadrage fonctionne.

- Ouvrir un projet, détecter CLAUDE.md et les skills existantes.
- Créer un agent, enregistrer le modèle `.cadre/`.
- Exporter vers Claude Code.

### 4.2 MVP 1 — Produit utilisable (gratuit)

Objectif : boucle complète sur Claude Code, distribuée en bêta gratuite sur Windows et macOS.

- Éditeurs visuels des skills, du contexte et des agents ; permissions déclaratives.
- Panneau Santé du cadrage, carte agents × skills, aperçu du cadrage final.
- Lancement d'un agent à la fois dans un worktree Git dédié, terminal intégré.
- Liste des changements, diff, détection des modifications hors portée, acceptation ou restauration.

### 4.3 MVP 2 — Multi-outils

- Adaptateur Codex : import et export.
- Modèle de capacités visible dans l'interface (exact, approximation, non supporté).
- Bibliothèque personnelle de skills, modèles d'agents.

### 4.4 V1 commerciale

- Comptes, offre Pro, paiement.
- Linux.
- Statistiques d'usage opt-in, documentation complète.

### 4.5 Hors périmètre de toutes ces étapes

- Sandbox propre à Cadre : le blocage technique reste délégué aux outils cibles.
- Collaboration en équipe, version web ou mobile.
- Éditeur de code complet et gestion complète de Git (merge, rebase, historique détaillé).
- Hébergement de modèles IA : l'utilisateur utilise ses propres abonnements.
- Exécution d'agents dans un projet sans Git.

### 4.6 Versions futures envisagées

- Marketplace de skills, synchronisation cloud, exécution parallèle, suggestions IA.
- Offre équipe avec cadrage partagé et rôles.
- Autres outils (Cursor, Gemini CLI) selon la demande.

## 5. Exigences fonctionnelles

Les priorités MoSCoW sont données par rapport au MVP 1 : Must (indispensable), Should (important), Could (souhaitable), Won't (pas avant une étape ultérieure). La colonne Étape indique quand l'exigence est livrée.

### 5.1 Gestion des projets

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| PRJ-01 | Ouvrir un dossier de projet local via un sélecteur ou un glisser-déposer | Must | MVP 0 |
| PRJ-02 | Détecter et importer le cadrage existant (CLAUDE.md, .claude/skills/, AGENTS.md) | Must | MVP 0 |
| PRJ-03 | Créer un projet à partir d'un modèle de cadrage | Should | MVP 2 |
| PRJ-04 | Liste des projets récents avec leur état de cadrage | Must | MVP 1 |
| PRJ-05 | Arborescence du projet, cadrage mis en avant, code source en lecture | Must | MVP 1 |
| PRJ-06 | Ouvrir un fichier dans l'éditeur externe de l'utilisateur | Should | MVP 1 |
| PRJ-07 | Surveiller le dossier et recharger le cadrage modifié hors de l'app, en distinguant les écritures de Cadre des écritures externes | Must | MVP 1 |
| PRJ-08 | Conflit : un fichier modifié à la fois par Cadre et à l'extérieur affiche le diff et laisse l'utilisateur choisir | Must | MVP 1 |

### 5.2 Skills

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| SKL-01 | Lister les skills du projet | Must | MVP 0 |
| SKL-02 | Créer, renommer, dupliquer et supprimer une skill | Must | MVP 1 |
| SKL-03 | Éditer une skill : formulaire pour l'en-tête, éditeur Markdown pour le corps | Must | MVP 1 |
| SKL-04 | Gérer les fichiers annexes d'une skill | Should | MVP 1 |
| SKL-05 | Valider une skill selon la spécification Agent Skills, via un validateur indépendant de l'interface | Must | MVP 1 |
| SKL-06 | Bibliothèque personnelle de skills réutilisables entre projets | Should | MVP 2 |
| SKL-07 | Importer une skill depuis un dépôt Git public ou une archive | Could | Future |
| SKL-08 | Afficher quels agents utilisent chaque skill | Must | MVP 1 |

### 5.3 Contexte du projet

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| CTX-01 | Éditer les fichiers de contexte (projet, conventions, architecture) | Must | MVP 1 |
| CTX-02 | Assistant de rédaction guidé par sections | Should | MVP 1 |
| CTX-03 | Lier un fichier de contexte à un ou plusieurs agents | Must | MVP 1 |
| CTX-04 | Estimer la taille du contexte envoyé à l'IA et alerter s'il est trop gros | Should | MVP 1 |

### 5.4 Agents

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| AGT-01 | Créer, dupliquer, renommer et supprimer un agent | Must | MVP 0 |
| AGT-02 | Définir le rôle, la description et l'outil cible de l'agent | Must | MVP 0 |
| AGT-03 | Ajouter et retirer des paramètres libres (clé, valeur) | Must | MVP 1 |
| AGT-04 | Paramètres prédéfinis : autonomie, taille max des changements, langue, style de commit | Must | MVP 1 |
| AGT-05 | Attacher et détacher des skills en un clic | Must | MVP 1 |
| AGT-06 | Déclarer les outils autorisés (terminal, navigateur, paquets, réseau) ; exportés vers le mécanisme natif de l'outil cible quand il existe, sinon marqués « non garanti » | Must | MVP 1 |
| AGT-07 | Déclarer la portée par dossier (écriture, lecture seule, interdit), avec le même marquage de garantie | Must | MVP 1 |
| AGT-08 | Aperçu du cadrage final que l'agent va recevoir | Must | MVP 1 |
| AGT-09 | Modèles d'agents prêts à l'emploi | Should | MVP 2 |
| AGT-10 | Comparer deux agents côte à côte | Could | Future |

### 5.5 Adaptateurs et capacités

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| ADP-01 | Interface commune d'adaptateur : valider, importer, exporter, déclarer ses capacités, calculer le diff | Must | MVP 0 |
| ADP-02 | Adaptateur Claude Code (CLAUDE.md, .claude/skills/, .claude/agents/, réglages de permissions) | Must | MVP 0 |
| ADP-03 | Adaptateur format générique (SKILL.md, AGENTS.md) | Should | MVP 1 |
| ADP-04 | Adaptateur Codex | Won't | MVP 2 |
| ADP-05 | Pour chaque réglage, afficher son niveau de support par l'outil cible : exact, approximation, non supporté | Must | MVP 1 |
| ADP-06 | Prévisualiser le diff avant d'écrire les fichiers générés | Should | MVP 1 |

### 5.6 Exécution des agents

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| RUN-01 | Lancer un agent sur une tâche via la CLI officielle installée chez l'utilisateur | Must | MVP 1 |
| RUN-02 | Afficher la sortie en direct dans un terminal intégré | Must | MVP 1 |
| RUN-03 | Exécuter chaque tâche dans un worktree Git dédié, sur sa propre branche ; dans un projet sans Git, exécution désactivée avec explication | Must | MVP 1 |
| RUN-04 | En fin d'exécution, lister les fichiers créés, modifiés, supprimés et renommés par rapport à l'état de départ, avec leur diff | Must | MVP 1 |
| RUN-05 | Signaler les changements hors portée ; l'utilisateur accepte (fusion) ou rejette (suppression du worktree), en tout ou fichier par fichier | Must | MVP 1 |
| RUN-06 | Arrêter l'agent et tous ses processus enfants : arrêt propre puis forcé après un délai configurable | Must | MVP 1 |
| RUN-07 | Fermeture de l'app pendant une exécution : avertissement puis arrêt propre | Must | MVP 1 |
| RUN-08 | Un seul agent à la fois par projet, avec verrou | Must | MVP 1 |
| RUN-09 | Historique des exécutions : tâche, durée, fichiers touchés, statut, code de sortie | Should | MVP 1 |
| RUN-10 | Plusieurs agents en parallèle | Won't | Future |

### 5.7 Outils externes

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| CLI-01 | Détecter la présence et la version de chaque CLI au démarrage et avant chaque exécution | Must | MVP 1 |
| CLI-02 | CLI absente : message clair, réglage du chemin, lien vers la documentation d'installation | Must | MVP 1 |
| CLI-03 | Version non testée : avertissement et liste des versions compatibles | Must | MVP 1 |

### 5.8 Vérification du cadrage

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| VAL-01 | Panneau Santé du cadrage listant erreurs et avertissements | Must | MVP 1 |
| VAL-02 | Détecter les skills sans description, inutilisées ou en double | Must | MVP 1 |
| VAL-03 | Détecter les contradictions de portée | Must | MVP 1 |
| VAL-04 | Carte agents × skills | Must | MVP 1 |
| VAL-05 | Suggestions d'amélioration générées par IA | Could | Future |

### 5.9 Intégration Git

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| GIT-01 | Afficher la branche courante et les fichiers de cadrage modifiés | Must | MVP 1 |
| GIT-02 | Commit assisté des seuls fichiers de cadrage | Could | MVP 2 |
| GIT-03 | Gestion complète de Git (historique, merge, rebase) | Won't | Hors périmètre |

### 5.10 Compte, offre et réglages

| ID | Exigence | Priorité | Étape |
| --- | --- | --- | --- |
| ACC-01 | Utilisation complète sans compte | Must | MVP 1 |
| ACC-02 | Connexion, offre Pro et paiement | Won't | V1 commerciale |
| ACC-03 | Réglages : éditeur externe, chemins des CLI, thème, langue | Must | MVP 1 |
| ACC-04 | Mise à jour automatique signée | Should | MVP 1 |
| ACC-05 | Statistiques d'usage anonymes, opt-in | Won't | V1 commerciale |

## 6. Exigences non fonctionnelles

| ID | Domaine | Exigence |
| --- | --- | --- |
| NF-01 | Performance | Démarrage de l'app en moins de 2 s sur la machine de référence |
| NF-02 | Performance | Projet de référence (10 000 fichiers, 500 Mo, 200 fichiers de cadrage) : moins de 3 s entre la sélection du dossier et l'affichage de l'écran principal, cadrage importé et validé |
| NF-03 | Performance | Mémoire au repos inférieure à 300 Mo |
| NF-04 | Performance | Machine de référence et projet de référence définis au jalon MVP 0, mesures automatisées à chaque version |
| NF-05 | Compatibilité | MVP 1 : Windows 10 et 11, macOS 13 et plus (Intel et Apple Silicon). Linux (Ubuntu 22.04 et plus) à la V1 commerciale |
| NF-06 | Compatibilité | Versions de Claude Code (puis Codex) testées listées dans l'app ; tests de compatibilité à chaque nouvelle version d'une CLI |
| NF-07 | Confidentialité | Cadre n'envoie jamais le code ni le cadrage vers ses propres serveurs. Les agents lancés envoient le projet à leur fournisseur (Anthropic, OpenAI) selon les conditions de celui-ci, ce que l'app rappelle à la première exécution |
| NF-08 | Sécurité | Clés et identifiants stockés dans le trousseau du système, jamais en clair |
| NF-09 | Sécurité | Application signée et notarisée (macOS), signée (Windows) |
| NF-10 | Sécurité | Aucune exécution d'agent sans action explicite de l'utilisateur |
| NF-11 | Sécurité | Les restrictions affichées comme garanties le sont réellement par l'outil cible ; toute autre restriction est affichée comme non garantie |
| NF-12 | Fiabilité | Écritures atomiques : fichier temporaire puis remplacement ; un export de plusieurs fichiers est appliqué entièrement ou pas du tout |
| NF-13 | Fiabilité | Version précédente de chaque fichier de cadrage conservée avant écriture, annulation possible |
| NF-14 | Fiabilité | Fonctionnement hors ligne pour tout sauf l'exécution des agents |
| NF-15 | Ergonomie | Actions principales accessibles au clavier, raccourcis documentés |
| NF-16 | Accessibilité | Contrastes WCAG 2.1 AA, compatibilité lecteurs d'écran |
| NF-17 | Internationalisation | Interface en français et en anglais |
| NF-18 | Maintenabilité | Couverture de tests d'au moins 70 % sur le cœur (modèle, adaptateurs, validation, diff) |
| NF-19 | Évolutivité | Ajout d'un outil IA par un nouvel adaptateur, sans modifier le cœur |

## 7. Architecture technique

Recommandation : Tauri 2 avec un cœur en Rust et une interface React + TypeScript. Tauri produit des applications nettement plus légères qu'Electron, ce qui sert directement NF-01 à NF-03.

La logique métier (modèle, validation, adaptateurs, diff) est écrite en TypeScript. Rust est limité aux opérations système : fichiers, surveillance du dossier, processus et terminal, Git, trousseau. Cela réduit fortement la quantité de Rust à apprendre.

### 7.1 Principe

Cadre stocke un modèle de cadrage unique et neutre dans le dossier `.cadre/` du projet. Ce modèle est un sur-ensemble : il peut exprimer des réglages qu'un outil ne sait pas représenter. Chaque outil est servi par un adaptateur qui implémente la même interface (valider, importer, exporter, déclarer ses capacités, calculer le diff) ; aucun code propre à un outil n'est dispersé ailleurs dans l'application. L'exécution passe par les CLI officielles installées chez l'utilisateur, avec ses propres abonnements, dans un worktree Git dédié.

&#91;embedded content: architecture · interface, cœur, adaptateurs, sorties\]

L'interface ne touche jamais les fichiers directement : tout passe par le modèle, qui est validé puis exporté vers les fichiers que lisent les CLI.

### 7.2 Stack recommandée

| Couche | Choix | Raison |
| --- | --- | --- |
| Coque desktop | Tauri 2 | Binaire léger, accès système sécurisé, multiplateforme |
| Logique métier | TypeScript | Une seule langue avec l'interface, modèle et adaptateurs testables |
| Opérations système | Rust (commandes Tauri) | Fichiers, surveillance, processus, terminal, Git, trousseau |
| Interface | React + TypeScript + Vite | Écosystème riche, typage strict |
| Éditeur de texte | CodeMirror 6 | Léger, coloration Markdown et YAML |
| Terminal intégré | xterm.js + pseudo-terminal côté Rust | Affichage fidèle de la sortie des CLI |
| Git | Bibliothèque git2 (libgit2) | Statut, worktrees et diff sans dépendre du binaire git |
| Validation | Schémas JSON (YAML vers JSON) | Validateurs indépendants de l'interface |
| Mises à jour | Updater Tauri | Mises à jour signées |
| Paiement (V1 commerciale) | Stripe ou Paddle | Abonnements et TVA |

Alternative : Electron, si l'équipe ne souhaite pas apprendre Rust. Coût : application environ 10 fois plus lourde et plus gourmande en mémoire.

### 7.3 Modèle de données

| Entité | Attributs principaux | Relations |
| --- | --- | --- |
| Projet | nom, chemin, outils actifs, version de schéma | contient Skills, Contextes, Agents |
| Skill | nom, description, corps, fichiers annexes, origine | utilisée par 0..n Agents |
| Contexte | titre, contenu, type | lié à 0..n Agents |
| Agent | nom, rôle, description, outil cible, paramètres | utilise Skills, Contextes, Outils, Règles de portée |
| Paramètre | clé, valeur, type | appartient à un Agent |
| Règle de portée | chemin, niveau (écriture, lecture, interdit) | appartient à un Agent |
| Capacité | réglage, adaptateur, support (exact, approximation, non supporté), mécanisme natif utilisé | déclarée par un Adaptateur pour chaque réglage |
| Exécution | agent, tâche, worktree, début, fin, statut, code de sortie, changements | appartient à un Agent |

### 7.4 Format de stockage

```
.cadre/
  cadre.yaml        # schema_version, generator_version, outils actifs
  agents/
    frontend.yaml   # rôle, paramètres, skills, outils, portée
  skills/
    ui-design/SKILL.md
  contexte/
    PROJET.md
    CONVENTIONS.md
  runs/             # historique local, ignoré par Git
```

`schema_version` permet de migrer automatiquement les anciens projets quand le format évolue ; `generator_version` indique quelle version de Cadre a écrit les fichiers.

Tous ces fichiers sont du texte lisible et versionnable. Le dossier `runs/` est ajouté automatiquement au .gitignore.

## 8. Interfaces utilisateur

L'interface suit la maquette de l'écran principal : arborescence du cadrage à gauche, panneau d'édition au centre, vue d'ensemble et aperçu à droite, thème sombre par défaut.

### 8.1 Écrans

| Écran | Contenu | Exigences liées |
| --- | --- | --- |
| Accueil | Projets récents, ouvrir un dossier, créer depuis un modèle | PRJ-01, PRJ-03, PRJ-04 |
| Écran principal | Arborescence, panneau central, carte agents × skills, aperçu du cadrage | PRJ-05, VAL-04, AGT-08 |
| Agent | Onglets Paramètres, Skills, Portée, Historique | AGT-01 à AGT-10 |
| Skill | Formulaire d'en-tête, éditeur Markdown, fichiers annexes, agents utilisateurs | SKL-02 à SKL-08 |
| Contexte | Éditeur par sections, estimation de taille | CTX-01 à CTX-04 |
| Exécution | Saisie de la tâche, terminal en direct, fichiers modifiés et diff, alertes de portée | RUN-01 à RUN-07 |
| Santé du cadrage | Liste des erreurs et avertissements avec correction rapide | VAL-01 à VAL-03 |
| Réglages et compte | Préférences, chemins des CLI, abonnement | ACC-02 à ACC-05 |

### 8.2 Parcours principaux

1. Premier lancement : l'utilisateur ouvre un dossier existant, Cadre détecte CLAUDE.md et les skills, propose de les importer, puis affiche l'écran principal.
2. Cadrer un agent : créer l'agent depuis un modèle, attacher trois skills, déclarer src/api/ en lecture seule et infra/ interdit, vérifier l'aperçu, enregistrer. Les fichiers Claude Code sont générés, avec pour chaque restriction son niveau de garantie.
3. Lancer une tâche : choisir l'agent, saisir la tâche, l'agent travaille dans un worktree isolé ; suivre la sortie, relire le diff, puis fusionner ou rejeter, en tout ou fichier par fichier.
4. Corriger le cadrage : le panneau Santé signale une skill sans description ; un clic ouvre la skill sur le champ concerné.

## 9. Modèle économique

Cadre suivra un modèle freemium, introduit seulement à la V1 commerciale : les MVP 1 et 2 sont distribués gratuitement pour valider la valeur. Avant de fixer les prix, la bêta doit mesurer le temps gagné par rapport à une configuration manuelle, car c'est ce gain qui justifie l'abonnement.

| Fonction | Gratuit | Pro |
| --- | --- | --- |
| Projets | 1 projet actif | Illimités |
| Agents par projet | 2 | Illimités |
| Édition des skills, du contexte, des agents | Oui | Oui |
| Validation du cadrage | De base | Complète |
| Adaptateurs (Claude Code, Codex, générique) | Oui | Oui |
| Exécution surveillée dans un worktree | Oui | Oui |
| Historique des exécutions | 7 derniers jours | Complet |
| Bibliothèque personnelle de skills | Non | Oui |
| Modèles d'agents et de projets | De base | Tous |
| Prix | 0 | \[PRIX MENSUEL\] / \[PRIX ANNUEL\] |

Principe directeur : la version gratuite doit être réellement utile, pour que le bouche-à-oreille fonctionne. Les limites portent sur le volume et le confort, pas sur la fonction de base.

## 10. Aspects légaux et conformité

Cadre traite peu de données personnelles, car le code reste sur la machine, mais la vente d'abonnements impose un cadre minimal. Ces points sont à faire valider par un juriste avant le lancement.

- Protection des données : conformité à la LPD suisse et au RGPD pour les clients européens. Seules les données de compte et de facturation sont traitées.
- Documents à rédiger : conditions générales d'utilisation, conditions de vente, politique de confidentialité, mentions légales.
- Statistiques d'usage : opt-in explicite, anonymisées, désactivables à tout moment.
- TVA : facturation conforme pour la Suisse et l'UE ; un revendeur de type « merchant of record » simplifie ce point.
- Outils tiers : respect des conditions d'utilisation de Claude Code et Codex. Cadre pilote les CLI officielles avec le compte de l'utilisateur et ne contourne aucune limite.
- Marques : vérifier la disponibilité du nom final et du nom de domaine ; ne pas utiliser les logos d'Anthropic ou d'OpenAI sans autorisation.
- Licences : inventaire des licences des dépendances open source, compatibles avec une distribution commerciale.
- Structure juridique : une entreprise (raison individuelle ou Sàrl) est nécessaire pour encaisser des abonnements.

## 11. Planning, jalons et ressources

Le développement suit les quatre étapes du périmètre, chacune fermée par une porte. Le développement est confié à des agents IA, supervisés par le porteur du projet : le rythme est donné par les portes, pas par des durées. La relecture, les tests sur chaque système et la bêta restent du temps humain incompressible.

&#91;embedded content: planning · 4 étapes, 4 portes\]

Chaque jalon est une porte : on ne passe à la phase suivante que si son critère est atteint.

### 11.1 Livrables

| Porte | Livrable |
| --- | --- |
| 1 | Format .cadre/ spécifié, machine et projet de référence définis, prototype qui importe un projet et exporte vers Claude Code |
| 2 | MVP 1 en bêta sur Windows et macOS, boucle complète testée, gain de temps mesuré auprès des bêta-testeurs |
| 3 | Adaptateur Codex, capacités affichées, jeu de tests de compatibilité pour les deux CLI |
| 4 | Version 1.0 signée sur les trois systèmes, site, comptes, paiement, documentation |

### 11.2 Ressources

- Développement : réalisé par des agents IA (Claude Code), cadrés et relus par le porteur du projet. Cadre sert de premier cas d'usage : son propre cadrage est maintenu dans .cadre/ dès que le MVP 0 fonctionne.
- Design : maquettes réalisées en interne à partir de la maquette existante.
- Bêta-testeurs : développeurs solo recrutés dans les communautés de vibe coding.
- Budget minimum : compte développeur Apple, certificat de signature Windows, nom de domaine, hébergement du site, frais du prestataire de paiement.
- Méthode : sprints de deux semaines, suivi des exigences par ID.

## 12. Risques et mesures

Le risque principal est que les outils IA intègrent eux-mêmes une gestion visuelle du cadrage ; la réponse est de miser sur le multi-outils, qu'aucun fournisseur n'a intérêt à offrir.

| Risque | Probabilité | Impact | Mesure |
| --- | --- | --- | --- |
| Claude Code ou Codex ajoutent leur propre interface de cadrage | Élevée | Élevé | Miser sur le multi-outils, la validation et l'exécution surveillée ; sortir le MVP 1 vite |
| « Pourquoi une app pour modifier CLAUDE.md ? » : les fichiers natifs suffisent aux développeurs expérimentés | Élevée | Élevé | Mesurer et afficher le gain de temps ; centrer le produit sur ce que VS Code + Git n'offrent pas |
| Formats de fichiers modifiés par les éditeurs | Élevée | Moyen | Adaptateurs isolés, versions de CLI testées, veille sur les changelogs |
| Faux sentiment de sécurité chez l'utilisateur | Moyenne | Élevé | Marquage explicite garanti / non garanti pour chaque restriction |
| Changement des conditions d'utilisation des CLI | Moyenne | Élevé | Passer uniquement par les CLI officielles, sans contournement |
| Agent qui manipule Git lui-même (reset, checkout) | Moyenne | Moyen | Exécution dans un worktree isolé ; le dépôt principal n'est touché qu'à l'acceptation |
| Processus orphelins après arrêt d'un agent | Moyenne | Moyen | Arrêt de tout l'arbre de processus, arrêt forcé après délai |
| Écriture interrompue par un plantage | Faible | Élevé | Écritures atomiques et sauvegarde avant écriture |
| Code généré par IA fragile sur les parties système | Élevée | Moyen | Tests automatisés, relecture humaine obligatoire des parties sensibles (processus, worktree, écritures atomiques), portes de validation |
| Courbe d'apprentissage de Rust | Moyenne | Moyen | Rust limité aux opérations système |

## 13. Recette, points en suspens et glossaire

### 13.1 Critères de recette du MVP

- [ ] Toutes les exigences « Must » du MVP 1 sont implémentées et passent leurs tests.
- [ ] Un projet contenant CLAUDE.md et des skills existantes est importé sans perte.
- [ ] Les fichiers générés sont chargés sans erreur par Claude Code dans les versions testées.
- [ ] Le jeu de tests de référence (création, modification, suppression, renommage hors portée) est entièrement signalé.
- [ ] Rejeter une exécution laisse le dépôt principal exactement dans son état de départ, modifications en cours de l'utilisateur comprises.
- [ ] Arrêter un agent ne laisse aucun processus actif.
- [ ] Les objectifs NF-01 à NF-03 sont atteints sur Windows et macOS avec le projet de référence.
- [ ] Cinq bêta-testeurs cadrent un nouveau projet sans aide, au moins deux fois plus vite qu'à la main.

### 13.2 Points en suspens

- [ ] Nom définitif du produit et disponibilité du domaine.
- [ ] Ressources : développement par agents IA, supervisé et relu par le porteur du projet ; pas de durées fixées.
- [ ] Choix final entre Tauri et Electron.
- [ ] Pour chaque réglage de Cadre (portée, outils, réseau), relevé précis de ce que Claude Code puis Codex appliquent réellement, à faire au MVP 0.
- [ ] Prix de l'offre Pro et prestataire de paiement (avant la V1 commerciale).
- [ ] Niveau de contrôle : configuration et surveillance, blocage délégué aux outils cibles.
- [ ] Ordre des outils : Claude Code au MVP, Codex au MVP 2.

### 13.3 Glossaire

| Terme | Définition |
| --- | --- |
| Vibe coding | Développement où l'écriture du code est déléguée à des agents IA |
| Agent | Instance d'IA configurée avec un rôle, des skills, des outils et une portée |
| Skill | Capacité réutilisable décrite dans un fichier SKILL.md, chargée par l'agent quand elle est utile |
| Cadrage | Ensemble des règles, contextes, skills et permissions qui encadrent les agents d'un projet |
| Portée | Dossiers qu'un agent peut lire, modifier ou ne pas toucher |
| CLI | Interface en ligne de commande, ici celle de Claude Code ou Codex |
| MVP | Produit minimum viable, première version commercialisable |
| MoSCoW | Méthode de priorisation : Must, Should, Could, Won't |
