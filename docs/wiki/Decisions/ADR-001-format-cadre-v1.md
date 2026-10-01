# ADR-001 — Format .cadre/ v1

Date : 2026-10-01 · Statut : accepté

Spike : SP-01 · Exigences : §7.3, §7.4, PRJ-02, NF-12, NF-13 · Débloque : US-003 à US-011 · Réponses PO appliquées : Q-02, Q-03, Q-04, Q-07, Q-09, Q-10, Q-15

## Contexte

Le cahier des charges (§7.4) fixe l'esquisse de `.cadre/` (`cadre.yaml`, `agents/`, `skills/`, `contexte/`, `runs/`) sans schéma exact. Les stories MVP 0 imposent des contraintes fortes :

- **aller-retour octet pour octet** : un projet importé puis exporté sans modification est identique (AC-003-2, AC-004-1, AC-009-3, AC-010-2) ;
- **conservation des champs inconnus** des en-têtes importés (AC-004-2, AC-010-3, AC-015-3) ;
- **renommage** d'un agent sans perdre son historique ni laisser de fichier orphelin (AC-011-2) ;
- **ne jamais écraser ni supprimer un fichier non généré par Cadre** (AC-008-4, AC-011-4, Q-03) ;
- **écritures atomiques, version précédente conservée, aucun fichier temporaire résiduel** (AC-005-3 à AC-005-6, NF-12, NF-13, Q-15 : une seule version) ;
- noms de fichiers valides sous Windows et macOS, insensibles à la casse (AC-007-3, AC-007-4).

Formats natifs relevés sur Claude Code 2.1.286 (doc `code.claude.com/docs/en/skills`, `.../sub-agents`) :
- `SKILL.md` : en-tête YAML entre `---` en première ligne, puis Markdown ; champs Agent Skills `name` (minuscules, chiffres, tirets, 64 car., = nom du dossier), `description` (1 024 car.), `license`, `compatibility`, `metadata`, `allowed-tools` ; Claude Code ajoute `when_to_use`, `disable-model-invocation`, `user-invocable`, `model`, `context`, `paths`, `hooks`… et **ignore sans erreur** les champs inconnus. Fichiers annexes libres dans le dossier.
- `.claude/agents/<fichier>.md` : `name` et `description` obligatoires, `tools`, `disallowedTools`, `model`, `permissionMode`, `skills`, `mcpServers`, `hooks`, `maxTurns`, `memory`, `effort`, `isolation`, `color`… ; le corps est le prompt système. **Le nom de fichier n'a pas à égaler `name`** ; `name` ne peut contenir `:` ni commencer par `-`.
- `CLAUDE.md` : Markdown libre, sans en-tête ; tout son contenu est envoyé au modèle.

Note (2026-10-01) : la spécification Agent Skills (agentskills.io) n'était pas joignable pendant le spike ; les règles de nommage et de validation des skills citées ici viennent de la documentation Claude Code et sont à confirmer par SP-04.

## Décision

### D1. Arborescence

```
.cadre/
  cadre.yaml              # projet : versions, outils actifs, index ordonné des contextes      [Git]
  generated.yaml          # manifeste des fichiers générés hors de .cadre/ (D5)                [Git]
  agents/<nom>.yaml       # un agent (modèle neutre)                                            [Git]
  agents/<nom>.md         # instructions de l'agent (corps Markdown brut, facultatif)           [Git]
  skills/<nom>/SKILL.md   # skill au format natif Agent Skills, + fichiers annexes tels quels   [Git]
  contexte/<nom>.md       # contenu brut d'un contexte, aucune métadonnée dans le fichier       [Git]
  runs/                   # historique des exécutions (MVP 1)                                    ignoré
  backups/                # version précédente de chaque fichier écrit (D6)                     ignoré
  tmp/                    # fichiers temporaires et journal de transaction (D6)                  ignoré
```

