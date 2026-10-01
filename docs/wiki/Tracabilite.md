# Traçabilité — Exigence → Story → Critère → Test → PR

Version : 2026-10-01 · Source : [Backlog](Backlog) · **Statut du backlog : validé par le PO le 2026-10-01 (porte 1)**

Une ligne par critère d'acceptation. Les colonnes Tests et PR sont remplies par `scribe-wiki` au fil des merges. Les tests sont nommés avec l'ID du critère (ex. `test_ac_012_2_...`).

## Couverture des exigences Must (MVP 0 et MVP 1)

Toutes les exigences Must du MVP 0 et du MVP 1 sont couvertes par au moins une story. Points d'attention :

- **ADP-02** (Must, MVP 0) : livrée en deux temps. Agents, skills et contexte au MVP 0 (US-008, US-009, US-010) ; « réglages de permissions » au MVP 1 (US-014, US-016), car la portée et les outils (AGT-06, AGT-07) sont des exigences du MVP 1. Confirmé par l'option par défaut Q-04 (2026-10-01).
- **AGT-04** (Must) : couverte par US-038, débloquée le 2026-10-01 (Q-07 : option par défaut acceptée).
- **VAL-03** (Must) : couverte par US-043, débloquée le 2026-10-01 (Q-08 : option par défaut acceptée).
- **ACC-01** (Must) : contrainte métier, couverte par AC-001-6 et vérifiée en revue (aucune fonction ne demande de compte).
- **ADP-01** (Must, MVP 0) : contrainte d'architecture, couverte par AC-004-4, AC-008-5, AC-054-4.
- Critères de recette §13.1 non couverts par une story : « cinq bêta-testeurs cadrent un projet 2 fois plus vite » (activité de bêta, pas de développement) et « NF-01 à NF-03 atteints » (couverts par SP-03 puis la DoD).
- Exigences sans stade MVP 0/1 « Must » mais présentes : §7.4 (format `.cadre/`) tracé sous `§7.4`.

## Matrice

