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

/// Le cas « droits insuffisants » s'appuie sur les permissions POSIX : il ne s'exécute que sous
/// Linux et macOS (`#[cfg(unix)]`, pas `#[ignore]`). Sous Windows, la correspondance
/// « accès refusé → illisible » est couverte par le test unitaire de `folder.rs`.
/// Il doit tourner sous un utilisateur non administrateur : root ignore les permissions.
#[cfg(unix)]
mod droits_unix {
    use super::*;
    use std::fs::{set_permissions, Permissions};
    use std::os::unix::fs::PermissionsExt;

    #[test]
    fn test_ac_001_4_dossier_illisible() {
        let dir = tempfile::tempdir().unwrap();
        let locked = dir.path().join("verrouille");
        std::fs::create_dir(&locked).unwrap();
        set_permissions(&locked, Permissions::from_mode(0o000)).unwrap();

        let status = inspect_folder(&locked);

        set_permissions(&locked, Permissions::from_mode(0o755)).unwrap();
        assert_eq!(status, FolderStatus::Unreadable);
    }
}
