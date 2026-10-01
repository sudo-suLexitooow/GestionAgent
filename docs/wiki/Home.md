# Cadre — wiki du projet

Mémoire du projet : une session sans contexte reprend le travail en lisant [Sprint-courant](Sprint-courant), [Backlog](Backlog) et la dernière entrée du journal du sprint actif.

## État du projet (2026-10-01)

1. Sprint 0 (mise en place) terminé et mergé : PR #1.
2. Backlog validé par le PO le 2026-10-01 (porte 1) ; options par défaut Q-01 à Q-22 acceptées au titre de la délégation générale du PO (« je te laisse tout gérer », interprétation consignée dans [Methode](Methode)).
3. Sprint 1 terminé le 2026-10-01 : 11/11 points (SP-01, US-001 PR #3, US-002 PR #5, US-003 PR #6, US-005 PR #4, zone sensible). Sprint 2 en cours (13 points) : « J'enregistre mon cadrage dans .cadre/ depuis l'application, je le retrouve en rouvrant le projet, et je crée mon premier agent. » (US-077, US-006, US-007, US-076, SP-02). Obstacle : publication du wiki en échec tant que le PO n'a pas créé la première page du wiki GitHub.
4. Objectif à moyen terme (fixé par l'orchestrateur) : MVP 0 complet (Sprints 1 à 3) comme premier livrable fonctionnel.
5. Délégation : le PO a écrit « tu es le chef de projet je te laisse tout gérer » ; interprétation consignée dans [Methode](Methode) : portes 2 et 4 confiées à l'orchestrateur ; porte 5 (changements de CLAUDE.md) en attente de confirmation explicite du PO (demandée le 2026-10-01).

## Pages

- [Cahier des charges](Cahier-des-charges)
- [Méthode](Methode) — pipeline, portes, DoR, DoD, commandes
- [Backlog](Backlog) · [Questions au PO](Questions-PO) · [Traçabilité](Tracabilite)
- [Sprint courant](Sprint-courant) · [Sprint 02](Sprint-02) · [Sprint 01](Sprint-01) · [Sprint 00](Sprint-00)
- [Vélocité](Velocite)
- Décisions : [ADR-001 — Format .cadre/ v1](ADR-001-format-cadre-v1) · [ADR-002 — Wiki publié depuis docs/wiki](ADR-002-wiki-depuis-docs)

## Comment ce wiki est tenu

Les pages vivent dans le dépôt de code, dossier `docs/wiki/`, et sont publiées dans le wiki GitHub par `.github/workflows/wiki.yml` à chaque merge sur `main` ([ADR-002](ADR-002-wiki-depuis-docs)). Ne jamais éditer le wiki GitHub à la main : il serait écrasé.
