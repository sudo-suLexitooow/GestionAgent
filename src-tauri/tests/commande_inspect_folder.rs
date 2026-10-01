//! Intégration : la commande Tauri `inspect_folder` telle que l'appelle l'interface (US-001).
//! Vérifie le nom de la commande, l'argument `path` et le format JSON attendu par `FolderStatus` (TS).

use serde_json::{json, Value};

mod common;

fn invoke_inspect_folder(path: &std::path::Path) -> Result<Value, Value> {
    common::invoke("inspect_folder", json!({ "path": path }))
}

#[test]
fn test_ac_001_1_commande_inspect_folder_renvoie_ok_pour_un_dossier() {
    let dir = tempfile::tempdir().unwrap();

    assert_eq!(invoke_inspect_folder(dir.path()), Ok(json!("ok")));
}

#[test]
fn test_ac_001_3_commande_inspect_folder_signale_un_fichier() {
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("notes.txt");
    std::fs::write(&file, "contenu").unwrap();

    assert_eq!(invoke_inspect_folder(&file), Ok(json!("not-a-directory")));
}

#[test]
fn test_ac_001_4_commande_inspect_folder_signale_un_dossier_inexistant() {
    let dir = tempfile::tempdir().unwrap();

    assert_eq!(
        invoke_inspect_folder(&dir.path().join("absent")),
        Ok(json!("not-found"))
    );
}