Une seule `schema_version` (dans `cadre.yaml`) couvre tout le dossier. Fichiers YAML écrits par Cadre : UTF-8 sans BOM, LF, indentation 2, ligne finale ; en lecture, BOM et CRLF sont acceptés (Git `autocrlf` sous Windows). YAML 1.2 (schéma *core* : `no`/`on` restent des chaînes), clés en double = erreur, pas de balises personnalisées.

### D2. `cadre.yaml` — schéma JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://cadre.app/schemas/v1/cadre.json",
  "type": "object",
  "required": ["schema_version", "generator_version", "tools"],
  "properties": {
    "schema_version": { "type": "integer", "minimum": 1 },
    "generator_version": { "type": "string",
      "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-[0-9A-Za-z.-]+)?(\\+[0-9A-Za-z.-]+)?$" },
    "name": { "type": "string", "minLength": 1 },
    "tools": { "type": "array", "uniqueItems": true,
      "items": { "$ref": "#/$defs/adapterId" } },
    "contexts": { "type": "array", "items": { "$ref": "#/$defs/context" } }
  },
  "$defs": {
    "adapterId": { "type": "string", "pattern": "^[a-z][a-z0-9-]{0,31}$" },
    "cadreName": { "type": "string", "pattern": "^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$" },
    "context": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": { "$ref": "#/$defs/cadreName" },
        "title": { "type": "string" },
        "type": { "enum": ["projet", "conventions", "architecture", "autre"], "default": "autre" },
        "scope": { "enum": ["project", "agents"], "default": "project" },
        "source": { "type": "string" },
        "readonly": { "type": "boolean", "default": false }
      }
    }
  }
}
```

- `tools` : identifiants des adaptateurs actifs (`claude-code` au MVP 0 ; `generic`, `codex` plus tard). `name` : facultatif, défaut = nom du dossier ; le chemin du projet n'est jamais stocké (le dossier peut être déplacé).
- **Métadonnées des contextes** : dans `cadre.yaml` (liste `contexts`), jamais dans le `.md`. L'ordre de la liste est l'ordre de concaténation dans `CLAUDE.md` (D7). `scope: project` = reçu par tous les agents ; `scope: agents` = reçu seulement par les agents qui le lient (MVP 1, CTX-03). `source` = fichier d'origine de l'import (informatif). `readonly: true` = miroir importé, ni édité ni exporté (AGENTS.md au MVP 0, Q-04).
- **Liens contexte ↔ agent** : stockés côté agent (`contexts:` dans `agents/<nom>.yaml`), comme les skills. Un contexte ne référence jamais d'agent : ajouter ou renommer un agent ne touche pas `cadre.yaml`.
- **Skills** : aucune métadonnée Cadre en v1 ; une skill = son dossier `.cadre/skills/<nom>/`, copié octet pour octet, identité = nom du dossier.

### D3. `agents/<nom>.yaml` — schéma JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://cadre.app/schemas/v1/agent.json",
  "type": "object",
  "required": ["id", "name", "target"],
  "properties": {
    "id": { "type": "string",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$" },
    "name": { "$ref": "cadre.json#/$defs/cadreName" },
    "role": { "type": "string" },
    "description": { "type": "string" },
    "target": { "$ref": "cadre.json#/$defs/adapterId" },
    "skills": { "type": "array", "uniqueItems": true, "items": { "type": "string", "minLength": 1 } },
    "contexts": { "type": "array", "uniqueItems": true, "items": { "$ref": "cadre.json#/$defs/cadreName" } },
    "parameters": { "type": "object",
      "propertyNames": { "minLength": 1 },
      "additionalProperties": { "type": ["string", "number", "boolean"] } },
    "presets": { "type": "object", "properties": {
      "autonomy": { "enum": ["low", "medium", "high"] },
      "max_changed_files": { "type": "integer", "minimum": 1 },
      "language": { "enum": ["fr", "en"] },
      "commit_style": { "enum": ["conventional", "free"] } } },
    "tools": { "type": "object", "additionalProperties": { "type": "boolean" },
      "properties": { "terminal": {}, "browser": {}, "packages": {}, "network": {} } },
    "scope": { "type": "array", "items": { "type": "object",
      "required": ["path", "level"], "additionalProperties": false,
      "properties": {
        "path": { "type": "string",
          "pattern": "^(\\./|(?!/)(?!\\.{1,2}(/|$))(?!.*/\\.{1,2}(/|$))(?!.*//)[^\\\\\\x00-\\x1f:*?\"<>|]+)$" },
        "level": { "enum": ["write", "read", "deny"] } } } },
    "exports": { "type": "object", "additionalProperties": { "type": "object", "properties": {
      "path": { "type": "string" },
      "name": { "type": "string" },
      "frontmatter": { "type": "object" } } } }
  }
}
```

