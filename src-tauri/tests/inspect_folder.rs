//! Intégration : `inspect_folder` sur de vrais fichiers temporaires (US-001).

use cadre_lib::folder::{inspect_folder, FolderStatus};

#[test]
fn test_ac_001_1_dossier_existant_et_lisible_est_ok() {
    let dir = tempfile::tempdir().unwrap();

    assert_eq!(inspect_folder(dir.path()), FolderStatus::Ok);
}

#[test]
fn test_ac_001_3_fichier_n_est_pas_un_dossier() {
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("notes.txt");
    std::fs::write(&file, "contenu").unwrap();

    assert_eq!(inspect_folder(&file), FolderStatus::NotADirectory);
}

#[test]
fn test_ac_001_4_dossier_inexistant() {
    let dir = tempfile::tempdir().unwrap();

    assert_eq!(
        inspect_folder(&dir.path().join("absent")),
        FolderStatus::NotFound
    );
}
