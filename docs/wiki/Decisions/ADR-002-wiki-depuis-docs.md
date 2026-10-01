# ADR-002 — Wiki publié depuis docs/wiki
Date : 2026-10-01 · Statut : accepté

## Contexte
Le wiki est la mémoire du projet. Le wiki GitHub est un dépôt Git séparé (`.wiki.git`), mais la session cloud n'a accès en écriture qu'au dépôt de code : le wiki GitHub ne peut pas être poussé depuis la session.

## Décision
Les pages du wiki sont tenues dans le dépôt de code, dossier `docs/wiki/`. Le workflow `.github/workflows/wiki.yml` les recopie dans le wiki GitHub à chaque merge sur `main` (et sur lancement manuel).

## Alternatives écartées et pourquoi
- Push direct au wiki GitHub : impossible depuis la session.
- Wiki laissé hors dépôt : perte de la mémoire du projet entre sessions.

## Conséquences
- Une mise à jour du wiki passe par une PR, souvent la PR de la story elle-même (« wiki à jour » fait partie de la DoD).
- Ne jamais éditer le wiki GitHub à la main : il serait écrasé à la publication suivante.
- La mémoire se lit dans `docs/wiki/`, toujours présent dans le clone.

## Amorçage
Le dépôt `.wiki.git` n'existe qu'après activation du wiki et création d'une première page depuis l'interface web (fait par le PO le 2026-10-01). Si le workflow `Wiki` échoue au clonage, il affiche ce rappel.
