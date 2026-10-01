//! Intégration : lecture des fichiers du projet et ouverture du projet (US-005, re-revues).
//! - la lecture ne sort jamais du projet par un lien ou une jonction ;
//! - un projet déjà enregistré s'ouvre même en lecture seule ; un échec de reprise à
//!   l'ouverture devient un avertissement, jamais un refus d'ouvrir.

use cadre_lib::fs_atomique::commandes::{lire, ouvrir, ErreurDto, ProjetOuvert};
use cadre_lib::fs_atomique::{ecrire_fichiers, ErreurEcriture, FichierAEcrire};
use std::fs;
use std::path::Path;

fn texte(chemin: &Path) -> String {
    chemin.to_string_lossy().into_owned()
}

fn code(erreur: ErreurEcriture) -> String {
    ErreurDto::from(erreur).code
}

/// Lien vers un dossier : symbolique sous Unix, jonction sous Windows.
fn lier_dossier(cible: &Path, lien: &Path) {
    fs::create_dir_all(lien.parent().unwrap()).unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(cible, lien).unwrap();
    #[cfg(windows)]
    {
        let normaliser = |chemin: &Path| chemin.components().collect::<std::path::PathBuf>();
        let statut = std::process::Command::new("cmd")
            .args(["/C", "mklink", "/J"])
            .arg(normaliser(lien))
            .arg(normaliser(cible))
            .status()
            .unwrap();
        assert!(statut.success(), "création de la jonction");
    }
}

fn projet_ouvert() -> (tempfile::TempDir, ProjetOuvert, String) {
    let dossier = tempfile::tempdir().unwrap();
    let etat = ProjetOuvert::default();
    let racine = texte(dossier.path());
    ouvrir(&etat, &racine).expect("ouverture");
    (dossier, etat, racine)
}

#[test]
fn test_securite_lecture_a_travers_un_dossier_en_lien_refusee() {
    let victime = tempfile::tempdir().unwrap();
    fs::write(victime.path().join("secret.txt"), "secret").unwrap();
    let (dossier, etat, racine) = projet_ouvert();
    lier_dossier(victime.path(), &dossier.path().join("docs"));

    let lecture = lire(&etat, &racine, "docs/secret.txt");

    assert_eq!(code(lecture.unwrap_err()), "CHEMIN_INVALIDE");
}

/// Sous Unix : `.gitignore` est un lien vers un fichier secret hors du projet. Sous Windows
/// (créer un lien de fichier exige des droits) : `.gitignore` est une jonction.
#[test]
fn test_securite_gitignore_en_lien_n_est_ni_lu_ni_recopie() {
    let victime = tempfile::tempdir().unwrap();
    fs::write(victime.path().join("id_rsa"), "CLÉ PRIVÉE").unwrap();
    let (dossier, etat, racine) = projet_ouvert();
    #[cfg(unix)]
    std::os::unix::fs::symlink(
        victime.path().join("id_rsa"),
        dossier.path().join(".gitignore"),
    )
    .unwrap();
    #[cfg(windows)]
    lier_dossier(victime.path(), &dossier.path().join(".gitignore"));

    let lecture = lire(&etat, &racine, ".gitignore");

    assert_eq!(code(lecture.unwrap_err()), "CHEMIN_INVALIDE");
    assert!(!dossier.path().join(".cadre/backups").exists());
}

#[test]
fn test_securite_lecture_d_un_dossier_ou_d_un_fichier_special_refusee() {
    let (dossier, etat, racine) = projet_ouvert();
    fs::create_dir(dossier.path().join("docs")).unwrap();

    assert_eq!(
        code(lire(&etat, &racine, "docs").unwrap_err()),
        "CHEMIN_INVALIDE"
    );
}

/// Re-revue n°2, point 7 : un échec d'ouverture ne remplace pas le projet ouvert.
#[test]
fn test_securite_ouverture_refusee_garde_le_projet_precedent() {
    let (dossier, etat, racine) = projet_ouvert();
    fs::write(dossier.path().join("a.txt"), "a").unwrap();

    assert!(ouvrir(&etat, &texte(&dossier.path().join("absent"))).is_err());

    assert_eq!(lire(&etat, &racine, "a.txt").unwrap(), Some("a".to_owned()));
}

/// Une transaction interrompue laissée dans `.cadre/tmp`.
#[cfg(unix)]
fn transaction_orpheline(racine: &Path) {
    let txn = racine.join(".cadre/tmp/txn-orphelin");
    fs::create_dir_all(&txn).unwrap();
    fs::write(txn.join("0.nouveau"), "x").unwrap();
}

