//! Tests d'intégration de l'écriture atomique (US-005, zone sensible) sur de vrais dossiers
//! temporaires. Tournent en CI sous Linux, Windows et macOS (AC-005-7).

use cadre_lib::fs_atomique::{
    ecrire_fichiers, ecrire_fichiers_avec, recuperer, recuperer_avec, Etape, FichierAEcrire,
    PointsDeControle,
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
/// Le fichier de verrou `.cadre/tmp/verrou` (revue A, point 5) est permanent : ce n'est pas
/// un temporaire, il n'est pas compté.
fn temporaires(racine: &Path) -> Vec<String> {
    let mut noms = Vec::new();
    let mut a_visiter = vec![racine.join(".cadre/tmp")];
    while let Some(dossier) = a_visiter.pop() {
        let Ok(entrees) = fs::read_dir(&dossier) else {
            continue;
        };
        for entree in entrees {
            let chemin = entree.unwrap().path();
            if chemin == racine.join(".cadre/tmp/verrou") {
                continue;
            }
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
        assert_eq!(
            lire(racine, ".cadre/backups/.cadre/agents/frontend.yaml"),
            None
        );
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

/// Erreur du système d'exploitation simulée à l'étape donnée (code d'erreur natif).
struct ErreurSystemeA(Etape, i32);

impl PointsDeControle for ErreurSystemeA {
    fn atteint(&self, etape: Etape) -> io::Result<()> {
        if etape == self.0 {
            return Err(io::Error::from_raw_os_error(self.1));
        }
        Ok(())
    }
}

#[cfg(unix)]
mod codes {
    pub const DISQUE_PLEIN: i32 = 28; // ENOSPC (Linux, macOS)
    pub const VOLUME_EN_LECTURE_SEULE: i32 = 30; // EROFS (Linux, macOS)
}

#[cfg(windows)]
mod codes {
    pub const DISQUE_PLEIN: i32 = 112; // ERROR_DISK_FULL
    pub const VOLUME_EN_LECTURE_SEULE: i32 = 19; // ERROR_WRITE_PROTECT
}

mod disque_plein_ou_lecture_seule {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;

    #[test]
    fn test_ac_005_6_disque_plein_simule_erreur_claire_et_fichiers_inchanges() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(
            racine,
            &fichiers,
            &ErreurSystemeA(Etape::TemporaireEcrit(1), codes::DISQUE_PLEIN),
        );

        assert!(
            matches!(resultat, Err(ErreurEcriture::DisquePlein(_))),
            "{resultat:?}"
        );
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_6_disque_plein_pendant_le_remplacement_fichiers_inchanges() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(
            racine,
            &fichiers,
            &ErreurSystemeA(Etape::FichierRemplace(1), codes::DISQUE_PLEIN),
        );

        assert!(
            matches!(resultat, Err(ErreurEcriture::DisquePlein(_))),
            "{resultat:?}"
        );
        assert_projet_inchange(racine);
    }

    #[test]
    fn test_ac_005_6_volume_en_lecture_seule_simule_erreur_claire_et_fichiers_inchanges() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(
            racine,
            &fichiers,
            &ErreurSystemeA(Etape::FichierRemplace(0), codes::VOLUME_EN_LECTURE_SEULE),
        );

        assert!(
            matches!(resultat, Err(ErreurEcriture::LectureSeule(_))),
            "{resultat:?}"
        );
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    /// Unix : le dossier du projet et `.cadre/` sont réellement en lecture seule (droits).
    /// Doit tourner sous un utilisateur non administrateur (cas de la CI) : root ignore les
    /// droits.
    #[cfg(unix)]
    #[test]
    fn test_ac_005_6_dossier_reellement_en_lecture_seule_erreur_claire_et_fichiers_inchanges() {
        use std::os::unix::fs::{MetadataExt, PermissionsExt};
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        let proprietaire = fs::metadata(racine.join(".gitignore")).unwrap().uid();
        assert_ne!(
            proprietaire, 0,
            "précondition : lancer ce test sans droits root (root ignore les droits Unix)"
        );
        let dossiers = [racine.join(".cadre"), racine.to_path_buf()];
        for chemin in &dossiers {
            fs::set_permissions(chemin, fs::Permissions::from_mode(0o555)).unwrap();
        }

        let resultat = ecrire_fichiers(racine, &fichiers);

        for chemin in dossiers.iter().rev() {
            fs::set_permissions(chemin, fs::Permissions::from_mode(0o755)).unwrap();
        }
        assert!(
            matches!(resultat, Err(ErreurEcriture::LectureSeule(_))),
            "{resultat:?}"
        );
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    /// Windows : le deuxième fichier porte l'attribut « lecture seule » ; le premier, déjà
    /// remplacé, doit être remis d'origine. (Sous Windows l'attribut lecture seule d'un
    /// dossier n'empêche pas d'y écrire : c'est le fichier qui est protégé.)
    #[cfg(windows)]
    #[test]
    fn test_ac_005_6_fichier_reellement_en_lecture_seule_erreur_claire_et_fichiers_inchanges() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        let protege = racine.join(".gitignore");
        let droits_d_origine = fs::metadata(&protege).unwrap().permissions();
        let mut lecture_seule = droits_d_origine.clone();
        lecture_seule.set_readonly(true);
        fs::set_permissions(&protege, lecture_seule).unwrap();

        let resultat = ecrire_fichiers(racine, &fichiers);

        fs::set_permissions(&protege, droits_d_origine).unwrap();
        assert!(
            matches!(resultat, Err(ErreurEcriture::LectureSeule(_))),
            "{resultat:?}"
        );
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

/// Sécurité (zone sensible) : la commande n'écrit que des chemins relatifs, dans le projet,
/// hors des dossiers internes de l'écrivain.
mod chemins_refuses {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;

    #[test]
    fn test_securite_chemin_hors_projet_ou_interne_refuse_et_rien_n_est_ecrit() {
        for chemin in [
            "",
            "/etc/cadre",
            "C:/cadre.txt",
            "../dehors.txt",
            "a/../../dehors.txt",
            "a//b",
            "./a",
            "a\\b",
            ".cadre/tmp/x",
            ".cadre/backups/x",
            ".cadre/backups",
        ] {
            let (dossier, fichiers) = projet_existant();
            let racine = dossier.path();
            let mut lot = fichiers.clone();
            lot.push(FichierAEcrire::new(chemin, "intrus"));

            let resultat = ecrire_fichiers(racine, &lot);

            assert!(
                matches!(resultat, Err(ErreurEcriture::CheminInvalide(_))),
                "{chemin:?} : {resultat:?}"
            );
            assert_projet_inchange(racine);
        }
    }
}

/// Crée `lien` pointant vers le dossier `cible` : lien symbolique sous Unix, jonction sous
/// Windows (pas de droits administrateur nécessaires).
fn lier_dossier(cible: &Path, lien: &Path) {
    fs::create_dir_all(lien.parent().unwrap()).unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(cible, lien).unwrap();
    #[cfg(windows)]
    {
        let statut = std::process::Command::new("cmd")
            .args(["/C", "mklink", "/J"])
            .arg(lien)
            .arg(cible)
            .status()
            .unwrap();
        assert!(statut.success(), "création de la jonction");
    }
}

/// Dossier hors du projet, avec un fichier témoin et une fausse transaction, qui ne doivent
/// jamais être touchés.
fn dossier_victime() -> TempDir {
    let victime = projet();
    ecrire(victime.path(), "temoin.txt", "précieux");
    ecrire(victime.path(), "txn-faux/journal.json", "{}");
    victime
}

fn assert_victime_intacte(victime: &Path) {
    assert_eq!(lire(victime, "temoin.txt").as_deref(), Some("précieux"));
    assert_eq!(
        lire(victime, "txn-faux/journal.json").as_deref(),
        Some("{}")
    );
}

/// Bloquant de revue n° 1 : un dépôt malveillant ne doit pas pouvoir faire effacer un dossier
/// hors du projet via un lien dans `.cadre/`.
mod liens_dans_cadre {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;

    #[test]
    fn test_ac_005_4_cadre_tmp_en_lien_refuse_rien_hors_du_projet_n_est_touche() {
        let victime = dossier_victime();
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        lier_dossier(victime.path(), &racine.join(".cadre/tmp"));

        let recuperation = recuperer(racine);
        let ecriture = ecrire_fichiers(racine, &fichiers);

        assert!(
            matches!(recuperation, Err(ErreurEcriture::CheminInvalide(_))),
            "{recuperation:?}"
        );
        assert!(
            matches!(ecriture, Err(ErreurEcriture::CheminInvalide(_))),
            "{ecriture:?}"
        );
        assert_victime_intacte(victime.path());
        assert_projet_inchange(racine);
    }

    #[test]
    fn test_ac_005_4_cadre_en_lien_refuse_rien_hors_du_projet_n_est_touche() {
        let victime = dossier_victime();
        ecrire(victime.path(), "tmp/orphelin.txt", "précieux aussi");
        let dossier = projet();
        let racine = dossier.path();
        lier_dossier(victime.path(), &racine.join(".cadre"));

        let recuperation = recuperer(racine);
        let ecriture = ecrire_fichiers(racine, &[FichierAEcrire::new("CLAUDE.md", "x")]);

        assert!(
            matches!(recuperation, Err(ErreurEcriture::CheminInvalide(_))),
            "{recuperation:?}"
        );
        assert!(
            matches!(ecriture, Err(ErreurEcriture::CheminInvalide(_))),
            "{ecriture:?}"
        );
        assert_victime_intacte(victime.path());
        assert_eq!(
            lire(victime.path(), "tmp/orphelin.txt").as_deref(),
            Some("précieux aussi")
        );
        assert_eq!(lire(racine, "CLAUDE.md"), None);
    }

    #[test]
    fn test_ac_005_4_liens_dans_cadre_tmp_jamais_suivis() {
        let victime = dossier_victime();
        let (dossier, _) = projet_existant();
        let racine = dossier.path();
        lier_dossier(victime.path(), &racine.join(".cadre/tmp/txn-lien"));
        lier_dossier(victime.path(), &racine.join(".cadre/tmp/autre-lien"));

        recuperer(racine).expect("récupération");

        assert_victime_intacte(victime.path());
        assert_projet_inchange(racine);
    }
}

fn sha256_hex(texte: &str) -> String {
    use sha2::{Digest, Sha256};
    Sha256::digest(texte.as_bytes())
        .iter()
        .map(|octet| format!("{octet:02x}"))
        .collect()
}

/// Dépose dans `.cadre/tmp/txn-forge/` un journal fabriqué (dépôt cloné malveillant).
fn forger_transaction(racine: &Path, etat: &str, chemin: &str, empreinte_nouvelle: &str) {
    let journal = serde_json::json!({
        "etat": etat,
        "entrees": [{
            "chemin": chemin,
            "empreinte_precedente": sha256_hex("pirate"),
            "empreinte_nouvelle": empreinte_nouvelle,
        }],
    });
    ecrire(
        racine,
        ".cadre/tmp/txn-forge/journal.json",
        &journal.to_string(),
    );
    ecrire(racine, ".cadre/tmp/txn-forge/0.ancien", "pirate");
}

/// Bloquant de revue n° 2 : les chemins lus dans un journal sont validés comme ceux écrits.
mod journal_forge {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;

    fn assert_refus_puis_ecriture_possible(racine: &Path) {
        let recuperation = recuperer(racine);
        assert!(
            matches!(recuperation, Err(ErreurEcriture::RecuperationImpossible(_))),
            "{recuperation:?}"
        );
        ecrire_fichiers(racine, &[FichierAEcrire::new("CLAUDE.md", "# Projet\n")])
            .expect("le journal forgé ne bloque pas les écritures suivantes");
        assert_eq!(lire(racine, "CLAUDE.md").as_deref(), Some("# Projet\n"));
    }

    #[test]
    fn test_ac_005_4_journal_en_cours_avec_chemin_absolu_ne_supprime_rien_hors_du_projet() {
        let victime = dossier_victime();
        let (dossier, _) = projet_existant();
        let racine = dossier.path();
        let cible = victime.path().join("temoin.txt");
        forger_transaction(
            racine,
            "en_cours",
            &cible.to_string_lossy(),
            &sha256_hex("précieux"),
        );

        assert_refus_puis_ecriture_possible(racine);

        assert_victime_intacte(victime.path());
        assert_projet_inchange(racine);
    }

    #[test]
    fn test_ac_005_4_journal_en_cours_avec_chemin_remontant_ne_supprime_rien() {
        let parent = projet();
        ecrire(parent.path(), "temoin.txt", "précieux");
        let racine = parent.path().join("projet");
        ecrire(&racine, ".cadre/cadre.yaml", "schema_version: 1\n");
        forger_transaction(
            &racine,
            "en_cours",
            "../temoin.txt",
            &sha256_hex("précieux"),
        );

        assert_refus_puis_ecriture_possible(&racine);

        assert_eq!(
            lire(parent.path(), "temoin.txt").as_deref(),
            Some("précieux")
        );
    }

    #[test]
    fn test_ac_005_5_journal_valide_avec_chemin_remontant_n_ecrit_rien_hors_du_projet() {
        let parent = projet();
        let racine = parent.path().join("projet");
        ecrire(&racine, ".cadre/cadre.yaml", "schema_version: 1\n");
        // .cadre/backups/../../../intrus.txt sortirait du projet.
        forger_transaction(&racine, "validee", "../../../intrus.txt", &sha256_hex("x"));

        assert_refus_puis_ecriture_possible(&racine);

        assert_eq!(lire(parent.path(), "intrus.txt"), None);
        assert_eq!(lire(&racine, "intrus.txt"), None);
    }

    /// Revue B n° 11 : journal illisible → erreur qui nomme le dossier à examiner, rien
    /// n'est supprimé, et les écritures suivantes restent possibles.
    #[test]
    fn test_ac_005_4_journal_illisible_mis_de_cote_sans_rien_supprimer() {
        let (dossier, _) = projet_existant();
        let racine = dossier.path();
        ecrire(racine, ".cadre/tmp/txn-abime/journal.json", "{ tronqué");
        ecrire(racine, ".cadre/tmp/txn-abime/0.ancien", "copie d'origine");

        let recuperation = recuperer(racine);

        match &recuperation {
            Err(ErreurEcriture::RecuperationImpossible(detail)) => {
                assert!(detail.contains("txn-abime"), "{detail}")
            }
            autre => panic!("{autre:?}"),
        }
        let copies: Vec<String> = temporaires(racine)
            .into_iter()
            .filter(|chemin| chemin.ends_with("0.ancien"))
            .collect();
        assert_eq!(copies.len(), 1, "la copie d'origine est conservée");
        ecrire_fichiers(racine, &[FichierAEcrire::new("CLAUDE.md", "x")])
            .expect("pas de blocage permanent");
        assert_projet_inchange(racine);
    }

    #[test]
    fn test_ac_005_4_journal_dont_un_parent_est_un_lien_ne_supprime_rien_hors_du_projet() {
        let victime = dossier_victime();
        let (dossier, _) = projet_existant();
        let racine = dossier.path();
        lier_dossier(victime.path(), &racine.join("docs"));
        forger_transaction(
            racine,
            "en_cours",
            "docs/temoin.txt",
            &sha256_hex("précieux"),
        );

        assert_refus_puis_ecriture_possible(racine);

        assert_victime_intacte(victime.path());
    }
}

/// Bloquant de revue n° 3 : une transaction validée dont les sauvegardes ne peuvent pas se
/// terminer ne bloque jamais les écritures suivantes.
mod transaction_validee_jamais_bloquante {
    use super::*;

    fn transaction_validee_restante(racine: &Path) -> std::path::PathBuf {
        fs::read_dir(racine.join(".cadre/tmp"))
            .unwrap()
            .map(|entree| entree.unwrap().path())
            .find(|chemin| chemin.join("journal.json").exists())
            .expect("transaction validée restante")
    }

    #[test]
    fn test_ac_005_4_copie_ancienne_disparue_apres_validation_ecriture_suivante_possible() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::TransactionValidee);
        // Arrêt pendant le nettoyage final : une partie des fichiers a déjà disparu.
        fs::remove_file(transaction_validee_restante(racine).join("0.ancien")).unwrap();

        recuperer(racine).expect("récupération");
        ecrire_fichiers(racine, &[FichierAEcrire::new("CLAUDE.md", "# P\n")]).expect("écriture");

        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1\n")
        );
        assert_eq!(lire(racine, "CLAUDE.md").as_deref(), Some("# P\n"));
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_4_arret_apres_suppression_du_journal_nettoye_au_demarrage() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::JournalSupprime);

        recuperer(racine).expect("récupération");

        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_5_sauvegarde_impossible_n_empeche_pas_les_ecritures_suivantes() {
        let dossier = projet();
        let racine = dossier.path();
        for version in ["x1", "x2"] {
            ecrire_fichiers(racine, &[FichierAEcrire::new("x", version)]).expect("écriture");
        }
        // `.cadre/backups/x` est un fichier ; `x` devient un dossier.
        fs::remove_file(racine.join("x")).unwrap();
        for version in ["y1", "y2"] {
            ecrire_fichiers(racine, &[FichierAEcrire::new("x/y", version)])
                .expect("l'enregistrement validé réussit même sans sauvegarde");
        }

        ecrire_fichiers(racine, &[FichierAEcrire::new("x/y", "y3")])
            .expect("écriture suivante possible");

        assert_eq!(lire(racine, "x/y").as_deref(), Some("y3"));
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

/// Plusieurs pannes injectées, chacune à son étape.
struct ErreursA(Vec<Etape>);

impl PointsDeControle for ErreursA {
    fn atteint(&self, etape: Etape) -> io::Result<()> {
        if self.0.contains(&etape) {
            return Err(io::Error::other(format!("panne simulée à {etape:?}")));
        }
        Ok(())
    }
}

fn recuperation_arretee_brutalement(racine: &Path, etape: Etape) {
    let arret = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _ = recuperer_avec(racine, &ArretBrutalA(etape));
    }));
    assert!(arret.is_err(), "l'arrêt brutal à {etape:?} n'a pas eu lieu");
}

/// Revue A, point 4 : pannes pendant l'annulation et modifications de l'utilisateur.
mod pannes_pendant_l_annulation {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;

    #[test]
    fn test_ac_005_3_recuperation_arretee_deux_fois_puis_reprise() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(2));

        recuperation_arretee_brutalement(racine, Etape::FichierRestaure(2));
        recuperation_arretee_brutalement(racine, Etape::FichierRestaure(1));
        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_erreur_pendant_l_annulation_code_dedie_journal_conserve_puis_reprise() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(
            racine,
            &fichiers,
            &ErreursA(vec![Etape::FichierRemplace(1), Etape::FichierRestaure(1)]),
        );

        assert!(
            matches!(resultat, Err(ErreurEcriture::AnnulationIncomplete(_))),
            "{resultat:?}"
        );
        assert!(
            temporaires(racine)
                .iter()
                .any(|chemin| chemin.ends_with("journal.json")),
            "le journal reste pour la reprise"
        );
        recuperer(racine).expect("reprise");
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_fichier_supprime_par_l_utilisateur_apres_l_arret_reste_supprime() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(1));
        fs::remove_file(racine.join(".cadre/cadre.yaml")).unwrap();

        recuperer(racine).expect("récupération");

        assert_eq!(lire(racine, ".cadre/cadre.yaml"), None);
        assert_eq!(
            lire(racine, ".gitignore").as_deref(),
            Some("node_modules\r\n# perso\r\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_fichier_cree_puis_modifie_par_l_utilisateur_est_conserve() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(2));
        ecrire(
            racine,
            ".cadre/agents/frontend.yaml",
            "name: frontend # à moi\n",
        );

        recuperer(racine).expect("récupération");

        assert_eq!(
            lire(racine, ".cadre/agents/frontend.yaml").as_deref(),
            Some("name: frontend # à moi\n")
        );
        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("schema_version: 1 # retouché à la main\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_arret_avant_le_renommage_du_journal_valide_annule_au_demarrage() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::JournalValideProvisoire);

        recuperer(racine).expect("récupération");

        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}

/// Revue A, point 5 : un verrou de fichier exclusif empêche deux instances de Cadre
/// d'écrire ou de récupérer en même temps dans le même projet.
mod verrou_du_projet {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;
    use std::cell::RefCell;

    /// Pendant la transaction de « A », une seconde instance « B » tente d'écrire puis de
    /// récupérer dans le même projet.
    struct InstanceConcurrenteA<'a> {
        etape: Etape,
        racine: &'a Path,
        resultats: RefCell<Vec<Result<(), ErreurEcriture>>>,
    }

    impl PointsDeControle for InstanceConcurrenteA<'_> {
        fn atteint(&self, etape: Etape) -> io::Result<()> {
            if etape == self.etape {
                let b = [FichierAEcrire::new("CLAUDE.md", "écrit par B")];
                self.resultats
                    .borrow_mut()
                    .push(ecrire_fichiers(self.racine, &b));
                self.resultats.borrow_mut().push(recuperer(self.racine));
            }
            Ok(())
        }
    }

    #[test]
    fn test_ac_005_3_seconde_instance_refusee_pendant_un_enregistrement() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        let a = InstanceConcurrenteA {
            etape: Etape::FichierRemplace(1),
            racine,
            resultats: RefCell::new(Vec::new()),
        };

        ecrire_fichiers_avec(racine, &fichiers, &a).expect("A réussit");

        let resultats = a.resultats.into_inner();
        assert_eq!(resultats.len(), 2);
        for resultat in &resultats {
            assert!(
                matches!(resultat, Err(ErreurEcriture::ProjetOccupe)),
                "{resultat:?}"
            );
        }
        assert_eq!(lire(racine, "CLAUDE.md"), None);
        assert_eq!(
            lire(racine, ".cadre/agents/frontend.yaml").as_deref(),
            Some("name: frontend\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_verrou_libere_apres_un_arret_brutal() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        arreter_brutalement(racine, &fichiers, Etape::FichierRemplace(0));

        ecrire_fichiers(racine, &[FichierAEcrire::new("CLAUDE.md", "# P\n")])
            .expect("le verrou a été libéré");

        assert_projet_inchange(racine);
        assert_eq!(lire(racine, "CLAUDE.md").as_deref(), Some("# P\n"));
    }
}

/// Revue A point 6, revue B : noms Windows, casse, `.git`, doublons, parents en lien.
mod chemins_refuses_revue {
    use super::*;
    use cadre_lib::fs_atomique::ErreurEcriture;

    fn assert_refuse(lot: &[FichierAEcrire]) {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        let mut tout = fichiers.clone();
        tout.extend_from_slice(lot);

        let resultat = ecrire_fichiers(racine, &tout);

        assert!(
            matches!(resultat, Err(ErreurEcriture::CheminInvalide(_))),
            "{:?} : {resultat:?}",
            lot.iter().map(|f| &f.chemin).collect::<Vec<_>>()
        );
        assert_projet_inchange(racine);
    }

    #[test]
    fn test_securite_noms_reserves_windows_casse_et_git_refuses() {
        for chemin in [
            ".CADRE/TMP/x",
            ".cadre/TMP/x",
            ".Cadre/Backups/x",
            ".cadre./tmp/x",
            ".cadre/tmp./x",
            "a./b",
            "a /b",
            "dossier/fichier.",
            "fichier ",
            "CON",
            "con.txt",
            "a/aux",
            "nul.txt",
            "COM1",
            "lpt9.md",
            "COM\u{b9}",
            ".git",
            ".git/hooks/pre-commit",
            ".GIT/config",
            "sous/.git/config",
            "a<b",
            "a>b",
            "a|b",
            "a?b",
            "a*b",
            "a\"b",
            "a\u{1}b",
        ] {
            assert_refuse(&[FichierAEcrire::new(chemin, "intrus")]);
        }
    }

    #[test]
    fn test_securite_chemin_en_double_dans_un_lot_refuse() {
        assert_refuse(&[
            FichierAEcrire::new("CLAUDE.md", "1"),
            FichierAEcrire::new("CLAUDE.md", "2"),
        ]);
        assert_refuse(&[
            FichierAEcrire::new("claude.md", "1"),
            FichierAEcrire::new("CLAUDE.md", "2"),
        ]);
    }

    #[test]
    fn test_securite_noms_proches_des_noms_reserves_acceptes() {
        let dossier = projet();
        let racine = dossier.path();
        let lot: Vec<FichierAEcrire> = [
            "CONSOLE.md",
            "com10",
            "auxiliaire.txt",
            ".gitignore",
            ".github/workflows/ci.yml",
            ".cadre/cadre.yaml",
            "a.b/c",
        ]
        .iter()
        .map(|chemin| FichierAEcrire::new(chemin, "ok"))
        .collect();

        ecrire_fichiers(racine, &lot).expect("noms acceptés");

        assert_eq!(
            lire(racine, ".github/workflows/ci.yml").as_deref(),
            Some("ok")
        );
    }

    #[test]
    fn test_securite_ecriture_a_travers_un_dossier_en_lien_refusee() {
        let victime = dossier_victime();
        let dossier = projet();
        let racine = dossier.path();
        lier_dossier(victime.path(), &racine.join("docs"));

        let resultat = ecrire_fichiers(racine, &[FichierAEcrire::new("docs/temoin.txt", "écrasé")]);

        assert!(
            matches!(resultat, Err(ErreurEcriture::CheminInvalide(_))),
            "{resultat:?}"
        );
        assert_victime_intacte(victime.path());
    }

    #[test]
    fn test_securite_cadre_backups_en_lien_refuse() {
        let victime = dossier_victime();
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();
        lier_dossier(victime.path(), &racine.join(".cadre/backups"));

        let resultat = ecrire_fichiers(racine, &fichiers);

        assert!(
            matches!(resultat, Err(ErreurEcriture::CheminInvalide(_))),
            "{resultat:?}"
        );
        assert_victime_intacte(victime.path());
        assert_projet_inchange(racine);
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