- **Identité** : `id` (UUID v4, généré à la création, jamais modifié) = identité stable, utilisée par le manifeste (D5) et l'historique `runs/` ; `name` = nom affiché, nom de fichier (`agents/<name>.yaml` et `.md`) et nom exporté. **Renommer** = renommer les deux fichiers et changer `name`, `id` inchangé ; aucun autre fichier de `.cadre/` ne référence un agent.
- **Champs MVP 0 obligatoires** : `id`, `name`, `target`. `role` et `description` vides ou absents = avertissement (AC-007-5). Champs MVP 1 facultatifs, absents = valeur par défaut : `skills`/`contexts` [] ; `parameters` {} ; `presets` absents = non réglés ; `tools` = Q-09 (`terminal: true`, les autres `false`) ; `scope` [] = tout le projet en écriture, sinon chemin non couvert = hors portée si au moins une règle `write` (Q-10).
- `scope.path` : forme normalisée unique (AC-013-4) : relatif, séparateur `/`, dossier terminé par `/`, racine = `./`, ni `..`, ni chemin absolu, ni `\`.
- **Instructions** : corps Markdown dans `agents/<nom>.md` (octets bruts) plutôt qu'en bloc YAML, qui ne garantit pas les octets (fins de ligne, espaces de tête, ligne finale).
- `exports.<adaptateur>` : réservé aux adaptateurs. `path`/`name` : surcharge quand l'import ne suit pas la convention (fichier `.claude/agents/x.md` dont `name` ≠ `x`, ou nom non conforme à `cadreName`) ; `frontmatter` : champs natifs que le modèle ne représente pas (`model`, `hooks`, `color`, inconnus…), conservés et réécrits tels quels (AC-010-3). Un renommage supprime la surcharge `path`/`name`.

### D4. Règles de nommage

**R1 — nom portable** (tout fichier ou dossier écrit par Cadre, y compris dossiers de skills et fichiers annexes), segment par segment : non vide, ≤ 255 octets UTF-8 ; aucun de `< > : " / \ | ? *` ni caractère de contrôle U+0000–U+001F ; ne finit ni par espace ni par `.` ; ni `.` ni `..` ; pas un nom réservé Windows, avec ou sans extension, quelle que soit la casse : `CON PRN AUX NUL COM0-9 LPT0-9` et `COM¹²³ LPT¹²³` ; unique dans son dossier **après normalisation Unicode NFC et repli de casse** (APFS et NTFS sont insensibles à la casse, macOS décompose en NFD). Chemin relatif > 200 caractères = avertissement (MAX_PATH Windows).

**R2 — nom Cadre** (agents, contextes) : R1 + motif `cadreName` (ASCII, lettres, chiffres, `-`, `_`, 1 à 64 caractères, ni premier ni dernier caractère `-`/`_`). Compatible avec un nom de sous-agent Claude Code (pas de `:`, pas de `-` initial). Unicité entre agents (resp. entre contextes) **insensible à la casse** : `Frontend` refusé si `frontend` existe (AC-007-3). Le nom de skill suit la spécification Agent Skills (SP-04) ; une skill importée hors règle reste importée et marquée en erreur (AC-004-3), tant qu'elle respecte R1.

