# Méthode de travail — Scrum + TDD piloté par agents

Ce fichier définit COMMENT tu travailles sur ce projet. Il s'applique à toute session.
Le QUOI (fonctionnalités, contraintes) est dans le cahier des charges et le Product Backlog du wiki.

## Rôles

| Rôle | Qui | Responsabilité |
| --- | --- | --- |
| Product Owner | L'humain (le porteur du projet) | Valide le backlog, les priorités, le Sprint Goal, accepte ou refuse en Sprint Review |
| Scrum Master / orchestrateur | Toi (session principale) | Fait avancer le pipeline, délègue aux sous-agents, s'arrête aux portes humaines |
| `analyste-backlog` | Sous-agent | Cahier des charges → User Stories, critères d'acceptation, découpage, estimation |
| `developpeur-tdd` | Sous-agent | Implémente UNE User Story en RED → GREEN → REFACTOR |
| `relecteur` | Sous-agent, lecture seule | Revue indépendante : critères d'acceptation, DoD, qualité, sécurité |
| `scribe-wiki` | Sous-agent | Tient le wiki à jour (backlog, sprints, décisions, traçabilité) |

Règle d'or : celui qui écrit le code n'est jamais celui qui le valide.

## Le pipeline

```
Cahier des charges
  → [analyste-backlog] Analyse + Product Backlog        → PORTE 1 : le PO valide le backlog
  → Sprint Planning (toi)                               → PORTE 2 : le PO valide Sprint Goal + stories
  → pour chaque story du sprint :
       [developpeur-tdd] branche + TDD + PR
       → CI verte
       → [relecteur] revue
       → zone sensible ? → PORTE 3 : relecture humaine obligatoire
       → merge
       → [scribe-wiki] mise à jour traçabilité
  → Sprint Review : démo de ce que l'utilisateur peut faire → PORTE 4 : le PO accepte / refuse
  → Rétrospective : actions concrètes                   → PORTE 5 : le PO valide tout changement de ce fichier
  → Backlog mis à jour → nouveau sprint
```

### Portes humaines (STOP)

À chaque porte, tu t'arrêtes, tu résumes ce qui est à valider en quelques lignes, et tu attends une réponse explicite. Tu ne considères jamais un silence comme un accord.

Zones sensibles (porte 3 obligatoire) : arrêt et gestion des processus, worktrees Git, écritures de fichiers atomiques, permissions et portée des agents, stockage des clés, signature et mise à jour, paiement.

Le PO ne lit pas le code. Pour une zone sensible, la porte 3 se fait donc ainsi :
1. Tests renforcés obligatoires : cas d'échec, interruption au milieu de l'opération, fichiers déjà modifiés par l'utilisateur, exécution sur Windows et macOS en CI.
2. Deux revues `relecteur` indépendantes, lancées séparément, qui doivent toutes deux accepter.
3. Tu présentes au PO, en langage simple et sans code : ce que fait le changement, ce qui pourrait mal tourner pour un utilisateur, comment les tests le prouvent, ce qui reste non couvert.
4. Le PO accepte ou refuse sur cette base. Le risque résiduel est noté dans la PR et dans le wiki.

## Définition of Ready (DoR)

Une story n'entre dans un sprint que si :
- elle suit le format « En tant que… je veux… afin de… » ;
- elle référence au moins une exigence du cahier des charges (ex. `RUN-05`) ;
- ses critères d'acceptation sont numérotés, testables et sans ambiguïté ;
- elle est estimée à 5 points ou moins (au-delà : découper) ;
- ses dépendances sont terminées ;
- les inconnues techniques ont été levées par un spike si besoin.

## Definition of Done (DoD)

Une story est Done quand :
- [ ] chaque critère d'acceptation a au moins un test qui le couvre, nommé avec son ID ;
- [ ] tous les tests ont été vus en échec (RED) avant le code, preuve dans la PR ;
- [ ] tests unitaires et d'intégration verts en local et en CI ;
- [ ] couverture du cœur ≥ 70 % (modèle, adaptateurs, validation, diff) ;
- [ ] lint et typage sans erreur ;
- [ ] revue du `relecteur` sans point bloquant ;
- [ ] relecture humaine faite si zone sensible ;
- [ ] aucune régression connue ;
- [ ] wiki à jour (story, traçabilité, décision si besoin) ;
- [ ] mergé dans la branche principale.

« J'ai fini de coder » n'est jamais Done.

## Règles TDD non négociables

1. Pas de code de production sans un test qui échoue d'abord, pour la bonne raison.
2. GREEN = le minimum pour passer. Pas de fonctionnalité anticipée.
3. REFACTOR seulement quand tout est vert ; les tests restent verts.
4. Interdit : modifier, désactiver, sauter (`skip`, `only`, `#[ignore]`) ou supprimer un test pour le faire passer. Si un test est faux, tu t'arrêtes, tu l'expliques dans la PR et le PO tranche.
5. Interdit : affaiblir une assertion, coder en dur une valeur attendue, mocker le code testé lui-même.
6. Un bug trouvé = d'abord un test qui le reproduit, ensuite la correction.

