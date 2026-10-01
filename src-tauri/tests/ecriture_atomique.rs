//! Tests d'intégration de l'écriture atomique (US-005, zone sensible) sur de vrais dossiers
//! temporaires. Tournent en CI sous Linux, Windows et macOS (AC-005-7).

use cadre_lib::fs_atomique::{
    ecrire_fichiers, ecrire_fichiers_avec, recuperer, Etape, FichierAEcrire, PointsDeControle,
};
use std::fs;
use std::io;
use std::path::Path;
use tempfile::TempDir;

fn projet() -> TempDir {
    tempfile::tempdir().expect("dossier temporaire")
}

fn ecrire(racine: &Path, chemin: &str, contenu: &str) {
    let cible = racine.join(chemin);
    fs::create_dir_all(cible.parent().unwrap()).unwrap();
    fs::write(cible, contenu).unwrap();
}

fn lire(racine: &Path, chemin: &str) -> Option<String> {
    fs::read_to_string(racine.join(chemin)).ok()
}

/// Fichiers restant dans `.cadre/tmp/` (vide ou absent = aucun temporaire résiduel).
fn temporaires(racine: &Path) -> Vec<String> {
    let mut noms = Vec::new();
    let mut a_visiter = vec![racine.join(".cadre/tmp")];
    while let Some(dossier) = a_visiter.pop() {
        let Ok(entrees) = fs::read_dir(&dossier) else {
            continue;
        };
        for entree in entrees {
            let chemin = entree.unwrap().path();
            noms.push(chemin.display().to_string());
            if chemin.is_dir() {
                a_visiter.push(chemin);
            }
        }
    }
    noms
}

/// Panne injectée : l'opération système échoue à l'étape donnée (erreur d'entrée-sortie).
struct ErreurA(Etape);

impl PointsDeControle for ErreurA {
    fn atteint(&self, etape: Etape) -> io::Result<()> {
        if etape == self.0 {
            return Err(io::Error::other(format!("panne simulée à {etape:?}")));
        }
        Ok(())
    }
}

/// Projet avec deux fichiers déjà modifiés par l'utilisateur, et l'enregistrement qui
/// les réécrit en en créant un troisième.
fn projet_existant() -> (TempDir, Vec<FichierAEcrire>) {
    let dossier = projet();
    ecrire(
        dossier.path(),
        ".cadre/cadre.yaml",
        "schema_version: 1 # retouché à la main\n",
    );
    ecrire(dossier.path(), ".gitignore", "node_modules\r\n# perso\r\n");
    let fichiers = vec![
        FichierAEcrire::new(".cadre/cadre.yaml", "schema_version: 1\n"),
        FichierAEcrire::new(".gitignore", "node_modules\r\n# perso\r\n.cadre/tmp/\r\n"),
        FichierAEcrire::new(".cadre/agents/frontend.yaml", "name: frontend\n"),
    ];
    (dossier, fichiers)
}

fn assert_projet_inchange(racine: &Path) {
    assert_eq!(
        lire(racine, ".cadre/cadre.yaml").as_deref(),
        Some("schema_version: 1 # retouché à la main\n")
    );
    assert_eq!(
        lire(racine, ".gitignore").as_deref(),
        Some("node_modules\r\n# perso\r\n")
    );
    assert_eq!(lire(racine, ".cadre/agents/frontend.yaml"), None);
}

mod interruption_apres_le_premier_fichier {
    use super::*;

    #[test]
    fn test_ac_005_3_erreur_apres_le_premier_fichier_aucun_fichier_modifie() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::FichierRemplace(0)));

        assert!(resultat.is_err(), "l'erreur doit être remontée");
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_erreur_apres_le_deuxieme_fichier_aucun_fichier_modifie() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::FichierRemplace(1)));

        assert!(resultat.is_err());
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_erreur_apres_le_dernier_fichier_le_fichier_cree_est_retire() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::FichierRemplace(2)));

        assert!(resultat.is_err());
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

/// Arrêt brutal simulé (plantage, fermeture forcée) : la transaction s'arrête net à l'étape
/// donnée, sans exécuter aucun code de nettoyage ni d'annulation. Le disque reste dans
/// l'état exact où il était à cet instant.
struct ArretBrutalA(Etape);

impl PointsDeControle for ArretBrutalA {
    fn atteint(&self, etape: Etape) -> io::Result<()> {
        if etape == self.0 {
            panic!("arrêt brutal simulé à {etape:?}");
        }
        Ok(())
    }
}