### D5. Fichiers générés : manifeste `.cadre/generated.yaml`

Aucun marqueur dans les fichiers exportés. Cadre tient un manifeste versionné dans Git :

```yaml
files:
  - path: .claude/agents/frontend.md   # relatif au projet, séparateur /
    adapter: claude-code
    source: agent:7c9e6679-7425-40de-944b-e07fc1f90ae7   # agent:<id> | skill:<nom> | contexts
    sha256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

- `sha256` = empreinte du dernier contenu écrit **ou adopté** par Cadre, calculée après conversion CRLF → LF (une conversion de fins de ligne par Git n'est pas une modification utilisateur).
- **Fichier généré** = présent dans le manifeste **et** empreinte actuelle égale. Seul un tel fichier peut être réécrit ou supprimé sans confirmation (une suppression reste toujours confirmée, AC-009-5) ; sinon : absent du manifeste → confirmation explicite avec diff (AC-008-4, Q-02) ; présent mais empreinte différente → conflit (Q-03, US-048). Un fichier hors manifeste n'est jamais supprimé (AC-011-4).
- **Adoption** : à l'import accepté (US-003, US-004, US-010), les fichiers importés sont inscrits avec leur empreinte : l'utilisateur a consenti, et le prochain export les réécrit à l'identique.
- Le manifeste sert aussi à SP-07 (reconnaître une écriture de Cadre) et à AC-011-2 (`source: agent:<id>` relie l'ancien fichier à l'agent renommé).

### D6. Versions précédentes, temporaires, Git

- **Temporaires** : dans `.cadre/tmp/` (même volume que le projet, renommage atomique) ; repli à côté de la cible (`.<nom>.cadre-tmp-<aléa>`) seulement si le renommage échoue pour volume différent. Un export de plusieurs fichiers prépare tout dans `.cadre/tmp/txn-<id>/` avec un journal ; au démarrage, une transaction non validée est annulée grâce aux sauvegardes, puis `.cadre/tmp/` est vidé (AC-005-4). L'algorithme détaillé relève d'US-005 (porte 3).
- **Version précédente** (NF-13, Q-15 : une seule) : avant de remplacer un fichier, Cadre copie l'ancien dans `.cadre/backups/<chemin relatif au projet>` (ex. `.cadre/backups/CLAUDE.md`, `.cadre/backups/.cadre/agents/frontend.yaml`). `.cadre/backups/index.yaml` note par chemin : empreinte précédente (absente si le fichier a été créé, AC-051-2), empreinte écrite et date (AC-051-3).
- **Git** : Cadre ajoute au `.gitignore` racine, chacune seulement si absente, sans toucher aux autres lignes : `.cadre/runs/`, `.cadre/backups/`, `.cadre/tmp/`. Versionnés : tout le reste, y compris `generated.yaml`.

### D7. Export de `CLAUDE.md` (Q-02)

`CLAUDE.md` = concaténation, dans l'ordre de `cadre.yaml`, des contextes `scope: project` et `readonly: false`. Contenu repris octet pour octet ; entre deux contextes, si le précédent ne finit pas par une fin de ligne, Cadre en ajoute une, puis une ligne vide, dans le style (LF/CRLF) du précédent. Un seul contexte → fichier identique au contexte : l'aller-retour d'un `CLAUDE.md` importé est exact (AC-009-3). Aucun en-tête ajouté. Contenu identique au fichier sur disque → aucune écriture. Aucun contexte exportable : `CLAUDE.md` absent n'est pas créé ; présent et généré → suppression proposée avec confirmation.

### D8. Versionnage

- `schema_version` : entier ≥ 1, v1 = ce document. Comparaison entière avec la version supportée par l'app (S) : **égale** → normal ; **inférieure** → migrations successives en mémoire (fonctions pures `vN → vN+1`, testées chacune avec un projet témoin), projet ouvert normalement, rien n'est écrit avant un enregistrement volontaire, un bandeau prévient ; le premier enregistrement écrit tous les fichiers concernés en une transaction, avec sauvegardes ; **supérieure** → lecture seule, message « mettre Cadre à jour » (AC-006-2) ; **absente ou invalide** → erreur, modèle incomplet, réparation proposée sans écrire (AC-006-5).
- Changement de format : ajout d'un champ facultatif que l'ancienne version conserverait → pas de nouvelle version ; tout le reste (renommage, changement de sens, champ devenu obligatoire) → `schema_version + 1` et une migration.
- `generator_version` : SemVer de Cadre ayant écrit `cadre.yaml` en dernier ; informatif, jamais utilisé pour décider. Mis à jour seulement quand `cadre.yaml` est réécrit pour une autre raison (évite des diffs Git parasites).

### D9. Conservation des champs inconnus et des octets

1. **Skills, contextes, instructions d'agent** : stockés bruts ; l'export copie les octets.
2. **YAML de `.cadre/`** : le modèle garde le document YAML analysé (bibliothèque `yaml`, API `Document`, qui conserve commentaires, ordre et style). Enregistrer = modifier uniquement les clés changées. Clé inconnue = avertissement `W-UNKNOWN-KEY`, conservée. Fichier dont le modèle n'a pas changé = non réécrit.
3. **Fichiers natifs générés** (`.claude/agents/*.md`) : la base de l'export est le fichier actuel s'il est « généré » (D5) ; Cadre compare sémantiquement l'en-tête produit et celui de la base, ne modifie que les clés changées, puis recolle le corps brut. Rien changé → octets identiques (AC-010-2). Base absente → rendu canonique depuis le modèle + `exports.claude-code.frontmatter`.

### D10. Exemple complet valide

```yaml
# .cadre/cadre.yaml
schema_version: 1
generator_version: 0.1.0
tools: [claude-code]
contexts:
  - { name: CLAUDE, title: CLAUDE.md, type: projet, source: CLAUDE.md }
  - { name: CONVENTIONS, title: Conventions, type: conventions, scope: agents }
  - { name: AGENTS, title: AGENTS.md, type: autre, source: AGENTS.md, readonly: true }
```
```yaml
# .cadre/agents/frontend.yaml   (+ .cadre/agents/frontend.md : instructions)
id: 7c9e6679-7425-40de-944b-e07fc1f90ae7
name: frontend
role: Développeur front-end React
description: Implémente les écrans React. À utiliser pour toute tâche d'interface.
target: claude-code
skills: [ui-design]
contexts: [CONVENTIONS]
parameters: { framework: react }
presets: { autonomy: medium, max_changed_files: 20, language: fr, commit_style: conventional }
tools: { terminal: true, browser: false, packages: false, network: false }
scope:
  - { path: src/ui/, level: write }
  - { path: src/api/, level: read }
  - { path: infra/, level: deny }
exports:
  claude-code:
    frontmatter: { model: sonnet, color: blue }
```
Plus : `.cadre/skills/ui-design/SKILL.md` (+ `references/palette.md`), `.cadre/contexte/CLAUDE.md`, `CONVENTIONS.md`, `AGENTS.md`, et `generated.yaml` listant `CLAUDE.md`, `.claude/agents/frontend.md` et les fichiers de `.claude/skills/ui-design/`.

### D11. Exemples invalides (jeu de tests US-005, US-006, US-007)

Chaque erreur porte le fichier et, si possible, la ligne (AC-006-3). E = erreur (élément en erreur, rien n'est réécrit), W = avertissement.

| # | Cas | Résultat attendu |
| --- | --- | --- |
| 1 | `.cadre/` présent, `cadre.yaml` absent | E `CADRE_MISSING`, réparation proposée (AC-006-5) |
| 2 | `cadre.yaml` : YAML cassé (indentation) | E `YAML_SYNTAX` + ligne |
| 3 | Clé en double dans un YAML | E `YAML_DUPLICATE_KEY` + ligne |
| 4 | Fichier YAML non UTF-8 | E `ENCODING` |
| 5 | `schema_version` absent | E `SCHEMA` (required) |
| 6 | `schema_version: "1"` | E `SCHEMA` (type integer) |
| 7 | `schema_version: 0` | E `SCHEMA` (minimum) |
| 8 | `schema_version: 2` (app en v1) | projet en lecture seule, `NEWER_SCHEMA` (AC-006-2) |
| 9 | `generator_version: "1.0"` | E `SCHEMA` (pattern SemVer) |
| 10 | `tools: [claude-code, claude-code]` | E `SCHEMA` (uniqueItems) |
| 11 | `cadre.yaml` contient `couleur: bleu` | W `UNKNOWN_KEY`, clé conservée à l'enregistrement |
| 12 | Contexte déclaré sans `contexte/<nom>.md` | E `CONTEXT_FILE_MISSING` |
| 13 | `contexte/notes.md` non déclaré | W `CONTEXT_UNDECLARED`, non exporté |
| 14 | `agents/front.yaml` avec `name: frontend` | E `AGENT_FILENAME_MISMATCH` |
| 15 | Agent sans `id`, ou `id: 42` | E `SCHEMA` |
| 16 | Deux agents avec le même `id` | E `DUPLICATE_ID` (les deux) |
| 17 | `Frontend.yaml` et `frontend.yaml` (dépôt créé sous Linux) | E `DUPLICATE_NAME` (AC-007-3) |
| 18 | `name: CON` / `name: com1` | E `NAME_RESERVED` (AC-007-4) |
| 19 | `name: "a:b"`, `"-x"`, `""`, 65 caractères | E `SCHEMA` (pattern cadreName) (AC-007-4) |
| 20 | `target` absent | E `SCHEMA` |
| 21 | `target: codex` sans adaptateur disponible | E `TARGET_UNAVAILABLE`, agent non exportable (AC-007-2) |
| 22 | `description: ""` ou `role` absent | W `DESCRIPTION_MISSING` (AC-007-5) |
| 23 | `skills: [inexistante]` | E `UNKNOWN_SKILL_REF` |
| 24 | `contexts: [INEXISTANT]` | E `UNKNOWN_CONTEXT_REF` |
| 25 | `scope` : `path: ../autre`, `/etc/`, `src\api` | E `SCHEMA` (pattern path) (AC-013-2, AC-013-4) |
| 26 | Deux règles `path: src/api/` | E `SCOPE_DUPLICATE` (AC-013-4) |
| 27 | `tools: { gpu: true }` | W `UNKNOWN_TOOL`, conservé (AC-015-3) |
| 28 | `tools: { terminal: "oui" }` | E `SCHEMA` (type boolean) |
| 29 | `presets: { autonomy: max }` | E `SCHEMA` (enum) (AC-038-2) |
| 30 | `parameters: { "": x }` ou valeur liste/objet | E `SCHEMA` |
| 31 | `parameters: { language: fr }` | W `PARAM_IS_PRESET` (AC-037-3) |
| 32 | Fichier d'agent dont la racine est une liste | E `SCHEMA` (type object) |

## Écarts constatés à l'implémentation (2026-10-01)

Relevés pendant US-005 (PR #4). Statut de ces points : **en attente du merge d'US-005**.

- **Sauvegarde** : faite APRÈS validation, à partir de la copie `.ancien` (et non avant l'écriture) ; garantie équivalente.
- **`index.yaml`** : écrit en JSON, qui est du YAML 1.2 valide.
- **Verrou** : fichier de verrou permanent `.cadre/tmp/verrou`.
- **Transactions irrécupérables** : mises de côté en `.cadre/tmp/de-cote-txn-…`.
- **Non implémenté** : le repli « temporaire à côté de la cible si volume différent ».

Décisions de l'orchestrateur prises pendant US-005 (même statut) : annulation (pas de rejeu) à la récupération ; `.gitignore` modifié seulement si le projet est un dépôt Git (racine ou parent) ; racine du projet tenue côté Rust via `ouvrir_projet` ; toute opération de fichier passe par une résolution sûre qui refuse tout lien/jonction sur chaque segment.

## Alternatives écartées et pourquoi

- **Marqueur « généré par Cadre » dans le fichier** (commentaire HTML, clé d'en-tête) : casse l'aller-retour octet pour octet (AC-009-3, AC-010-2) ; dans `CLAUDE.md`, coûte des jetons envoyés au modèle ; avant `---`, empêche Claude Code de lire l'en-tête ; et un marqueur copié à la main ferait passer un fichier utilisateur pour généré. Le manifeste avec empreinte détecte en plus les modifications externes (Q-03).
- **Empreinte des octets exacts** : Git `autocrlf` sous Windows signalerait à tort chaque fichier comme modifié.
- **Fichiers d'agents nommés par identifiant** (`agents/7c9e….yaml`) : illisible dans Git et contraire à AC-007-1 ; le couple `id` + `name` donne renommage et lisibilité.
- **Métadonnées de contexte dans le `.md` (en-tête YAML)** : le contenu ne serait plus identique à la source (AC-003-2) et l'en-tête partirait dans `CLAUDE.md`. Fichier annexe par contexte : plus de fichiers sans gain, et l'ordre d'export resterait à stocker ailleurs.
- **Liens contexte → agents côté contexte** : un renommage d'agent toucherait plusieurs fichiers.
- **Instructions d'agent en bloc YAML `|`** : pas d'octets garantis (CRLF, espaces de tête, ligne finale).
- **Copie brute des fichiers natifs dans `.cadre/`** pour l'aller-retour : double source de vérité ; le fichier généré actuel, vérifié par empreinte, suffit comme base.
- **Région délimitée dans `CLAUDE.md`** : écartée par le PO (Q-02).
- **Sauvegardes et temporaires dans le dossier de l'app** (hors projet) : perdus si le projet est déplacé, et volume différent → renommage non atomique.
- **`.gitignore` dans `.cadre/`** : plus propre, mais contraire à AC-005-2, qui vise le `.gitignore` racine.
- **`schema_version` par fichier** ou en SemVer : complexité sans besoin ; un entier global suffit à décider lecture seule / migration.

## Conséquences

- US-005 met en place `.cadre/tmp/`, `.cadre/backups/`, le journal de transaction et les trois lignes `.gitignore` : **AC-005-2 doit être complété** (`backups/` et `tmp/` en plus de `runs/`). Fait le 2026-10-01 : AC-005-2 étendu par décision de l'orchestrateur (PO délégant), voir [Backlog](Backlog).
- Les schémas JSON ci-dessus sont copiés dans le code (`schemas/v1/`) par US-005/US-006 ; les 32 cas de D11 deviennent des tests nommés avec l'AC concerné ; l'exemple D10 sert de projet témoin et de base aux futurs tests de migration.
- Les validations hors JSON Schema (`NAME_RESERVED`, unicité NFC + casse, références, nom de fichier ≠ `name`, règles en double) forment une seconde passe du validateur, indépendante de l'interface.
- Les adaptateurs ne lisent et n'écrivent que `exports.<leur id>` ; le cœur ignore son contenu (NF-19).
- US-003, US-004 et US-010 inscrivent les fichiers importés dans `generated.yaml` (adoption) ; US-008, US-009 et US-011 s'appuient sur le manifeste pour décider écrasement, conflit ou suppression.
- Risque résiduel : un export après une modification de l'en-tête d'un sous-agent peut reformater les lignes modifiées (la bibliothèque `yaml` ne garantit pas les octets des valeurs changées) ; seules les lignes changées sont concernées, accepté.
- SP-02 précisera la traduction vers Claude Code de `role`, `presets`, `tools` et `scope` ; SP-04 les règles de validation des skills ; SP-07 réutilisera les empreintes du manifeste.
