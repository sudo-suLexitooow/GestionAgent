# Traçabilité — Exigence → Story → Critère → Test → PR

Version : 2026-10-01 (US-001, US-002, US-003, US-005 Done ; US-076, US-077 ajoutées ; AC-006-6 et AC-077-4 ajoutés en Sprint Review 1) · Source : [Backlog](Backlog) · **Statut du backlog : validé par le PO le 2026-10-01 (porte 1)**

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
| PRJ-01 | US-001 | AC-001-1 | `commande_inspect_folder.rs::test_ac_001_1_commande_inspect_folder_renvoie_ok_pour_un_dossier`<br>`inspect_folder.rs::test_ac_001_1_dossier_existant_et_lisible_est_ok`<br>`open-project.test.ts::test_ac_001_1_ouvre_le_dossier_choisi_dans_le_selecteur`<br>`open-project.test.ts::test_ac_001_1_nom_du_projet_pour_%s_est_%s`<br>`tauri-project-ports.test.ts::test_ac_001_1_ouvre_le_selecteur_en_mode_dossier_unique`<br>`OpenProject.test.tsx::test_ac_001_1_le_dossier_choisi_ouvre_l_ecran_principal_avec_nom_et_chemin` | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) | Done |
| PRJ-01 | US-001 | AC-001-2 | `drop.test.ts::test_ac_001_2_un_seul_element_depose_est_candidat_a_l_ouverture`<br>`open-project.test.ts::test_ac_001_2_ouvre_le_dossier_depose_comme_avec_le_selecteur`<br>`tauri-project-ports.test.ts::test_ac_001_2_hors_de_tauri_le_depot_est_inactif_sans_erreur`<br>`tauri-project-ports.test.ts::test_ac_001_2_relaie_les_chemins_deposes_et_ignore_le_survol`<br>`tauri-project-ports.test.ts::test_ac_001_2_le_desabonnement_arrete_la_reception`<br>`OpenProject.test.tsx::test_ac_001_2_deposer_un_dossier_ouvre_le_projet_comme_le_selecteur`<br>`OpenProject.test.tsx::test_ac_001_2_la_zone_de_depot_est_indiquee_sur_l_accueil` | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) | Done |
| PRJ-01 | US-001 | AC-001-3 | `commande_inspect_folder.rs::test_ac_001_3_commande_inspect_folder_signale_un_fichier`<br>`inspect_folder.rs::test_ac_001_3_fichier_n_est_pas_un_dossier`<br>`drop.test.ts::test_ac_001_3_plusieurs_elements_deposes_sont_refuses`<br>`drop.test.ts::test_ac_001_3_depot_sans_aucun_element_est_refuse`<br>`open-project.test.ts::test_ac_001_3_fichier_depose_est_refuse_avec_un_seul_dossier_attendu`<br>`open-project.test.ts::test_ac_001_3_plusieurs_dossiers_deposes_sont_refuses_sans_rien_ouvrir`<br>`OpenProject.test.tsx::test_ac_001_3_deposer_%s_n_ouvre_rien_et_demande_un_seul_dossier` | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) | Done |
| PRJ-01 | US-001 | AC-001-4 | `folder.rs::test_ac_001_4_acces_refuse_signifie_illisible`<br>`folder.rs::test_ac_001_4_chemin_absent_signifie_inexistant`<br>`commande_inspect_folder.rs::test_ac_001_4_commande_inspect_folder_signale_un_dossier_inexistant`<br>`inspect_folder.rs::test_ac_001_4_dossier_inexistant`<br>`inspect_folder.rs::test_ac_001_4_dossier_illisible`<br>`open-project.test.ts::test_ac_001_4_dossier_depose_illisible_produit_une_erreur`<br>`open-project.test.ts::test_ac_001_4_echec_systeme_pendant_un_depot_produit_une_erreur`<br>`open-project.test.ts::test_ac_001_4_dossier_%s_produit_une_erreur_sans_ouvrir`<br>`open-project.test.ts::test_ac_001_4_echec_systeme_pendant_la_verification_produit_une_erreur`<br>`open-project.test.ts::test_ac_001_4_echec_systeme_du_selecteur_produit_une_erreur`<br>`tauri-project-ports.test.ts::test_ac_001_4_transmet_le_chemin_a_inspect_folder_et_relaie_son_verdict`<br>`OpenProject.test.tsx::test_ac_001_4_dossier_%s_affiche_un_message_clair_et_reste_sur_l_accueil`<br>`OpenProject.test.tsx::test_ac_001_4_echec_systeme_affiche_un_message_sans_planter` | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) | Done |
| PRJ-01 | US-001 | AC-001-5 | `open-project.test.ts::test_ac_001_5_annulation_du_selecteur_ne_produit_ni_projet_ni_erreur`<br>`tauri-project-ports.test.ts::test_ac_001_5_annulation_du_selecteur_renvoie_null`<br>`OpenProject.test.tsx::test_ac_001_5_annuler_le_selecteur_reste_sur_l_accueil_sans_message` | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) | Done |
| PRJ-02 | US-002 | AC-002-5 | `list-project-skills.test.ts::test_ac_002_5_avec_un_modele_cadre_la_liste_affiche_les_skills_du_modele_seulement`<br>`list-project-skills.test.ts::test_ac_002_5_un_fichier_cadre_n_est_pas_un_modele_et_l_adaptateur_est_utilise`<br>`list-project-skills.test.ts::test_ac_002_5_modele_cadre_sans_skills_donne_une_liste_vide`<br>`ProjectSkills.test.tsx::test_ac_002_5_avec_un_modele_cadre_affiche_les_skills_du_modele` | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) | Done |
| PRJ-02 | US-003 | AC-003-1 | `project_files.rs::test_ac_003_1_un_chemin_vide_liste_la_racine_et_ses_fichiers_de_contexte`<br>`import-contexts.test.ts::test_ac_003_1_detecte_claude_md_a_la_racine_d_un_projet_sans_cadre`<br>`import-contexts.test.ts::test_ac_003_1_detecte_claude_md_puis_agents_md_en_lecture_seule`<br>`import-contexts.test.ts::test_ac_003_1_rien_n_est_propose_si_le_projet_a_deja_un_dossier_cadre`<br>`import-contexts.test.ts::test_ac_003_1_un_dossier_claude_md_ou_un_fichier_hors_racine_n_est_pas_detecte`<br>`ContextImport.test.tsx::test_ac_003_1_propose_l_import_en_listant_les_fichiers_detectes`<br>`ContextImport.test.tsx::test_ac_003_1_aucune_proposition_quand_%s`<br>`ContextImport.test.tsx::test_ac_003_1_une_racine_illisible_ne_propose_rien_et_ne_plante_pas` | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) | Done |
| PRJ-02 | US-003 | AC-003-2 | `import-contexts.test.ts::test_ac_003_2_un_contexte_par_fichier_au_contenu_identique_octet_pour_octet`<br>`import-contexts.test.ts::test_ac_003_2_metadonnees_et_chemins_des_contextes_suivent_adr_001`<br>`import-contexts.test.ts::test_ac_003_2_importe_les_octets_lus_dans_le_projet_sans_conversion`<br>`ContextImport.test.tsx::test_ac_003_2_accepter_affiche_un_contexte_par_fichier_non_enregistre` | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) | Done |
| PRJ-02 | US-003 | AC-003-3 | `ContextImport.test.tsx::test_ac_003_3_refuser_ne_fait_que_lire_et_ne_repropose_pas_l_import` | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) | Done |
| PRJ-02 | US-003 | AC-003-5 | `import-contexts.test.ts::test_ac_003_5_les_fichiers_d_origine_restent_inchanges_et_ne_sont_que_lus`<br>`recording-project-files.test.ts::test_ac_003_5_note_les_lectures_et_tout_acces_a_un_membre_d_ecriture_absent`<br>`ContextImport.test.tsx::test_ac_003_5_apres_import_les_fichiers_d_origine_sont_inchanges_et_seulement_lus` | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) | Done |
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
| SKL-01 | US-002 | AC-002-1 | `commande_project_files.rs::test_ac_002_1_commande_list_project_dir_renvoie_les_entrees`<br>`commande_project_files.rs::test_ac_002_1_commande_read_project_file_renvoie_les_octets`<br>`commande_project_files.rs::test_ac_002_1_commandes_de_lecture_refusent_un_chemin_hors_du_projet`<br>`project_files.rs::test_ac_002_1_liste_les_entrees_d_un_dossier_du_projet_avec_leur_nature`<br>`project_files.rs::test_ac_002_1_la_lecture_refuse_tout_chemin_qui_sort_du_projet`<br>`project_files.rs::test_ac_002_1_lit_un_fichier_du_projet_a_l_octet_pres`<br>`project_files.rs::test_ac_002_1_un_lien_vers_un_fichier_du_projet_est_lu`<br>`project_files.rs::test_ac_002_1_un_lien_vers_un_dossier_est_liste_comme_dossier_et_un_lien_casse_comme_autre`<br>`project_files.rs::test_ac_002_1_la_lecture_refuse_les_prefixes_et_racines_windows`<br>`claude-code-adapter.test.ts::test_ac_002_1_liste_les_skills_a_et_b_avec_nom_et_description`<br>`list-project-skills.test.ts::test_ac_002_1_sans_modele_cadre_les_skills_viennent_de_l_adaptateur`<br>`skill-header.test.ts::test_ac_002_1_lit_le_nom_et_la_description`<br>`skill-header.test.ts::test_ac_002_1_accepte_les_fins_de_ligne_crlf`<br>`skill-header.test.ts::test_ac_002_1_conserve_les_champs_connus_et_ignore_les_autres`<br>`tauri-project-ports.test.ts::test_ac_002_1_liste_un_dossier_par_list_project_dir`<br>`tauri-project-ports.test.ts::test_ac_002_1_lit_un_fichier_en_octets_par_read_project_file`<br>`ProjectSkills.test.tsx::test_ac_002_1_affiche_les_skills_a_et_b_avec_nom_et_description` | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) | Done |
| SKL-01 | US-002 | AC-002-2 | `commande_project_files.rs::test_ac_002_2_commande_list_project_dir_renvoie_null_pour_un_dossier_absent`<br>`project_files.rs::test_ac_002_2_dossier_absent_donne_none_sans_erreur`<br>`project_files.rs::test_ac_002_2_un_fichier_a_la_place_du_dossier_donne_none_sans_erreur`<br>`claude-code-adapter.test.ts::test_ac_002_2_sans_dossier_claude_skills_la_liste_est_vide_sans_erreur`<br>`claude-code-adapter.test.ts::test_ac_002_2_un_fichier_claude_skills_donne_une_liste_vide_sans_erreur`<br>`tauri-project-ports.test.ts::test_ac_002_2_dossier_absent_relaye_null`<br>`ProjectSkills.test.tsx::test_ac_002_2_sans_skills_indique_aucune_skill_detectee_sans_erreur`<br>`ProjectSkills.test.tsx::test_ac_002_2_un_fichier_claude_skills_indique_aucune_skill_detectee_sans_erreur` | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) | Done |
| SKL-01 | US-002 | AC-002-3 | `commande_project_files.rs::test_ac_002_3_commande_read_project_file_signale_un_fichier_trop_gros`<br>`project_files.rs::test_ac_002_3_un_fichier_au_plafond_de_taille_est_lu`<br>`project_files.rs::test_ac_002_3_un_fichier_au_dela_du_plafond_de_taille_est_refuse`<br>`project_files.rs::test_ac_002_3_un_dossier_n_est_pas_lu_comme_un_fichier`<br>`project_files.rs::test_ac_002_3_un_lien_vers_dev_zero_est_refuse_sans_bloquer`<br>`project_files.rs::test_ac_002_3_une_fifo_est_refusee_sans_bloquer`<br>`claude-code-adapter.test.ts::test_ac_002_3_une_skill_a_l_en_tete_invalide_est_en_erreur_et_les_autres_sont_listees`<br>`claude-code-adapter.test.ts::test_ac_002_3_un_skill_md_non_utf8_est_en_erreur_d_encodage`<br>`claude-code-adapter.test.ts::test_ac_002_3_un_skill_md_illisible_est_en_erreur_et_les_autres_sont_listees`<br>`claude-code-adapter.test.ts::test_ac_002_3_un_skill_md_trop_gros_est_en_erreur_avec_cette_raison`<br>`skill-header.test.ts::test_ac_002_3_%s`<br>`tauri-project-ports.test.ts::test_ac_002_3_%s_rejette_avec_le_motif_de_la_commande`<br>`tauri-project-ports.test.ts::test_ac_002_3_un_echec_inattendu_de_l_ipc_rejette_comme_illisible`<br>`ProjectSkills.test.tsx::test_ac_002_3_une_skill_invalide_est_marquee_en_erreur_avec_la_raison`<br>`ProjectSkills.test.tsx::test_ac_002_3_un_skill_md_trop_gros_est_en_erreur_avec_un_message_clair`<br>`ProjectSkills.test.tsx::test_ac_002_3_un_echec_de_lecture_des_skills_affiche_un_message_sans_planter` | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) | Done |
| SKL-01 | US-002 | AC-002-4 | `commande_project_files.rs::test_ac_002_4_commande_read_project_file_renvoie_null_pour_un_fichier_absent`<br>`project_files.rs::test_ac_002_4_fichier_absent_donne_none_sans_erreur`<br>`claude-code-adapter.test.ts::test_ac_002_4_un_sous_dossier_sans_skill_md_ou_un_fichier_isole_n_est_pas_une_skill`<br>`tauri-project-ports.test.ts::test_ac_002_4_fichier_absent_relaye_null` | [#5](https://github.com/sudo-suLexitooow/GestionAgent/pull/5) | Done |
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
| ADP-02 | US-003 | AC-003-4 | `import-contexts.test.ts::test_ac_003_4_un_claude_md_non_utf8_donne_un_avertissement_d_encodage_et_garde_ses_octets`<br>`import-contexts.test.ts::test_ac_003_4_un_claude_md_vide_donne_un_contexte_vide_sans_avertissement`<br>`import-contexts.test.ts::test_ac_003_4_un_fichier_illisible_ou_trop_gros_donne_un_avertissement_sans_planter`<br>`ContextImport.test.tsx::test_ac_003_4_un_claude_md_non_utf8_affiche_encodage_non_supporte_sans_planter`<br>`ContextImport.test.tsx::test_ac_003_4_un_claude_md_vide_donne_un_contexte_vide_sans_avertissement` | [#6](https://github.com/sudo-suLexitooow/GestionAgent/pull/6) | Done |
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
| ACC-01 | US-001 | AC-001-6 | `OpenProject.test.tsx::test_ac_001_6_ouvrir_un_dossier_ne_fait_aucun_appel_reseau_ni_ne_demande_de_compte` | [#3](https://github.com/sudo-suLexitooow/GestionAgent/pull/3) | Done |
| ACC-03 | US-050 | AC-050-1 |  |  | À faire |
| ACC-03 | US-050 | AC-050-3 |  |  | À faire |
| ACC-03 | US-050 | AC-050-4 |  |  | À faire |
| ACC-04 | US-060 | AC-060-1 |  |  | À faire |
| ACC-04 | US-060 | AC-060-2 |  |  | À faire |
| ACC-04 | US-060 | AC-060-3 |  |  | À faire |
| ACC-04 | US-060 | AC-060-5 |  |  | À faire |
| NF-05 | US-005 | AC-005-7 | Job CI « Rust » en matrice `ubuntu-22.04`, `windows-latest`, `macos-latest` (`.github/workflows/ci.yml`) : tous les tests AC-005-3 à AC-005-6 ci-dessus y passent ; tests propres à chaque OS : `ecriture_atomique.rs::test_ac_005_6_quota_depasse_linux`<br>`ecriture_atomique.rs::test_ac_005_6_quota_depasse_macos`<br>`ecriture_atomique.rs::test_ac_005_6_quota_depasse_windows` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
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
| NF-12 | US-005 | AC-005-3 | `commandes.rs::test_ac_005_3_commande_ecrit_tous_les_fichiers`<br>`commandes_projet.rs::test_ac_005_3_ecriture_dans_le_projet_ouvert_et_refus_ailleurs`<br>`ecriture_atomique.rs::test_ac_005_3_erreur_apres_le_premier_fichier_aucun_fichier_modifie`<br>`ecriture_atomique.rs::test_ac_005_3_erreur_apres_le_deuxieme_fichier_aucun_fichier_modifie`<br>`ecriture_atomique.rs::test_ac_005_3_erreur_apres_le_dernier_fichier_le_fichier_cree_est_retire`<br>`ecriture_atomique.rs::test_ac_005_3_arret_apres_le_premier_fichier_annule_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_3_arret_apres_le_dernier_fichier_annule_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_3_fichier_modifie_par_l_utilisateur_apres_l_arret_n_est_pas_ecrase`<br>`ecriture_atomique.rs::test_ac_005_3_recuperation_arretee_deux_fois_puis_reprise`<br>`ecriture_atomique.rs::test_ac_005_3_erreur_pendant_l_annulation_code_dedie_journal_conserve_puis_reprise`<br>`ecriture_atomique.rs::test_ac_005_3_fichier_supprime_par_l_utilisateur_apres_l_arret_reste_supprime`<br>`ecriture_atomique.rs::test_ac_005_3_fichier_cree_puis_modifie_par_l_utilisateur_est_conserve`<br>`ecriture_atomique.rs::test_ac_005_3_arret_avant_le_renommage_du_journal_valide_annule_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_3_seconde_instance_refusee_pendant_un_enregistrement`<br>`ecriture_atomique.rs::test_ac_005_3_verrou_libere_apres_un_arret_brutal`<br>`ecriture_atomique.rs::test_ac_005_3_echec_dans_un_projet_sans_cadre_seul_residu_le_verrou_vide`<br>`ecriture_atomique.rs::test_ac_005_3_arret_brutal_puis_recuperation_retire_les_dossiers_crees`<br>`ecriture_atomique.rs::test_ac_005_3_recuperation_ne_supprime_jamais_le_verrou`<br>`ecriture_atomique.rs::test_ac_005_3_tous_les_fichiers_sont_ecrits_et_aucun_temporaire_ne_reste`<br>`systeme-fichiers-tauri.test.ts::test_ac_005_3_ecriture_transmise_en_une_seule_commande` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| NF-12 | US-005 | AC-005-4 | `commandes.rs::test_ac_005_4_ouvrir_le_projet_supprime_les_temporaires_orphelins`<br>`ecriture_atomique.rs::test_ac_005_4_arret_avant_remplacement_original_intact_puis_temporaires_supprimes`<br>`ecriture_atomique.rs::test_ac_005_4_arret_pendant_l_ecriture_des_temporaires`<br>`ecriture_atomique.rs::test_ac_005_4_temporaires_orphelins_supprimes_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_4_recuperation_sans_dossier_cadre_ne_fait_rien`<br>`ecriture_atomique.rs::test_ac_005_4_prochain_enregistrement_recupere_d_abord_la_transaction_interrompue`<br>`ecriture_atomique.rs::test_ac_005_4_erreur_avant_remplacement_original_intact_sans_temporaire`<br>`ecriture_atomique.rs::test_ac_005_4_erreur_pendant_l_ecriture_des_temporaires_sans_temporaire`<br>`ecriture_atomique.rs::test_ac_005_4_cadre_tmp_en_lien_refuse_rien_hors_du_projet_n_est_touche`<br>`ecriture_atomique.rs::test_ac_005_4_cadre_en_lien_refuse_rien_hors_du_projet_n_est_touche`<br>`ecriture_atomique.rs::test_ac_005_4_liens_dans_cadre_tmp_jamais_suivis`<br>`ecriture_atomique.rs::test_ac_005_4_journal_en_cours_avec_chemin_absolu_ne_supprime_rien_hors_du_projet`<br>`ecriture_atomique.rs::test_ac_005_4_journal_en_cours_avec_chemin_remontant_ne_supprime_rien`<br>`ecriture_atomique.rs::test_ac_005_4_journal_illisible_mis_de_cote_sans_rien_supprimer`<br>`ecriture_atomique.rs::test_ac_005_4_journal_dont_un_parent_est_un_lien_ne_supprime_rien_hors_du_projet`<br>`ecriture_atomique.rs::test_ac_005_4_copie_ancienne_disparue_apres_validation_ecriture_suivante_possible`<br>`ecriture_atomique.rs::test_ac_005_4_arret_apres_suppression_du_journal_nettoye_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_4_journal_qui_est_un_dossier_mis_de_cote`<br>`ecriture_atomique.rs::test_ac_005_4_mise_de_cote_choisit_un_nom_libre`<br>`ecriture_atomique.rs::test_ac_005_4_cible_devenue_dossier_transaction_mise_de_cote`<br>`ecriture_atomique.rs::test_ac_005_4_copie_d_origine_manquante_transaction_mise_de_cote`<br>`ecriture_atomique.rs::test_ac_005_4_erreur_passagere_pendant_la_reprise_journal_conserve_puis_reprise`<br>`ecriture_atomique.rs::test_ac_005_4_mise_de_cote_dit_que_le_projet_peut_etre_partiellement_modifie`<br>`ecriture_atomique.rs::test_ac_005_4_journal_de_plus_d_un_mio_mis_de_cote`<br>`lecture_et_ouverture.rs::test_ac_005_4_transaction_mise_de_cote_ignoree_a_l_ouverture_en_lecture_seule`<br>`lecture_et_ouverture.rs::test_ac_005_4_reprise_impossible_en_lecture_seule_le_projet_s_ouvre_avec_un_avertissement`<br>`open-project.test.ts::test_ac_005_4_ouvrir_un_projet_le_prepare_cote_systeme`<br>`open-project.test.ts::test_ac_005_4_dossier_invalide_n_est_pas_prepare`<br>`open-project.test.ts::test_ac_005_4_echec_de_preparation_produit_une_erreur_dediee`<br>`open-project.test.ts::test_ac_005_4_echec_de_ouvrir_projet_transmet_code_et_detail`<br>`open-project.test.ts::test_ac_005_4_reprise_impossible_le_projet_s_ouvre_avec_un_avertissement`<br>`tauri-project-ports.test.ts::test_ac_005_4_transmet_le_chemin_a_ouvrir_projet`<br>`tauri-project-ports.test.ts::test_ac_005_4_relaie_l_avertissement_de_reprise`<br>`OpenProject.test.tsx::test_ac_005_4_avertissement_%s_affiche_au_dessus_du_projet_ouvert` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| NF-12 | US-005 | AC-005-6 | `commandes.rs::test_ac_005_6_codes_d_erreur_stables_pour_l_interface`<br>`commandes.rs::test_ac_005_6_commande_renvoie_un_code_d_erreur`<br>`ecriture_atomique.rs::test_ac_005_6_disque_plein_simule_erreur_claire_et_fichiers_inchanges`<br>`ecriture_atomique.rs::test_ac_005_6_disque_plein_pendant_le_remplacement_fichiers_inchanges`<br>`ecriture_atomique.rs::test_ac_005_6_volume_en_lecture_seule_simule_erreur_claire_et_fichiers_inchanges`<br>`ecriture_atomique.rs::test_ac_005_6_dossier_reellement_en_lecture_seule_erreur_claire_et_fichiers_inchanges`<br>`ecriture_atomique.rs::test_ac_005_6_fichier_reellement_en_lecture_seule_erreur_claire_et_fichiers_inchanges`<br>`ecriture_atomique.rs::test_ac_005_6_quota_depasse_linux`<br>`ecriture_atomique.rs::test_ac_005_6_quota_depasse_macos`<br>`ecriture_atomique.rs::test_ac_005_6_quota_depasse_windows`<br>`enregistrer.test.ts::test_ac_005_6_lecture_seule_message_clair_et_fichiers_inchanges`<br>`enregistrer.test.ts::test_ac_005_6_disque_plein_message_clair`<br>`enregistrer.test.ts::test_ac_005_6_chaque_code_d_erreur_a_un_message_utilisateur`<br>`enregistrer.test.ts::test_ac_005_6_echec_de_lecture_du_gitignore_message_clair_rien_ecrit`<br>`enregistrer.test.ts::test_ac_005_6_erreur_inattendue_message_generique`<br>`enregistrer.test.ts::test_ac_005_6_projet_occupe_par_une_autre_fenetre_message_clair`<br>`enregistrer.test.ts::test_ac_005_6_annulation_incomplete_message_honnete`<br>`enregistrer.test.ts::test_ac_005_6_recuperation_impossible_indique_le_dossier_a_examiner`<br>`systeme-fichiers-tauri.test.ts::test_ac_005_6_erreur_rust_convertie_en_erreur_typee`<br>`systeme-fichiers-tauri.test.ts::test_ac_005_6_codes_de_revue_conserves`<br>`systeme-fichiers-tauri.test.ts::test_ac_005_6_erreur_inconnue_convertie_en_echec` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| NF-12 | US-008 | AC-008-3 |  |  | À faire |
| NF-12 | US-009 | AC-009-4 |  |  | À faire |
| NF-13 | US-005 | AC-005-5 | `ecriture_atomique.rs::test_ac_005_5_version_precedente_conservee_dans_cadre_backups`<br>`ecriture_atomique.rs::test_ac_005_5_index_note_empreintes_precedente_et_ecrite_et_date`<br>`ecriture_atomique.rs::test_ac_005_5_une_seule_version_precedente_la_derniere`<br>`ecriture_atomique.rs::test_ac_005_5_echec_ne_touche_pas_aux_sauvegardes`<br>`ecriture_atomique.rs::test_ac_005_5_arret_apres_validation_sauvegardes_terminees_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_5_erreur_apres_validation_enregistrement_reussi_sauvegardes_au_demarrage`<br>`ecriture_atomique.rs::test_ac_005_5_journal_valide_avec_chemin_remontant_n_ecrit_rien_hors_du_projet`<br>`ecriture_atomique.rs::test_ac_005_5_sauvegarde_impossible_n_empeche_pas_les_ecritures_suivantes`<br>`ecriture_atomique.rs::test_ac_005_5_index_de_plus_d_un_mio_reconstruit` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| NF-13 | US-051 | AC-051-1 |  |  | À faire |
| NF-13 | US-051 | AC-051-2 |  |  | À faire |
| NF-13 | US-051 | AC-051-3 |  |  | À faire |
| NF-14 | US-060 | AC-060-4 |  |  | À faire |
| NF-15 | US-044 | AC-044-4 |  |  | À faire |
| NF-16 | US-039 | AC-039-4 |  |  | À faire |
| NF-17 | US-050 | AC-050-2 |  |  | À faire |
| NF-19 | US-008 | AC-008-6 |  |  | À faire |
| NF-19 | US-055 | AC-055-3 |  |  | À faire |
| §7.4 | US-005 | AC-005-1 | `cadre-yaml.test.ts::test_ac_005_1_nouveau_cadre_contient_versions_et_outils_actifs`<br>`cadre-yaml.test.ts::test_ac_005_1_cadre_yaml_serialise_est_conforme_au_schema_v1`<br>`cadre-yaml.test.ts::test_ac_005_1_cadre_yaml_utf8_sans_bom_lf_indentation_2_ligne_finale`<br>`enregistrer.test.ts::test_ac_005_1_projet_sans_cadre_enregistrer_cree_cadre_yaml_conforme` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| §7.4 | US-005 | AC-005-2 (modifié le 2026-10-01, ADR-001) | `commandes.rs::test_ac_005_2_lecture_d_un_fichier_du_projet`<br>`commandes.rs::test_ac_005_2_projet_dans_un_sous_dossier_d_un_depot_git`<br>`commandes.rs::test_ac_005_2_projet_hors_de_tout_depot_git`<br>`enregistrer.test.ts::test_ac_005_2_projet_git_gitignore_cree_dans_la_meme_transaction`<br>`enregistrer.test.ts::test_ac_005_2_gitignore_existant_complete_sans_toucher_aux_autres_lignes`<br>`enregistrer.test.ts::test_ac_005_2_gitignore_deja_complet_n_est_pas_reecrit`<br>`enregistrer.test.ts::test_ac_005_2_projet_sans_git_aucun_gitignore_cree`<br>`enregistrer.test.ts::test_ac_005_2_projet_dans_un_sous_dossier_d_un_depot_git_gitignore_a_la_racine_du_projet`<br>`gitignore.test.ts::test_ac_005_2_lignes_attendues_runs_backups_tmp`<br>`gitignore.test.ts::test_ac_005_2_gitignore_absent_est_cree_avec_les_trois_lignes`<br>`gitignore.test.ts::test_ac_005_2_lignes_ajoutees_a_la_fin_sans_modifier_les_autres`<br>`gitignore.test.ts::test_ac_005_2_derniere_ligne_sans_fin_de_ligne_reste_intacte`<br>`gitignore.test.ts::test_ac_005_2_fichier_crlf_complete_en_crlf`<br>`gitignore.test.ts::test_ac_005_2_ligne_deja_presente_non_dupliquee`<br>`gitignore.test.ts::test_ac_005_2_toutes_les_lignes_presentes_aucune_ecriture`<br>`gitignore.test.ts::test_ac_005_2_bom_en_premiere_ligne_ligne_reconnue`<br>`systeme-fichiers-tauri.test.ts::test_ac_005_2_detection_d_un_depot_git_transmise`<br>`systeme-fichiers-tauri.test.ts::test_ac_005_2_lecture_transmise` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| §7.4, NF-12 | US-005 | Sécurité fichiers (sans AC dédié, issus des revues de la PR #4) | `commandes.rs::test_securite_aucun_projet_ouvert_toute_commande_refusee`<br>`commandes.rs::test_securite_racine_differente_du_projet_ouvert_refusee`<br>`commandes.rs::test_securite_ouvrir_un_chemin_qui_n_est_pas_un_dossier_est_refuse`<br>`commandes.rs::test_securite_racine_equivalente_acceptee_apres_canonicalisation`<br>`architecture_fichiers.rs::test_securite_decoupage_du_module_de_tests_independant_des_fins_de_ligne`<br>`architecture_fichiers.rs::test_securite_aucun_acces_fichier_hors_de_la_resolution_sure`<br>`commandes_projet.rs::test_securite_ecriture_refusee_tant_qu_aucun_projet_n_est_ouvert`<br>`ecriture_atomique.rs::test_securite_chemin_hors_projet_ou_interne_refuse_et_rien_n_est_ecrit`<br>`ecriture_atomique.rs::test_securite_noms_reserves_windows_casse_et_git_refuses`<br>`ecriture_atomique.rs::test_securite_chemin_en_double_dans_un_lot_refuse`<br>`ecriture_atomique.rs::test_securite_noms_proches_des_noms_reserves_acceptes`<br>`ecriture_atomique.rs::test_securite_ecriture_a_travers_un_dossier_en_lien_refusee`<br>`ecriture_atomique.rs::test_securite_cadre_backups_en_lien_refuse`<br>`ecriture_atomique.rs::test_securite_sauvegarde_ne_suit_pas_un_lien_dans_cadre_backups`<br>`ecriture_atomique.rs::test_securite_noms_courts_windows_refuses`<br>`ecriture_atomique.rs::test_securite_tildes_hors_forme_courte_acceptes`<br>`ecriture_atomique.rs::test_securite_segment_de_plus_de_255_octets_refuse`<br>`ecriture_atomique.rs::test_securite_caracteres_ignores_par_hfs_refuses`<br>`lecture_et_ouverture.rs::test_securite_lecture_a_travers_un_dossier_en_lien_refusee`<br>`lecture_et_ouverture.rs::test_securite_gitignore_en_lien_n_est_ni_lu_ni_recopie`<br>`lecture_et_ouverture.rs::test_securite_lecture_d_un_dossier_ou_d_un_fichier_special_refusee`<br>`lecture_et_ouverture.rs::test_securite_ouverture_refusee_garde_le_projet_precedent`<br>`enregistrer.test.ts::test_securite_gitignore_en_lien_n_est_ni_lu_ni_recopie` | [#4](https://github.com/sudo-suLexitooow/GestionAgent/pull/4) | Done |
| §7.4 | US-006 | AC-006-1 |  |  | À faire |
| §7.4 | US-006 | AC-006-2 |  |  | À faire |
| §7.4 | US-006 | AC-006-3 |  |  | À faire |
| §7.4 | US-006 | AC-006-5 |  |  | À faire |
| §7.4, PRJ-02 | US-006 | AC-006-6 (ajouté le 2026-10-01, Sprint Review 1) |  |  | À faire |
| SKL-01, PRJ-02 (proposées) | US-076 | AC-076-1 |  |  | À faire |
| SKL-01, PRJ-02 (proposées) | US-076 | AC-076-2 |  |  | À faire |
| SKL-01, PRJ-02 (proposées) | US-076 | AC-076-3 |  |  | À faire |
| SKL-01, PRJ-02 (proposées) | US-076 | AC-076-4 |  |  | À faire |
| §7.4, NF-12, PRJ-02 (proposées) | US-077 | AC-077-1 |  |  | À faire |
| §7.4, NF-12, PRJ-02 (proposées) | US-077 | AC-077-2 |  |  | À faire |
| §7.4, NF-12, PRJ-02 (proposées) | US-077 | AC-077-3 |  |  | À faire |
| §7.4, NF-12, PRJ-02 (proposées) | US-077 | AC-077-4 (ajouté le 2026-10-01, Sprint Review 1) |  |  | À faire |

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
