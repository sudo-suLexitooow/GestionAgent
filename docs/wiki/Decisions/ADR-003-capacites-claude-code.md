# ADR-003 — Capacités de l'adaptateur Claude Code

Date : 2026-10-01 · Statut : accepté
Spike : SP-02 · Exigences : AGT-04, AGT-06, AGT-07, ADP-02, ADP-05, NF-06, NF-11, §3.3, §13.2
Débloque : US-008, US-014, US-016, US-017, US-020, US-038, US-039

## Contexte

Cadre configure des agents (portée par dossier, outils autorisés, paramètres prédéfinis) et s'appuie sur les
mécanismes natifs de l'outil cible pour bloquer (§3.3). NF-11 impose que tout ce qui est affiché « garanti » le
soit réellement. Il fallait donc relever, réglage par réglage, ce que Claude Code applique vraiment, sous quelle
forme, et comment lancer la CLI de façon non interactive avec ce cadrage.

Sources utilisées (aucune session Claude réelle n'a été exécutée, conformément au périmètre du spike) :

- [CLI] `claude --help` de la CLI installée, version **2.1.286** (`/opt/node22/bin/claude` → binaire natif
  `/opt/claude-code/bin/claude`). Le paquet npm `@anthropic-ai/claude-code` présent dans `npm root -g` est en
  2.1.42 et n'est pas celui qui s'exécute : il n'a pas été retenu comme source.
- [BIN] Chaînes du binaire natif 2.1.286 (schéma des réglages `sandbox.filesystem.*`, analyse de l'en-tête des
  sous-agents, règle « un `permissionMode` de sous-agent ne peut pas élargir le mode hérité »).
- [DOC-SA] https://code.claude.com/docs/en/sub-agents · [DOC-PERM] …/permissions ·
  [DOC-SBX] …/sandboxing · [DOC-SET] …/settings et …/settings-reference (consultées le 2026-10-01).

Niveau de certitude : [CLI] et [BIN] = constaté sur la version installée ; [DOC-*] = documenté par l'éditeur,
non vérifié par exécution. Tout comportement d'exécution reste **à confirmer par un test d'intégration
(US-017/US-020)**, d'où la règle de marquage du point (3).

Constats structurants :

1. **Les règles de permission sont par session, pas par sous-agent.** `permissions.allow/deny/ask` vivent dans
   les fichiers de réglages (utilisateur, projet, local, `--settings`, gérés) et s'appliquent à la conversation
   principale *et* à tous ses sous-agents [DOC-SA « The rule applies to the main conversation and to subagents »,
   DOC-PERM]. Les sous-agents héritent des règles du parent [DOC-SA l.31].
2. **Un sous-agent n'a pas de portée par dossier propre.** Son en-tête ne filtre que des outils entiers :
   `tools` (liste blanche) et `disallowedTools` (liste noire). Une entrée avec spécificateur, ex.
   `Bash(git push *)` ou `Edit(src/**)`, retire **l'outil entier** [DOC-SA « Available tools »]. Seuls des hooks
   `PreToolUse` dans l'en-tête permettraient un filtrage par chemin, et ils ne s'exécutent pas en `claude -p`
   sur un dossier non approuvé [DOC-PERM « What runs before you trust a folder »].
3. **`--agent <nom>` fait du sous-agent la session principale** : outils, modèle et prompt système de l'agent
   s'appliquent au fil principal [DOC-SA « Run the whole session as a subagent », CLI `--agent`]. Combiné à un
   `--settings` propre à l'agent, on obtient donc une portée **par agent** — à condition que ce soit Cadre qui
   lance l'agent (RUN-01), un agent par processus (et par worktree, SP-05).
4. **Règles Read/Edit** : syntaxe gitignore ; `deny` évalué avant `ask` puis `allow`, un `allow` ne peut jamais
   percer un `deny`, un `deny` de n'importe quel niveau gagne [DOC-PERM]. Elles couvrent les outils fichiers
   intégrés, les commandes Bash reconnues (`cat`, `sed`, `tee`…) et les redirections, **mais pas** un script
   (Python, Node…) qui ouvre lui-même des fichiers [DOC-PERM, avertissement « Read and Edit »].
5. **Sandbox** : seule protection au niveau du système, elle s'applique aux commandes Bash/PowerShell/Monitor et à
   leurs sous-processus ; les règles `Edit` allow/deny et `Read` deny y sont fusionnées, et
   `sandbox.network.allowedDomains` filtre le réseau [DOC-SBX « Permission rules », BIN `allowWrite … Merged with
   paths from Edit(...) allow permission rules`]. Disponible sur macOS, Linux et WSL2 ; **pas sur Windows natif**
   [DOC-SBX l.17 ; BIN « the Windows sandbox is not active on this session (feature gate off) »]. Sans
   `failIfUnavailable`, une sandbox indisponible se dégrade silencieusement en exécution non isolée [DOC-SBX].
6. **En `claude -p`, les `permissions.allow` et `additionalDirectories` du `.claude/settings.json` projet sont
   ignorés** tant que le dossier n'a pas été approuvé dans une session interactive ; `deny` et `ask` restent
   appliqués [DOC-PERM « Project allow rules and workspace trust »]. Un fichier passé par `--settings` n'est pas
   concerné par cette restriction (à confirmer US-020).
7. **En `-p`, un fichier de réglages invalide est ignoré sans erreur** [CLI, aide de `-p`]. Une faute dans le
   fichier généré par Cadre supprimerait donc toutes les restrictions sans le signaler.

## Décision

### (1) Tableau de capacités « réglage Cadre → mécanisme natif → niveau → source »

Niveaux (ADP-05) : **exact** = bloqué par Claude Code pour tous les chemins d'accès de l'agent ;
**approximation** = bloqué pour les outils intégrés mais contournable (script, autre forme de commande) ou
appliqué seulement sous condition ; **non supporté** = aucun mécanisme natif, Cadre ne fait que constater après
coup (US-025). Les niveaux « exact » ci-dessous supposent le lancement par Cadre (point 3) ; hors Cadre, voir (3).

| Réglage Cadre | Mécanisme natif Claude Code | Niveau | Source |
| --- | --- | --- | --- |
| Portée **interdit** sur `infra/` | `deny: ["Read(./infra/**)", "Edit(./infra/**)"]` ; + sandbox active (macOS, Linux, WSL2) qui reprend ces chemins pour Bash | **exact** avec sandbox active et `failIfUnavailable: true` ; **approximation** sans sandbox (Windows natif) : un script peut lire/écrire | DOC-PERM, DOC-SBX, BIN |
| Portée **lecture seule** sur `docs/` | `deny: ["Edit(./docs/**)"]` (Edit couvre Write et NotebookEdit) ; sandbox `denyWrite` fusionné | idem : **exact** avec sandbox, **approximation** sans | DOC-PERM, DOC-SBX |
| Portée **écriture** sur `src/` | `allow: ["Edit(./src/**)"]` en mode `dontAsk`/`plan` (tout ce qui n'est pas autorisé est refusé) | **exact** pour les outils intégrés ; Bash écrit partout dans le dossier de travail sauf `deny` → **approximation** sans sandbox | DOC-PERM (modes), DOC-SBX |
| Chemin non couvert, agent avec ≥ 1 règle écriture (Q-10 : hors portée) | En `dontAsk`/`plan` : refusé faute d'`allow`. En `auto` : nécessite un `deny` explicite (`Edit(./**)` puis négations `Edit(!./src/**)`) | **approximation** ; négation gitignore **à confirmer US-020** | DOC-PERM (« `!` patterns ») |
| Agent sans règle de portée (Q-10 : tout en écriture) | `allow: ["Edit(./**)"]` | **exact** dans le dossier de travail | DOC-PERM |
| Outil **terminal** désactivé | `--tools` sans `Bash` + `deny: ["Bash", "PowerShell", "Monitor"]` + en-tête `tools` sans `Bash` | **exact** (outil retiré) | CLI `--tools`, DOC-SA, DOC-PERM |
| Outil **réseau** désactivé | `deny: ["WebFetch", "WebSearch"]` ; Bash : sandbox `network.allowedDomains: []` | WebFetch/WebSearch **exact** ; réseau depuis Bash **exact** avec sandbox active, **non supporté** sans (Windows natif) | DOC-PERM, DOC-SBX |
| Outil **réseau** activé | rien à interdire ; avec sandbox, `allowedDomains` doit être renseigné sinon tout est bloqué | n/a — liste de domaines hors MVP 1 | DOC-SBX |
| Outil **paquets** désactivé | `deny: ["Bash(npm install *)", "Bash(npm i *)", "Bash(pnpm add *)", "Bash(yarn add *)", "Bash(pip install *)", "Bash(cargo add *)", …]` ; avec sandbox + réseau coupé, l'installation échoue faute de réseau | **approximation** : une règle Bash « n'est pas une frontière de sécurité » (autre forme de commande non couverte) | DOC-PERM (« Bash » l.241) |
| Outil **navigateur** désactivé | `--no-chrome`, `--strict-mcp-config` (aucun serveur MCP non déclaré), `deny: ["mcp__claude-in-chrome__*"]` (nom à confirmer) | **approximation** ; noms d'outils **à confirmer US-020** | CLI, DOC-SA (motifs `mcp__<serveur>`) |
| Outil **navigateur** activé | aucun mécanisme générique hors MCP/Chrome | **non supporté** au MVP 1 (affiché comme tel) | — |
| Préréglage **autonomie** `low` / `medium` / `high` (Q-07) | `permissionMode` : `plan` / `dontAsk` / `auto` (repli `dontAsk` si `auto` indisponible) ; jamais `acceptEdits` ni `bypassPermissions` ; `disableBypassPermissionsMode: "disable"` | **approximation** (sens des niveaux propre à Cadre ; `auto` dépend d'un classifieur et du compte) | DOC-PERM « Permission modes », DOC-SA « permissionMode » |
| Préréglage **taille max des changements** (nb de fichiers) | aucun ; consigne dans le corps de l'agent + contrôle après exécution (violation, Q-07) | **non supporté** natif (Cadre signale après coup) | — |
| Préréglage **langue** (fr, en) | réglage `language: "french"` / `"english"` dans le `--settings` de l'agent + consigne dans le corps | **approximation** (instruction au modèle, non vérifiable) | DOC-SET `language` |
| Préréglage **style de commit** | consigne dans le corps ; `attribution` ne règle que les mentions de co-auteur | **approximation** (instruction au modèle) | DOC-SET `attribution` |
| Lien contexte → un seul agent (CTX-03, AC-036-3) | corps du sous-agent (le contenu y est recopié) ; `CLAUDE.md` est toujours chargé, y compris avec `--agent` | **approximation** (le contexte « projet » reste visible de tous) | DOC-SA l.848-856 |

### (2) Format exact de `.claude/agents/<nom>.md` produit par l'export (US-008)

- Fichier : `.claude/agents/<id>.md`, UTF-8 sans BOM, fin de ligne LF, se termine par une fin de ligne.
- En-tête YAML entre deux lignes `---`, champs dans cet ordre fixe (diff stable) ; Claude Code ignore sans
  erreur un champ inconnu et la casse compte (`disallowedTools`, camelCase) [DOC-SA].
- Champs :
  - `name` — **obligatoire** = `id` Cadre (pas de `:`, ne commence pas par `-`) [DOC-SA, ADR-001].
  - `description` — **obligatoire** (sans elle Claude Code ne charge pas l'agent [BIN « frontmatter needs name …
    and a description »]). Toujours entre guillemets doubles, échappée. Description vide dans Cadre
    (avertissement AC-007-5) → texte de repli `Agent <name> géré par Cadre.`.
  - `tools` — facultatif ; écrit dès qu'un outil Cadre est désactivé ou que l'agent n'a aucune règle d'écriture.
    Chaîne séparée par `, `, noms d'outils **sans spécificateur**. Base : `Read, Grep, Glob, Edit, Write,
    NotebookEdit, Bash, WebFetch, WebSearch, TodoWrite, Skill` moins les outils désactivés.
  - `disallowedTools` — facultatif ; outils entiers interdits (même liste que les `deny` sans spécificateur).
  - `permissionMode` — facultatif ; écrit si le préréglage autonomie est réglé (mapping du tableau).
  - `model`, `skills`, `maxTurns`, `hooks`, `mcpServers`, `isolation` : **non écrits** au MVP 1 (`hooks` et
    `mcpServers` sont ignorés en `-p` non approuvé ; `isolation` est gérée par Cadre via SP-05).
- Corps (prompt système de l'agent) : `role` Cadre octet pour octet, puis, si des préréglages ou une portée
  existent, une section générée `## Cadre — consignes` (langue, style de commit, taille max, rappel lisible de la
  portée). Ce rappel est une consigne, pas une garantie : la garantie vient des réglages du point (3).

Exemple (agent `frontend`, autonomie medium, langue fr, Conventional Commits, 20 fichiers, terminal seul) :

```markdown
---
name: frontend
description: "Développe l'interface React. À utiliser pour toute tâche dans src/ui/."
tools: Read, Grep, Glob, Edit, Write, NotebookEdit, Bash, TodoWrite, Skill
disallowedTools: WebFetch, WebSearch
permissionMode: dontAsk
---
Tu es le développeur front-end du projet. Tu travailles en TypeScript et React.

## Cadre — consignes

- Réponds et rédige en français.
- Messages de commit au format Conventional Commits.
- Ne modifie pas plus de 20 fichiers ; au-delà, arrête-toi et explique pourquoi.
- Portée : écriture dans `src/ui/` ; lecture seule dans `docs/` ; interdit : `infra/`.
```

### (3) Où exporter portée et outils, et règle de marquage (NF-11)

- **Par agent** → `.cadre/claude-code/<id>.settings.json` (versionné, format réglages Claude Code, chemins en
  `./…` relatifs au dossier de travail) contenant `permissions.allow/deny`, `permissions.defaultMode`,
  `permissions.disableBypassPermissionsMode`, `language`, et `sandbox` (`enabled: true`,
  `failIfUnavailable: true`, `allowUnsandboxedCommands: false`, `network.allowedDomains`). C'est le fichier visé
  par AC-014-1 et AC-016-1. Au lancement, Cadre en dérive une copie résolue en chemins absolus `//<worktree>/…`
  dans son dossier d'exécution, passée par `--settings` (un `/chemin` dans un fichier `--settings` s'ancre sur le
  dossier du fichier, pas sur le projet [DOC-PERM] : on n'utilise donc jamais de `/` simple).
- **Commun à tous les agents** → `.claude/settings.json` projet : uniquement les `deny` partagés par *tous* les
  agents (dossier interdit ou outil coupé pour chacun). Les `deny` y restent actifs même en `-p` non approuvé et
  même quand l'utilisateur lance Claude Code sans Cadre. Aucun `allow` n'y est écrit (ignoré en `-p`, et il
  élargirait les droits de tous les agents). Fusion avec les clés existantes de l'utilisateur, écriture atomique
  (US-008, zone sensible).
- **En-tête du sous-agent** → seulement les outils entiers (`tools`, `disallowedTools`) et `permissionMode`.

Règle de marquage affichée (US-014, US-016, US-038, US-039) :

1. **Garanti** seulement si le niveau du tableau est « exact » **et** la version de Claude Code détectée
   (US-017) figure dans la liste des versions testées (5) avec le test d'intégration correspondant vert **et**,
   pour une règle qui dépend de la sandbox, la sandbox est disponible sur la plateforme (pas Windows natif).
2. **Non garanti** dans tous les autres cas : approximation, non supporté, version non testée, Windows natif
   pour les règles de dossier sur Bash, ou agent utilisé hors Cadre (sous-agent appelé depuis une session
   Claude Code ordinaire : seuls les `deny` communs du `.claude/settings.json` s'appliquent). Chaque marquage
   « non garanti » affiche sa raison en une phrase (AC-016-4).
3. Tant qu'aucune version n'est testée (état au 2026-10-01), **tout est affiché « non garanti »**.

### (4) Ligne de commande non interactive recommandée pour RUN-01 (US-020)

Processus lancé par Cadre (pas via un shell), répertoire de travail = racine du worktree de l'agent (SP-05),
tâche envoyée sur l'entrée standard (évite les limites et l'échappement des arguments sous Windows) :

```
claude -p
  --agent <id>
  --settings <dossier-exécution>/<id>.settings.json
  --setting-sources project
  --permission-mode <plan|dontAsk|auto>
  --permission-prompts none
  --tools "<outils autorisés, ex. Read,Grep,Glob,Edit,Write,NotebookEdit,Bash,TodoWrite,Skill>"
  --disallowedTools "<deny sans spécificateur, ex. WebFetch,WebSearch>"
  --strict-mcp-config
  --no-chrome
  --output-format stream-json --verbose
```

Raisons : `--agent` applique outils et prompt de l'agent au fil principal ; `--settings` porte la portée propre à
l'agent et n'est pas soumis à l'approbation du dossier ; `--setting-sources project` évite qu'un `allow` des
réglages personnels de l'utilisateur élargisse la portée (les réglages gérés s'appliquent toujours) ;
`--permission-prompts none` refuse tout ce qui demanderait une confirmation ; `--tools` retire les outils du jeu
intégré (défense en profondeur avec les `deny`) ; `--strict-mcp-config` empêche les serveurs de `.mcp.json`,
connectés sans demande en `-p` [DOC-PERM], d'ajouter réseau ou navigateur. Jamais
`--dangerously-skip-permissions` ni `--add-dir`. Avant le lancement, Cadre valide le JSON généré contre son propre
schéma, car un fichier invalide serait ignoré en silence (constat 7).

