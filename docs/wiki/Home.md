# Cadre — wiki du projet

Mémoire du projet : une session sans contexte reprend le travail en lisant [Sprint-courant](Sprint-courant), [Backlog](Backlog) et la dernière entrée du journal du sprint actif.

## État du projet (2026-10-01)

1. Sprint 0 (mise en place) terminé et mergé : PR #1.
2. Backlog validé par le PO le 2026-10-01 (porte 1) ; options par défaut Q-01 à Q-22 acceptées par délégation.
3. Sprint 1 en cours : « J'ouvre un projet Claude Code existant, je vois ses skills et son CLAUDE.md, et Cadre enregistre un premier modèle .cadre/ qui ne peut pas être corrompu. » (11 points ; SP-01 Done → [ADR-001](ADR-001-format-cadre-v1), 2 points ; US-001 en cours ; PR #2 ouverte pour la publication du wiki).
4. Objectif à moyen terme (fixé par l'orchestrateur) : MVP 0 complet (Sprints 1 à 3) comme premier livrable fonctionnel.
5. Le PO a délégué les portes 2, 4 et 5 à l'orchestrateur ; porte 3 (zones sensibles) maintenue avec deux revues relecteur et un résumé en langage simple au PO.

## Pages

- [Cahier des charges](Cahier-des-charges)
- [Méthode](Methode) — pipeline, portes, DoR, DoD, commandes
- [Backlog](Backlog) · [Questions au PO](Questions-PO) · [Traçabilité](Tracabilite)
- [Sprint courant](Sprint-courant) · [Sprint 00](Sprint-00) · [Sprint 01](Sprint-01)
- [Vélocité](Velocite)
- Décisions : [ADR-001 — Format .cadre/ v1](ADR-001-format-cadre-v1) · [ADR-002 — Wiki publié depuis docs/wiki](ADR-002-wiki-depuis-docs)

## Comment ce wiki est tenu

Les pages vivent dans le dépôt de code, dossier `docs/wiki/`, et sont publiées dans le wiki GitHub par `.github/workflows/wiki.yml` à chaque merge sur `main` ([ADR-002](ADR-002-wiki-depuis-docs)). Ne jamais éditer le wiki GitHub à la main : il serait écrasé.
