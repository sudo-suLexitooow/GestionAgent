# Cadre — wiki du projet

Mémoire du projet : une session sans contexte reprend le travail en lisant [Sprint-courant](Sprint-courant), [Backlog](Backlog) et la dernière entrée du journal du sprint actif.

## État du projet (2026-10-02)

1. Sprint 0 (mise en place) terminé et mergé : PR #1.
2. Backlog validé par le PO le 2026-10-01 (porte 1) ; options par défaut Q-01 à Q-22 acceptées au titre de la délégation générale du PO (« je te laisse tout gérer », interprétation consignée dans [Methode](Methode)).
3. Sprint 1 terminé le 2026-10-01 : 11/11 points. Sprint 2 terminé le 2026-10-01 : 13/13 points (SP-02 → [ADR-003](ADR-003-capacites-claude-code), US-076 PR #9, US-006 PR #10, US-077 PR #12, US-007 PR #13) ; on peut ouvrir un projet, importer CLAUDE.md/AGENTS.md, créer un agent, enregistrer dans `.cadre/` et tout retrouver en rouvrant. Sprint 3 en cours (15 points) : « Un projet Claude Code existant fait l'aller-retour Cadre → Claude Code sans perte » (porte MVP 0) — US-004 Done le 2026-10-02 (PR #15, 3/15 points : import des skills existantes dans le modèle), US-008 en revue (PR #16, zone sensible), US-009, US-010, US-011, US-079 à faire ; SP-03 reporté au Sprint 4 (Q-11). Question ouverte : [Q-23](Questions-PO) (clé d'API Anthropic en secret de CI). Obstacle relevé au Sprint 2 : publication du wiki GitHub en attente de la première page créée par le PO (état non revérifié le 2026-10-01).
4. Objectif à moyen terme (fixé par l'orchestrateur) : MVP 0 complet (Sprints 1 à 3, SP-03 au Sprint 4) comme premier livrable fonctionnel.
5. Délégation : le PO a écrit « tu es le chef de projet je te laisse tout gérer » ; interprétation consignée dans [Methode](Methode) : portes 2 et 4 confiées à l'orchestrateur ; porte 5 (changements de CLAUDE.md) en attente de confirmation explicite du PO (demandée le 2026-10-01).

## Pages

- [Cahier des charges](Cahier-des-charges)
- [Méthode](Methode) — pipeline, portes, DoR, DoD, commandes
- [Backlog](Backlog) · [Questions au PO](Questions-PO) · [Traçabilité](Tracabilite)
- [Sprint courant](Sprint-courant) · [Sprint 03](Sprint-03) · [Sprint 02](Sprint-02) · [Sprint 01](Sprint-01) · [Sprint 00](Sprint-00)
- [Vélocité](Velocite)
- Décisions : [ADR-001 — Format .cadre/ v1](ADR-001-format-cadre-v1) · [ADR-002 — Wiki publié depuis docs/wiki](ADR-002-wiki-depuis-docs) · [ADR-003 — Capacités de l'adaptateur Claude Code](ADR-003-capacites-claude-code)

## Comment ce wiki est tenu

Les pages vivent dans le dépôt de code, dossier `docs/wiki/`, et sont publiées dans le wiki GitHub par `.github/workflows/wiki.yml` à chaque merge sur `main` ([ADR-002](ADR-002-wiki-depuis-docs)). Ne jamais éditer le wiki GitHub à la main : il serait écrasé.
