//! Intégration : `inspect_folder` sur de vrais fichiers temporaires (US-001).

use cadre_lib::folder::{inspect_folder, FolderStatus};

#[test]
fn test_ac_001_1_dossier_existant_et_lisible_est_ok() {
    let dir = tempfile::tempdir().unwrap();

    assert_eq!(inspect_folder(dir.path()), FolderStatus::Ok);
}