/// Projet déjà enregistré (`.cadre/tmp/verrou` existe), puis rendu entièrement lecture seule.
fn projet_enregistre(racine: &Path) {
    ecrire_fichiers(
        racine,
        &[FichierAEcrire::new(
            ".cadre/cadre.yaml",
            "schema_version: 1\n",
        )],
    )
    .expect("enregistrement");
}

#[cfg(unix)]
mod lecture_seule_unix {
    use super::*;
    use std::os::unix::fs::{MetadataExt, PermissionsExt};

    fn tout_en_lecture_seule(racine: &Path, lecture_seule: bool) {
        let mut chemins = vec![racine.to_path_buf()];
        let mut i = 0;
        while i < chemins.len() {
            if chemins[i].is_dir() {
                for entree in fs::read_dir(&chemins[i]).unwrap() {
                    chemins.push(entree.unwrap().path());
                }
            }
            i += 1;
        }
        for chemin in chemins {
            let mode = match (chemin.is_dir(), lecture_seule) {
                (true, true) => 0o555,
                (true, false) => 0o755,
                (false, true) => 0o444,
                (false, false) => 0o644,
            };
            fs::set_permissions(&chemin, fs::Permissions::from_mode(mode)).unwrap();
        }
    }

    fn precondition_non_root(racine: &Path) {
        assert_ne!(
            fs::metadata(racine).unwrap().uid(),
            0,
            "précondition : lancer ce test sans droits root (root ignore les droits Unix)"
        );
    }

    #[test]
    fn test_ac_001_1_projet_deja_enregistre_en_lecture_seule_s_ouvre() {
        let dossier = tempfile::tempdir().unwrap();
        precondition_non_root(dossier.path());
        projet_enregistre(dossier.path());
        tout_en_lecture_seule(dossier.path(), true);

        let ouverture = ouvrir(&ProjetOuvert::default(), &texte(dossier.path()));

        tout_en_lecture_seule(dossier.path(), false);
        assert!(matches!(ouverture, Ok(None)), "{ouverture:?}");
    }

    /// Re-revues révision 3, point 6 : une transaction déjà mise de côté ne déclenche pas de
    /// reprise (ni verrou, ni avertissement à chaque ouverture).
    #[test]
    fn test_ac_005_4_transaction_mise_de_cote_ignoree_a_l_ouverture_en_lecture_seule() {
        let dossier = tempfile::tempdir().unwrap();
        precondition_non_root(dossier.path());
        projet_enregistre(dossier.path());
        let de_cote = dossier.path().join(".cadre/tmp/de-cote-txn-1");
        fs::create_dir_all(&de_cote).unwrap();
        fs::write(de_cote.join("0.ancien"), "copie").unwrap();
        tout_en_lecture_seule(dossier.path(), true);

        let ouverture = ouvrir(&ProjetOuvert::default(), &texte(dossier.path()));

        tout_en_lecture_seule(dossier.path(), false);
        assert!(matches!(ouverture, Ok(None)), "{ouverture:?}");
    }

    #[test]
    fn test_ac_005_4_reprise_impossible_en_lecture_seule_le_projet_s_ouvre_avec_un_avertissement() {
        let dossier = tempfile::tempdir().unwrap();
        precondition_non_root(dossier.path());
        projet_enregistre(dossier.path());
        transaction_orpheline(dossier.path());
        tout_en_lecture_seule(dossier.path(), true);

        let ouverture = ouvrir(&ProjetOuvert::default(), &texte(dossier.path()));

        tout_en_lecture_seule(dossier.path(), false);
        match ouverture {
            Ok(Some(avertissement)) => assert_eq!(code(avertissement), "LECTURE_SEULE"),
            autre => panic!("{autre:?}"),
        }
    }
}

#[cfg(windows)]
mod lecture_seule_windows {
    use super::*;

    /// Windows : l'attribut lecture seule d'un dossier ne protège rien ; le fichier de
    /// verrou en lecture seule reproduit un projet qu'on ne peut pas modifier.
    #[test]
    fn test_ac_001_1_projet_deja_enregistre_en_lecture_seule_s_ouvre() {
        let dossier = tempfile::tempdir().unwrap();
        projet_enregistre(dossier.path());
        let verrou = dossier.path().join(".cadre/tmp/verrou");
        let origine = fs::metadata(&verrou).unwrap().permissions();
        let mut lecture_seule = origine.clone();
        lecture_seule.set_readonly(true);
        fs::set_permissions(&verrou, lecture_seule).unwrap();

        let ouverture = ouvrir(&ProjetOuvert::default(), &texte(dossier.path()));

        fs::set_permissions(&verrou, origine).unwrap();
        assert!(matches!(ouverture, Ok(None)), "{ouverture:?}");
    }
}