fn arreter_brutalement(racine: &Path, fichiers: &[FichierAEcrire], etape: Etape) {
    let arret = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _ = ecrire_fichiers_avec(racine, fichiers, &ArretBrutalA(etape));
    }));
    assert!(arret.is_err(), "l'arrêt brutal à {etape:?} n'a pas eu lieu");
}

mod arret_brutal_puis_redemarrage {
    use super::*;

    #[test]
    fn test_ac_005_3_arret_apres_le_premier_fichier_annule_au_demarrage() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(0));

        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_arret_apres_le_dernier_fichier_annule_au_demarrage() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(2));

        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_4_arret_avant_remplacement_original_intact_puis_temporaires_supprimes() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::AvantRemplacement);
        assert_projet_inchange(racine);
        assert_ne!(temporaires(racine), Vec::<String>::new());

        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_4_arret_pendant_l_ecriture_des_temporaires() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::TemporaireEcrit(1));
        assert_projet_inchange(racine);

        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_4_temporaires_orphelins_supprimes_au_demarrage() {
        let (dossier, _) = projet_existant();
        let racine = dossier.path();
        ecrire(racine, ".cadre/tmp/.cadre.yaml.tmp", "orphelin");
        ecrire(racine, ".cadre/tmp/txn-ancien/0.nouveau", "orphelin");

        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_4_recuperation_sans_dossier_cadre_ne_fait_rien() {
        let dossier = projet();

        recuperer(dossier.path()).expect("récupération");

        assert!(!dossier.path().join(".cadre").exists());
    }

    #[test]
    fn test_ac_005_4_prochain_enregistrement_recupere_d_abord_la_transaction_interrompue() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(0));

        ecrire_fichiers(racine, &[FichierAEcrire::new("CLAUDE.md", "# Projet\n")])
            .expect("écriture");

        assert_projet_inchange(racine);
        assert_eq!(lire(racine, "CLAUDE.md").as_deref(), Some("# Projet\n"));
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_fichier_modifie_par_l_utilisateur_apres_l_arret_n_est_pas_ecrase() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(1));
        ecrire(
            racine,
            ".gitignore",
            "modifié par l'utilisateur après l'arrêt\n",
        );

        recuperer(racine).expect("récupération");

        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1 # retouché à la main\n")
        );
        assert_eq!(
            lire(racine, ".gitignore").as_deref(),
            Some("modifié par l'utilisateur après l'arrêt\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

mod erreur_avant_remplacement {
    use super::*;

    #[test]
    fn test_ac_005_4_erreur_avant_remplacement_original_intact_sans_temporaire() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::AvantRemplacement));

        assert!(resultat.is_err());
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_4_erreur_pendant_l_ecriture_des_temporaires_sans_temporaire() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::TemporaireEcrit(0)));

        assert!(resultat.is_err());
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

mod version_precedente {
    use super::*;
    use serde_json::Value;
    use sha2::{Digest, Sha256};

    fn sha256(texte: &str) -> String {
        Sha256::digest(texte.as_bytes())
            .iter()
            .map(|octet| format!("{octet:02x}"))
            .collect()
    }

    /// `.cadre/backups/index.yaml` est écrit en JSON, sous-ensemble valide de YAML 1.2.
    fn index(racine: &Path) -> Value {
        let texte = lire(racine, ".cadre/backups/index.yaml").expect("index.yaml présent");
        serde_json::from_str(&texte).expect("index.yaml lisible")
    }

    fn entree_index(racine: &Path, chemin: &str) -> Value {
        index(racine)["files"]
            .as_array()
            .expect("liste files")
            .iter()
            .find(|entree| entree["path"] == chemin)
            .cloned()
            .unwrap_or_else(|| panic!("{chemin} absent de l'index"))
    }

    #[test]
    fn test_ac_005_5_version_precedente_conservee_dans_cadre_backups() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        ecrire_fichiers(racine, &fichiers).expect("écriture");

        assert_eq!(
            lire(racine, ".cadre/backups/.cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1 # retouché à la main\n")
        );
        assert_eq!(
            lire(racine, ".cadre/backups/.gitignore").as_deref(),
            Some("node_modules\r\n# perso\r\n")
        );
        assert_eq!(lire(racine, ".cadre/backups/.cadre/agents/frontend.yaml"), None);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_5_index_note_empreintes_precedente_et_ecrite_et_date() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        ecrire_fichiers(racine, &fichiers).expect("écriture");

