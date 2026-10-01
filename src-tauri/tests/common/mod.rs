//! Outils partagés des tests d'intégration : appel d'une commande Tauri par l'IPC simulé.

use serde_json::{json, Value};
use std::path::Path;
use tauri::test::{
    get_ipc_response, mock_builder, mock_context, noop_assets, MockRuntime, INVOKE_KEY,
};
use tauri::webview::InvokeRequest;
use tauri::WebviewWindow;

/// Origine de l'interface selon la plateforme : le contrôle d'accès de Tauri refuse une commande
/// venant d'une autre origine. Tauri n'expose pas cette valeur ; elle suit l'exemple de `tauri::test`.
fn app_origin() -> &'static str {
    if cfg!(any(windows, target_os = "android")) {
        "http://tauri.localhost"
    } else {
        "tauri://localhost"
    }
}

/// Fenêtre d'une application neuve (aucun projet ouvert).
fn window() -> WebviewWindow<MockRuntime> {
    let app = cadre_lib::configure(mock_builder())
        .build(mock_context(noop_assets()))
        .unwrap();
    tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap()
}

fn invoke_in(window: &WebviewWindow<MockRuntime>, cmd: &str, args: Value) -> Result<Value, Value> {
    get_ipc_response(
        window,
        InvokeRequest {
            cmd: cmd.into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            url: app_origin().parse().unwrap(),
            body: tauri::ipc::InvokeBody::Json(args),
            headers: Default::default(),
            invoke_key: INVOKE_KEY.to_string(),
        },
    )
    .map(|body| body.deserialize::<Value>().unwrap())
}

/// Appelle la commande `cmd` avec `args` (JSON) comme le ferait l'interface, dans une application
/// neuve (aucun projet ouvert) ; renvoie la réponse JSON, ou l'erreur sérialisée de la commande.
#[allow(dead_code)] // Chaque binaire de test n'utilise pas tous les outils.
pub fn invoke(cmd: &str, args: Value) -> Result<Value, Value> {
    invoke_in(&window(), cmd, args)
}

/// Comme [`invoke`], après avoir ouvert le projet `project` par `ouvrir_projet`, comme le fait
/// l'interface avant toute lecture (US-005, US-076).
#[allow(dead_code)] // Chaque binaire de test n'utilise pas tous les outils.
pub fn invoke_in_open_project(project: &Path, cmd: &str, args: Value) -> Result<Value, Value> {
    let window = window();
    invoke_in(&window, "ouvrir_projet", json!({ "chemin": project })).expect("ouverture du projet");
    invoke_in(&window, cmd, args)
}
