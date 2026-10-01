## US-XXX — Titre
Exigences : XXX-00

### Critères d'acceptation → tests
- AC-XXX-1 → test_ac_xxx_1_... (unitaire), test_ac_xxx_1_... (intégration)
- AC-XXX-2 → ...

### Preuve RED
<extrait de la sortie d'échec de chaque premier test>

### Zone sensible
Oui / Non — si oui, laquelle (relecture humaine requise, porte 3)

### Décisions prises
<choix techniques notables, ou « aucune »>

### Points d'attention pour la revue
<ce dont le développeur n'est pas sûr>

### Definition of Done
- [ ] Chaque critère d'acceptation a au moins un test nommé avec son ID
- [ ] Tous les tests vus en échec (RED) avant le code, preuve ci-dessus
- [ ] Tests verts en local et en CI
- [ ] Couverture du cœur ≥ 70 %
- [ ] Lint et typage sans erreur
- [ ] Revue `relecteur` sans point bloquant
- [ ] Relecture humaine faite si zone sensible
- [ ] Aucune régression connue
- [ ] Wiki à jour
- [ ] Mergé dans la branche principale (après revue)