| Exigence | Story | Critère | Tests | PR | Statut |
| --- | --- | --- | --- | --- | --- |
| PRJ-01 | US-001 | AC-001-1 |  |  | À faire |
| PRJ-01 | US-001 | AC-001-2 |  |  | À faire |
| PRJ-01 | US-001 | AC-001-3 |  |  | À faire |
| PRJ-01 | US-001 | AC-001-4 |  |  | À faire |
| PRJ-01 | US-001 | AC-001-5 |  |  | À faire |
| PRJ-02 | US-002 | AC-002-5 |  |  | À faire |
| PRJ-02 | US-003 | AC-003-1 |  |  | À faire |
| PRJ-02 | US-003 | AC-003-2 |  |  | À faire |
| PRJ-02 | US-003 | AC-003-3 |  |  | À faire |
| PRJ-02 | US-003 | AC-003-5 |  |  | À faire |
| PRJ-02 | US-004 | AC-004-1 |  |  | À faire |
| PRJ-02 | US-004 | AC-004-2 |  |  | À faire |
| PRJ-02 | US-004 | AC-004-5 |  |  | À faire |
| PRJ-02 | US-006 | AC-006-4 |  |  | À faire |
| PRJ-02 | US-009 | AC-009-3 |  |  | À faire |
| PRJ-02 | US-010 | AC-010-1 |  |  | À faire |
| PRJ-02 | US-010 | AC-010-2 |  |  | À faire |
| PRJ-02 | US-010 | AC-010-5 |  |  | À faire |
| PRJ-04 | US-045 | AC-045-1 |  |  | À faire |
| PRJ-04 | US-045 | AC-045-2 |  |  | À faire |
| PRJ-04 | US-045 | AC-045-3 |  |  | À faire |
| PRJ-04 | US-045 | AC-045-4 |  |  | À faire |
| PRJ-05 | US-046 | AC-046-1 |  |  | À faire |
| PRJ-05 | US-046 | AC-046-2 |  |  | À faire |
| PRJ-05 | US-046 | AC-046-3 |  |  | À faire |
| PRJ-05 | US-046 | AC-046-4 |  |  | À faire |
| PRJ-06 | US-058 | AC-058-1 |  |  | À faire |
| PRJ-06 | US-058 | AC-058-2 |  |  | À faire |
| PRJ-06 | US-058 | AC-058-3 |  |  | À faire |
| PRJ-07 | US-047 | AC-047-1 |  |  | À faire |
| PRJ-07 | US-047 | AC-047-2 |  |  | À faire |
| PRJ-07 | US-047 | AC-047-3 |  |  | À faire |
| PRJ-07 | US-047 | AC-047-4 |  |  | À faire |
| PRJ-07 | US-047 | AC-047-5 |  |  | À faire |
| PRJ-08 | US-048 | AC-048-1 |  |  | À faire |
| PRJ-08 | US-048 | AC-048-2 |  |  | À faire |
| PRJ-08 | US-048 | AC-048-3 |  |  | À faire |
| PRJ-08 | US-048 | AC-048-4 |  |  | À faire |
| PRJ-08 | US-048 | AC-048-5 |  |  | À faire |
| SKL-01 | US-002 | AC-002-1 |  |  | À faire |
| SKL-01 | US-002 | AC-002-2 |  |  | À faire |
| SKL-01 | US-002 | AC-002-3 |  |  | À faire |
| SKL-01 | US-002 | AC-002-4 |  |  | À faire |
| SKL-02 | US-031 | AC-031-1 |  |  | À faire |
| SKL-02 | US-031 | AC-031-2 |  |  | À faire |
| SKL-02 | US-031 | AC-031-3 |  |  | À faire |
| SKL-02 | US-031 | AC-031-4 |  |  | À faire |
| SKL-02 | US-031 | AC-031-5 |  |  | À faire |
| SKL-03 | US-032 | AC-032-1 |  |  | À faire |
| SKL-03 | US-032 | AC-032-2 |  |  | À faire |
| SKL-03 | US-032 | AC-032-3 |  |  | À faire |
| SKL-03 | US-032 | AC-032-4 |  |  | À faire |
| SKL-03 | US-032 | AC-032-5 |  |  | À faire |
| SKL-04 | US-056 | AC-056-1 |  |  | À faire |
| SKL-04 | US-056 | AC-056-2 |  |  | À faire |
| SKL-04 | US-056 | AC-056-3 |  |  | À faire |
| SKL-04 | US-056 | AC-056-4 |  |  | À faire |
| SKL-05 | US-033 | AC-033-1 |  |  | À faire |
| SKL-05 | US-033 | AC-033-2 |  |  | À faire |
| SKL-05 | US-033 | AC-033-3 |  |  | À faire |
| SKL-05 | US-033 | AC-033-4 |  |  | À faire |
| SKL-08 | US-034 | AC-034-1 |  |  | À faire |
| SKL-08 | US-034 | AC-034-2 |  |  | À faire |
| SKL-08 | US-034 | AC-034-3 |  |  | À faire |
| CTX-01 | US-035 | AC-035-1 |  |  | À faire |
| CTX-01 | US-035 | AC-035-2 |  |  | À faire |
| CTX-01 | US-035 | AC-035-3 |  |  | À faire |
| CTX-01 | US-035 | AC-035-4 |  |  | À faire |
| CTX-01 | US-035 | AC-035-5 |  |  | À faire |
| CTX-02 | US-059 | AC-059-1 |  |  | À faire |
| CTX-02 | US-059 | AC-059-2 |  |  | À faire |
| CTX-02 | US-059 | AC-059-3 |  |  | À faire |
| CTX-03 | US-036 | AC-036-1 |  |  | À faire |
| CTX-03 | US-036 | AC-036-2 |  |  | À faire |
| CTX-03 | US-036 | AC-036-3 |  |  | À faire |
| CTX-04 | US-057 | AC-057-1 |  |  | À faire |
| CTX-04 | US-057 | AC-057-2 |  |  | À faire |
| CTX-04 | US-057 | AC-057-3 |  |  | À faire |
| AGT-01 | US-007 | AC-007-1 |  |  | À faire |
| AGT-01 | US-007 | AC-007-3 |  |  | À faire |
| AGT-01 | US-007 | AC-007-4 |  |  | À faire |
| AGT-01 | US-011 | AC-011-1 |  |  | À faire |
| AGT-01 | US-011 | AC-011-2 |  |  | À faire |
| AGT-01 | US-011 | AC-011-3 |  |  | À faire |
| AGT-01 | US-011 | AC-011-4 |  |  | À faire |
| AGT-01 | US-011 | AC-011-5 |  |  | À faire |
| AGT-02 | US-007 | AC-007-2 |  |  | À faire |
| AGT-02 | US-007 | AC-007-5 |  |  | À faire |
| AGT-03 | US-037 | AC-037-1 |  |  | À faire |
| AGT-03 | US-037 | AC-037-2 |  |  | À faire |
| AGT-03 | US-037 | AC-037-3 |  |  | À faire |
| AGT-03 | US-037 | AC-037-4 |  |  | À faire |
| AGT-03 | US-037 | AC-037-5 |  |  | À faire |
| AGT-04 | US-038 | AC-038-1 |  |  | À faire |
| AGT-04 | US-038 | AC-038-2 |  |  | À faire |
| AGT-04 | US-038 | AC-038-3 |  |  | À faire |
| AGT-05 | US-012 | AC-012-1 |  |  | À faire |
| AGT-05 | US-012 | AC-012-2 |  |  | À faire |
| AGT-05 | US-012 | AC-012-3 |  |  | À faire |
| AGT-05 | US-012 | AC-012-4 |  |  | À faire |
| AGT-05 | US-012 | AC-012-5 |  |  | À faire |
| AGT-06 | US-015 | AC-015-1 |  |  | À faire |
| AGT-06 | US-015 | AC-015-2 |  |  | À faire |
| AGT-06 | US-015 | AC-015-3 |  |  | À faire |
| AGT-06 | US-016 | AC-016-1 |  |  | À faire |
| AGT-07 | US-013 | AC-013-1 |  |  | À faire |
| AGT-07 | US-013 | AC-013-2 |  |  | À faire |
| AGT-07 | US-013 | AC-013-3 |  |  | À faire |
| AGT-07 | US-013 | AC-013-4 |  |  | À faire |
| AGT-07 | US-013 | AC-013-5 |  |  | À faire |
| AGT-07 | US-014 | AC-014-1 |  |  | À faire |
| AGT-08 | US-040 | AC-040-1 |  |  | À faire |
| AGT-08 | US-040 | AC-040-2 |  |  | À faire |
| AGT-08 | US-040 | AC-040-3 |  |  | À faire |
| AGT-08 | US-040 | AC-040-4 |  |  | À faire |
| ADP-01 | US-004 | AC-004-4 |  |  | À faire |
| ADP-01 | US-008 | AC-008-5 |  |  | À faire |
| ADP-01 | US-054 | AC-054-4 |  |  | À faire |
| ADP-02 | US-003 | AC-003-4 |  |  | À faire |
| ADP-02 | US-004 | AC-004-3 |  |  | À faire |
| ADP-02 | US-008 | AC-008-1 |  |  | À faire |
| ADP-02 | US-008 | AC-008-2 |  |  | À faire |
| ADP-02 | US-008 | AC-008-4 |  |  | À faire |
| ADP-02 | US-009 | AC-009-1 |  |  | À faire |
| ADP-02 | US-009 | AC-009-2 |  |  | À faire |
| ADP-02 | US-009 | AC-009-5 |  |  | À faire |
| ADP-02 | US-010 | AC-010-3 |  |  | À faire |
| ADP-02 | US-010 | AC-010-4 |  |  | À faire |
| ADP-02 | US-014 | AC-014-5 |  |  | À faire |
| ADP-03 | US-055 | AC-055-1 |  |  | À faire |
| ADP-03 | US-055 | AC-055-2 |  |  | À faire |
| ADP-03 | US-055 | AC-055-4 |  |  | À faire |
| ADP-05 | US-014 | AC-014-4 |  |  | À faire |
| ADP-05 | US-016 | AC-016-4 |  |  | À faire |
| ADP-05 | US-039 | AC-039-1 |  |  | À faire |
| ADP-05 | US-039 | AC-039-3 |  |  | À faire |
| ADP-06 | US-054 | AC-054-1 |  |  | À faire |
| ADP-06 | US-054 | AC-054-2 |  |  | À faire |
| ADP-06 | US-054 | AC-054-3 |  |  | À faire |
| RUN-01 | US-020 | AC-020-1 |  |  | À faire |
| RUN-01 | US-020 | AC-020-4 |  |  | À faire |
| RUN-01 | US-020 | AC-020-5 |  |  | À faire |
| RUN-01 | US-020 | AC-020-6 |  |  | À faire |
| RUN-02 | US-021 | AC-021-1 |  |  | À faire |
| RUN-02 | US-021 | AC-021-2 |  |  | À faire |
| RUN-02 | US-021 | AC-021-3 |  |  | À faire |
| RUN-02 | US-021 | AC-021-4 |  |  | À faire |
| RUN-02 | US-021 | AC-021-5 |  |  | À faire |
| RUN-03 | US-019 | AC-019-1 |  |  | À faire |
| RUN-03 | US-019 | AC-019-2 |  |  | À faire |
| RUN-03 | US-019 | AC-019-3 |  |  | À faire |
| RUN-03 | US-019 | AC-019-4 |  |  | À faire |
| RUN-03 | US-019 | AC-019-5 |  |  | À faire |
| RUN-04 | US-023 | AC-023-1 |  |  | À faire |
| RUN-04 | US-023 | AC-023-2 |  |  | À faire |
| RUN-04 | US-023 | AC-023-3 |  |  | À faire |
| RUN-04 | US-023 | AC-023-4 |  |  | À faire |
| RUN-04 | US-023 | AC-023-5 |  |  | À faire |
| RUN-04 | US-024 | AC-024-1 |  |  | À faire |
| RUN-04 | US-024 | AC-024-2 |  |  | À faire |
| RUN-04 | US-024 | AC-024-3 |  |  | À faire |
| RUN-04 | US-024 | AC-024-4 |  |  | À faire |
| RUN-05 | US-025 | AC-025-1 |  |  | À faire |
| RUN-05 | US-025 | AC-025-2 |  |  | À faire |
| RUN-05 | US-025 | AC-025-3 |  |  | À faire |
| RUN-05 | US-025 | AC-025-4 |  |  | À faire |
| RUN-05 | US-025 | AC-025-5 |  |  | À faire |
| RUN-05 | US-025 | AC-025-6 |  |  | À faire |
| RUN-05 | US-026 | AC-026-1 |  |  | À faire |
| RUN-05 | US-026 | AC-026-2 |  |  | À faire |
| RUN-05 | US-026 | AC-026-3 |  |  | À faire |
| RUN-05 | US-026 | AC-026-4 |  |  | À faire |
| RUN-05 | US-027 | AC-027-1 |  |  | À faire |
| RUN-05 | US-027 | AC-027-2 |  |  | À faire |
| RUN-05 | US-027 | AC-027-3 |  |  | À faire |
| RUN-05 | US-027 | AC-027-4 |  |  | À faire |
| RUN-05 | US-027 | AC-027-5 |  |  | À faire |
| RUN-05 | US-028 | AC-028-1 |  |  | À faire |
| RUN-05 | US-028 | AC-028-2 |  |  | À faire |
| RUN-05 | US-028 | AC-028-3 |  |  | À faire |
| RUN-05 | US-028 | AC-028-4 |  |  | À faire |
| RUN-06 | US-029 | AC-029-1 |  |  | À faire |
| RUN-06 | US-029 | AC-029-2 |  |  | À faire |
| RUN-06 | US-029 | AC-029-3 |  |  | À faire |
| RUN-06 | US-029 | AC-029-4 |  |  | À faire |
| RUN-06 | US-029 | AC-029-5 |  |  | À faire |
| RUN-06 | US-029 | AC-029-6 |  |  | À faire |
| RUN-07 | US-030 | AC-030-1 |  |  | À faire |
| RUN-07 | US-030 | AC-030-2 |  |  | À faire |
| RUN-07 | US-030 | AC-030-3 |  |  | À faire |
| RUN-07 | US-030 | AC-030-4 |  |  | À faire |
| RUN-08 | US-022 | AC-022-1 |  |  | À faire |
| RUN-08 | US-022 | AC-022-2 |  |  | À faire |
| RUN-08 | US-022 | AC-022-3 |  |  | À faire |
| RUN-08 | US-022 | AC-022-4 |  |  | À faire |
| RUN-09 | US-053 | AC-053-1 |  |  | À faire |
| RUN-09 | US-053 | AC-053-2 |  |  | À faire |
| RUN-09 | US-053 | AC-053-3 |  |  | À faire |
| RUN-09 | US-053 | AC-053-4 |  |  | À faire |
| CLI-01 | US-017 | AC-017-1 |  |  | À faire |
| CLI-01 | US-017 | AC-017-2 |  |  | À faire |
| CLI-01 | US-017 | AC-017-4 |  |  | À faire |
| CLI-02 | US-018 | AC-018-1 |  |  | À faire |
| CLI-02 | US-018 | AC-018-2 |  |  | À faire |
| CLI-02 | US-018 | AC-018-3 |  |  | À faire |
| CLI-02 | US-018 | AC-018-4 |  |  | À faire |
| CLI-03 | US-017 | AC-017-3 |  |  | À faire |
| VAL-01 | US-041 | AC-041-1 |  |  | À faire |
| VAL-01 | US-041 | AC-041-2 |  |  | À faire |
| VAL-01 | US-041 | AC-041-3 |  |  | À faire |
| VAL-01 | US-041 | AC-041-4 |  |  | À faire |
| VAL-02 | US-042 | AC-042-1 |  |  | À faire |
| VAL-02 | US-042 | AC-042-2 |  |  | À faire |
| VAL-02 | US-042 | AC-042-3 |  |  | À faire |
| VAL-02 | US-042 | AC-042-4 |  |  | À faire |
| VAL-03 | US-043 | AC-043-1 |  |  | À faire |
| VAL-03 | US-043 | AC-043-2 |  |  | À faire |
| VAL-03 | US-043 | AC-043-3 |  |  | À faire |
| VAL-04 | US-044 | AC-044-1 |  |  | À faire |
| VAL-04 | US-044 | AC-044-2 |  |  | À faire |
| VAL-04 | US-044 | AC-044-3 |  |  | À faire |
| GIT-01 | US-049 | AC-049-1 |  |  | À faire |
| GIT-01 | US-049 | AC-049-2 |  |  | À faire |
| GIT-01 | US-049 | AC-049-3 |  |  | À faire |
| GIT-01 | US-049 | AC-049-4 |  |  | À faire |
| ACC-01 | US-001 | AC-001-6 |  |  | À faire |
| ACC-03 | US-050 | AC-050-1 |  |  | À faire |
| ACC-03 | US-050 | AC-050-3 |  |  | À faire |
| ACC-03 | US-050 | AC-050-4 |  |  | À faire |
| ACC-04 | US-060 | AC-060-1 |  |  | À faire |
| ACC-04 | US-060 | AC-060-2 |  |  | À faire |
| ACC-04 | US-060 | AC-060-3 |  |  | À faire |
| ACC-04 | US-060 | AC-060-5 |  |  | À faire |
| NF-05 | US-005 | AC-005-7 |  |  | À faire |
| NF-05 | US-009 | AC-009-6 |  |  | À faire |
| NF-05 | US-019 | AC-019-6 |  |  | À faire |
| NF-05 | US-026 | AC-026-5 |  |  | À faire |
| NF-05 | US-027 | AC-027-6 |  |  | À faire |
| NF-05 | US-047 | AC-047-6 |  |  | À faire |
| NF-05 | US-052 | AC-052-3 |  |  | À faire |
| NF-06 | US-017 | AC-017-5 |  |  | À faire |
| NF-07 | US-020 | AC-020-3 |  |  | À faire |
| NF-09 | US-052 | AC-052-1 |  |  | À faire |
| NF-09 | US-052 | AC-052-2 |  |  | À faire |
| NF-09 | US-052 | AC-052-4 |  |  | À faire |
| NF-10 | US-020 | AC-020-2 |  |  | À faire |
| NF-11 | US-014 | AC-014-2 |  |  | À faire |
| NF-11 | US-014 | AC-014-3 |  |  | À faire |
| NF-11 | US-016 | AC-016-2 |  |  | À faire |
| NF-11 | US-016 | AC-016-3 |  |  | À faire |
| NF-11 | US-039 | AC-039-2 |  |  | À faire |
| NF-12 | US-005 | AC-005-3 |  |  | À faire |
| NF-12 | US-005 | AC-005-4 |  |  | À faire |
| NF-12 | US-005 | AC-005-6 |  |  | À faire |
| NF-12 | US-008 | AC-008-3 |  |  | À faire |
| NF-12 | US-009 | AC-009-4 |  |  | À faire |
| NF-13 | US-005 | AC-005-5 |  |  | À faire |
| NF-13 | US-051 | AC-051-1 |  |  | À faire |
| NF-13 | US-051 | AC-051-2 |  |  | À faire |
| NF-13 | US-051 | AC-051-3 |  |  | À faire |
| NF-14 | US-060 | AC-060-4 |  |  | À faire |
| NF-15 | US-044 | AC-044-4 |  |  | À faire |
| NF-16 | US-039 | AC-039-4 |  |  | À faire |
| NF-17 | US-050 | AC-050-2 |  |  | À faire |
| NF-19 | US-008 | AC-008-6 |  |  | À faire |
| NF-19 | US-055 | AC-055-3 |  |  | À faire |
| §7.4 | US-005 | AC-005-1 |  |  | À faire |
| §7.4 | US-005 | AC-005-2 (modifié le 2026-10-01, ADR-001) |  |  | À faire |
| §7.4 | US-006 | AC-006-1 |  |  | À faire |
| §7.4 | US-006 | AC-006-2 |  |  | À faire |
| §7.4 | US-006 | AC-006-3 |  |  | À faire |
| §7.4 | US-006 | AC-006-5 |  |  | À faire |