### (5) Versions

- Version relevée : **Claude Code 2.1.286** (`claude --version`), plateforme Linux x86-64.
- Versions **testées par exécution réelle : aucune** à ce jour. La liste affichée par l'app (NF-06) démarre vide.
- Version minimale proposée : 2.1.286 (plusieurs comportements cités datent de 2.1.200 à 2.1.281 : alias
  `manual`, refus de `bypassPermissions` par un sous-agent en 2.1.267, `attribution: false` en 2.1.281).
- La matrice de tests d'intégration (6) est rejouée à chaque nouvelle version détectée ; une version n'entre dans
  la liste qu'une fois toute la matrice verte sur Linux, macOS et Windows.

### (6) Points à confirmer par tests d'intégration (US-017 / US-020)

1. `--agent <id>` en `-p` applique `tools`, `disallowedTools` et `permissionMode` de l'en-tête au fil principal.
2. Un `deny Edit(./infra/**)` passé par `--settings` bloque Edit/Write et `echo x > infra/f` ; un script Node qui
   écrit dans `infra/` est bloqué avec sandbox (Linux, macOS) et ne l'est pas sous Windows natif (preuve du
   marquage « approximation »).
3. `permissions.allow` d'un fichier `--settings` est appliqué en `-p` sur un dossier jamais approuvé.
4. En `dontAsk` + `--permission-prompts none`, une écriture hors `allow` est refusée sans blocage du processus.
5. Négation gitignore : `deny Edit(./**)` suivi de `deny Edit(!./src/**)` laisse écrire `src/` seulement.
6. `--setting-sources project` n'empêche pas l'authentification (OAuth) et neutralise un `allow` utilisateur.
7. Un `--settings` invalide est ignoré en silence (reproduire le constat 7 pour justifier la validation Cadre).
8. Sandbox `network.allowedDomains: []` bloque `curl` ; `failIfUnavailable: true` fait échouer le lancement
   quand la sandbox manque (Linux sans bubblewrap) au lieu de continuer sans isolation.