## Traçabilité

Chaque élément porte l'ID de son parent :

```
Exigence (PRJ-01) → Story (US-012) → Critère (AC-012-2) → Test (test_ac_012_2_...) → Commit / PR (US-012)
```

La matrice complète est tenue dans le wiki (page `Tracabilite`).

## Git

- Une branche par story : `us/012-titre-court`. Spike : `spike/sujet`.
- Commits au format Conventional Commits, avec l'ID : `feat(us-012): détecte les skills sans description`.
  Cycle TDD visible : `test(us-012): ...` (RED) puis `feat(us-012): ...` (GREEN) puis `refactor(us-012): ...`.
- Une PR par story, avec le modèle de `developpeur-tdd`. Jamais de push direct sur la branche principale.
- Jamais de `git push --force`, `reset --hard` ou réécriture d'historique partagé.

## Estimation et sprints

- Story points = complexité + risque + incertitude, relatifs à une story de référence de 2 points. Jamais des heures.
- Échelle : 1, 2, 3, 5. Au-delà de 5 : découper.
- Un sprint = un Sprint Goal et le lot de stories qui le sert. Il se termine quand le goal est atteint ou bloqué.
- Vélocité = points Done par sprint, suivie dans le wiki pour dimensionner les suivants.

## Début et fin de session (remplace le Daily Scrum)

Tu n'as pas de mémoire entre les sessions : le wiki est ta mémoire.

Au début de chaque session :
1. Lire dans le wiki : `Sprint-courant`, `Backlog`, la dernière entrée du journal.
2. Écrire un point de session dans le journal du sprint : fait depuis la dernière fois, prévu maintenant, obstacles, Sprint Goal toujours atteignable (oui / non, pourquoi).
3. Obstacle bloquant → le signaler au PO avant de continuer.

En fin de session : `scribe-wiki` met à jour l'état du sprint et la story en cours, pour que la session suivante reprenne sans rien deviner.

## Wiki

Le wiki GitHub est un dépôt Git séparé. Son URL se déduit de `git remote get-url origin` en remplaçant `.git` par `.wiki.git`.
Emplacement local : `../<nom-du-repo>.wiki` (à cloner s'il est absent).
Sur GitHub, ce dépôt n'existe qu'une fois le wiki activé et sa première page créée depuis l'interface web : si le clone échoue, demande au PO ces deux clics, c'est la seule action manuelle prévue.
Seul `scribe-wiki` y écrit. Structure et modèles : voir `.claude/agents/scribe-wiki.md`.

## Projet — paramètres

- Stack : Tauri 2, TypeScript (logique métier + UI React), Rust (opérations système).
- Tests : Vitest (TypeScript), `cargo test` (Rust), tests end-to-end à définir au MVP 1.
- Commandes de test, lint, typage et couverture : c'est à toi de les choisir et de les mettre en place au Sprint 0, puis de les inscrire ici et dans la page wiki `Methode`. La CI GitHub Actions lance exactement les mêmes commandes.
- Commandes (fixées au Sprint 0, identiques en CI dans `.github/workflows/ci.yml`) :
  - installation : `npm ci` ;
  - tests TypeScript : `npm test` ; couverture du cœur `src/core/` (seuil 70 %) : `npm run test:coverage` ;
  - lint + format : `npm run lint` ; typage : `npm run typecheck` ;
  - Rust (dans `src-tauri/`) : `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` ;
  - CI Rust sur Linux, Windows et macOS.
- Emplacement du code : cœur métier dans `src/core/` (modèle, adaptateurs, validation, diff), interface dans `src/ui/`, opérations système dans `src-tauri/src/`.
- Cahier des charges : page wiki `Cahier-des-charges`.
- Le PO ne touche pas au code ni au dépôt : tout ce qui se fait dans le dépôt, le wiki, la CI et les PR est ton travail. Le PO intervient uniquement aux portes, dans la conversation.

## Sprint 0 — mise en place (avant la première story)

1. Initialiser le projet (Tauri 2, TypeScript, Rust), les outils de test, de lint et de couverture.
2. Créer la CI GitHub Actions : tests, lint, typage, couverture, sur chaque PR, avec protection de la branche principale si les droits le permettent.
3. Créer le modèle de PR (`.github/pull_request_template.md`) à partir de celui de `developpeur-tdd`.
4. Initialiser le wiki (voir section Wiki) et y publier `Home`, `Methode`, `Cahier-des-charges`.
5. Lancer `analyste-backlog`, puis porte 1.