        let remplace = entree_index(racine, ".cadre/cadre.yaml");
        assert_eq!(
            remplace["previous_sha256"],
            sha256("schema_version: 1 # retouché à la main\n")
        );
        assert_eq!(remplace["written_sha256"], sha256("schema_version: 1\n"));
        let date = remplace["date"].as_str().expect("date");
        assert!(
            humantime::parse_rfc3339(date).is_ok(),
            "date RFC 3339 : {date}"
        );

        let cree = entree_index(racine, ".cadre/agents/frontend.yaml");
        assert_eq!(cree.get("previous_sha256"), None);
        assert_eq!(cree["written_sha256"], sha256("name: frontend\n"));
    }

    #[test]
    fn test_ac_005_5_une_seule_version_precedente_la_derniere() {
        let dossier = projet();
        let racine = dossier.path();
        for version in ["v1\n", "v2\n", "v3\n"] {
            ecrire_fichiers(racine, &[FichierAEcrire::new(".cadre/cadre.yaml", version)])
                .expect("écriture");
        }

        assert_eq!(
            lire(racine, ".cadre/backups/.cadre/cadre.yaml").as_deref(),
            Some("v2\n")
        );
        assert_eq!(
            entree_index(racine, ".cadre/cadre.yaml")["previous_sha256"],
            sha256("v2\n")
        );
        assert_eq!(index(racine)["files"].as_array().map(Vec::len), Some(1));
    }

    #[test]
    fn test_ac_005_5_echec_ne_touche_pas_aux_sauvegardes() {
        let dossier = projet();
        let racine = dossier.path();
        for version in ["v1\n", "v2\n"] {
            ecrire_fichiers(racine, &[FichierAEcrire::new(".cadre/cadre.yaml", version)])
                .expect("écriture");
        }
        let index_avant = lire(racine, ".cadre/backups/index.yaml");

        let resultat = ecrire_fichiers_avec(
            racine,
            &[FichierAEcrire::new(".cadre/cadre.yaml", "v3\n")],
            &ErreurA(Etape::FichierRemplace(0)),
        );

        assert!(resultat.is_err());
        assert_eq!(lire(racine, ".cadre/cadre.yaml").as_deref(), Some("v2\n"));
        assert_eq!(
            lire(racine, ".cadre/backups/.cadre/cadre.yaml").as_deref(),
            Some("v1\n")
        );
        assert!(index_avant.is_some());
        assert_eq!(lire(racine, ".cadre/backups/index.yaml"), index_avant);
    }

    #[test]
    fn test_ac_005_5_arret_apres_validation_sauvegardes_terminees_au_demarrage() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::TransactionValidee);

        recuperer(racine).expect("récupération");

        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1\n")
        );
        assert_eq!(
            lire(racine, ".cadre/backups/.cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1 # retouché à la main\n")
        );
        assert_eq!(
            entree_index(racine, ".gitignore")["previous_sha256"],
            sha256("node_modules\r\n# perso\r\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_5_erreur_apres_validation_enregistrement_reussi_sauvegardes_au_demarrage() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::TransactionValidee))
            .expect("les fichiers sont écrits : l'enregistrement a réussi");
        assert_eq!(
            lire(racine, ".cadre/agents/frontend.yaml").as_deref(),
            Some("name: frontend\n")
        );

        recuperer(racine).expect("récupération");

        assert_eq!(
            lire(racine, ".cadre/agents/frontend.yaml").as_deref(),
            Some("name: frontend\n")
        );
        assert_eq!(
            lire(racine, ".cadre/backups/.gitignore").as_deref(),
            Some("node_modules\r\n# perso\r\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

mod transaction_reussie {
    use super::*;

    #[test]
    fn test_ac_005_3_tous_les_fichiers_sont_ecrits_et_aucun_temporaire_ne_reste() {
        let dossier = projet();
        let racine = dossier.path();
        ecrire(racine, ".cadre/cadre.yaml", "ancien cadre\n");
        ecrire(racine, ".gitignore", "node_modules\n");

        ecrire_fichiers(
            racine,
            &[
                FichierAEcrire::new(".cadre/cadre.yaml", "nouveau cadre\n"),
                FichierAEcrire::new(".gitignore", "node_modules\n.cadre/tmp/\n"),
                FichierAEcrire::new(".cadre/agents/frontend.yaml", "name: frontend\n"),
            ],
        )
        .expect("écriture réussie");

        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("nouveau cadre\n")
        );
        assert_eq!(
            lire(racine, ".gitignore").as_deref(),
            Some("node_modules\n.cadre/tmp/\n")
        );
        assert_eq!(
            lire(racine, ".cadre/agents/frontend.yaml").as_deref(),
            Some("name: frontend\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}