9. Noms exacts des outils navigateur (`mcp__claude-in-chrome__*`) et effet de `--no-chrome`.
10. Comportement de `auto` sur un compte où il est indisponible (repli `dontAsk` affiché à l'utilisateur).
11. Format `stream-json` (exige-t-il `--verbose` ?) et événements utiles à US-020/US-021.

## Alternatives écartées et pourquoi

- **Tout mettre dans `.claude/settings.json` projet** : les règles y sont communes à toutes les sessions et à
  tous les sous-agents ; une portée propre à un agent s'appliquerait à tous, et les `allow` y sont ignorés en
  `-p` non approuvé. Gardé seulement pour les `deny` communs.
- **Portée dans l'en-tête du sous-agent (`tools: Edit(src/**)`)** : un spécificateur retire ou accorde l'outil
  entier [DOC-SA] ; ce serait afficher une portée qui n'existe pas (contraire à NF-11).
- **Hooks `PreToolUse` générés par Cadre dans l'en-tête** : ils permettraient un filtrage par chemin par
  sous-agent, mais ne s'exécutent pas en `-p` sans approbation du dossier, exigent un script exécutable sur les
  trois plateformes et ne couvrent pas mieux les scripts que les règles `deny`. Réexaminable après le MVP 1.
- **`acceptEdits`, `bypassPermissions`, `--dangerously-skip-permissions`** : acceptent les modifications dans tout
  le dossier de travail (contredit Q-10) ou sautent des protections ; interdits.
- **Sandbox propre à Cadre** : hors périmètre (§3.3).
- **Lancer un agent comme sous-agent d'une session principale** : la portée serait celle de la session, pas celle
  de l'agent ; un processus par agent avec `--agent` est retenu.

## Conséquences

- US-008 : produit le fichier du point (2) ; description vide → texte de repli ; écriture atomique.
- US-014 / US-016 : produisent `.cadre/claude-code/<id>.settings.json` et les `deny` communs du
  `.claude/settings.json` (fusion, sans écraser les clés de l'utilisateur) ; le marquage suit le tableau (1) et la
  règle (3). AC-016-4 : navigateur activé, paquets, taille max = « non garanti » avec raison.
- US-017 : détecte `claude --version`, compare à la liste des versions testées ; version inconnue → tout
  « non garanti » et avertissement.
- US-020 : lance la commande du point (4) dans le worktree, valide le JSON généré avant lancement, vérifie
  l'absence de `failIfUnavailable` contourné ; les tests du point (6) font partie de ses tests d'intégration
  (CI Linux, macOS, Windows ; ils nécessitent une clé d'API en secret de CI, à décider).
- US-038 : mapping autonomie → mode du tableau (1) ; taille max contrôlée après exécution (US-025).
- US-039 : affiche niveau (exact / approximation / non supporté) et garantie (garanti / non garanti + raison).
- Windows natif : les restrictions de dossier et de réseau sur Bash ne peuvent pas y être garanties ; la
  détection de dérive après exécution (US-025) reste le filet de sécurité, comme prévu par §3.3.
- Risque résiduel : la documentation évolue vite (versions 2.1.2xx citées) ; le tableau (1) est daté et doit être
  revu à chaque version ajoutée à la liste testée.
- Point en suspens §13.2 (Claude Code) : traité par cet ADR, sous réserve des tests du point (6) ; Codex reste à
  faire au MVP 2.
