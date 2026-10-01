//! Intégration : la commande Tauri `inspect_folder` telle que l'appelle l'interface (US-001).
//! Vérifie le nom de la commande, l'argument `path` et le format JSON attendu par `FolderStatus` (TS).

use serde_json::{json, Value};
use tauri::test::{get_ipc_response, mock_builder, mock_context, noop_assets, INVOKE_KEY};
use tauri::webview::InvokeRequest;

fn invoke_inspect_folder(path: &std::path::Path) -> Result<Value, Value> {
    let app = cadre_lib::configure(mock_builder())
        .build(mock_context(noop_assets()))
        .unwrap();
    let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap();
    get_ipc_response(
        &webview,
        InvokeRequest {
            cmd: "inspect_folder".into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            url: "tauri://localhost".parse().unwrap(),
            body: tauri::ipc::InvokeBody::Json(json!({ "path": path })),
            headers: Default::default(),
            invoke_key: INVOKE_KEY.to_string(),
        },
    )
    .map(|body| body.deserialize::<Value>().unwrap())
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