## Spikes

| Exigence | Spike | Livrable | Statut |
| --- | --- | --- | --- |
| §7.4, PRJ-02, NF-12 | SP-01 | [ADR-001 — Format .cadre/ v1](ADR-001-format-cadre-v1) + schémas | Done (2026-10-01) |
| AGT-06, AGT-07, ADP-05, NF-06, NF-11, §13.2 | SP-02 | ADR capacités de l'adaptateur Claude Code | À faire |
| NF-04, NF-01, NF-02, NF-03 | SP-03 | ADR référence de performance | À faire |
| SKL-05 | SP-04 | ADR règles de validation des skills (confirme aussi les règles de skills d'ADR-001) | À faire |
| RUN-01, RUN-02, RUN-06, RUN-07 | SP-05 | ADR exécution et arrêt des processus | À faire |
| RUN-03, RUN-04, RUN-05 | SP-06 | ADR cycle de vie d'une exécution dans un worktree | À faire |
| PRJ-07, PRJ-08 | SP-07 | ADR surveillance du dossier | À faire |

## Exigences des étapes ultérieures (non détaillées)

| Exigence | Story | Étape | Statut |
| --- | --- | --- | --- |
| ADP-04 | US-061, US-062 | MVP 2 | À affiner |
| ADP-05 (vue multi-outils, §4.3) | US-063 | MVP 2 | À affiner |
| SKL-06 | US-064 | MVP 2 | À affiner |
| AGT-09 | US-065 | MVP 2 | À affiner |
| PRJ-03 | US-066 | MVP 2 | À affiner |
| GIT-02 | US-067 | MVP 2 | À affiner |
| ACC-02, NF-08 | US-068 | V1 | À affiner |
| ACC-05 | US-069 | V1 | À affiner |
| NF-05 (Linux) | US-070 | V1 | À affiner |
| §4.4 documentation | US-071 | V1 | À affiner |
| SKL-07 | US-072 | Future | À affiner |
| AGT-10 | US-073 | Future | À affiner |
| VAL-05 | US-074 | Future | À affiner |
| RUN-10 | US-075 | Future | À affiner |
| GIT-03 | — | Hors périmètre | — |
