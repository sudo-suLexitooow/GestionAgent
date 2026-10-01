//! Outils partagés des tests d'intégration : appel d'une commande Tauri par l'IPC simulé.

use serde_json::Value;
use tauri::test::{get_ipc_response, mock_builder, mock_context, noop_assets, INVOKE_KEY};
use tauri::webview::InvokeRequest;

/// Origine de l'interface selon la plateforme : le contrôle d'accès de Tauri refuse une commande
/// venant d'une autre origine. Tauri n'expose pas cette valeur ; elle suit l'exemple de `tauri::test`.
fn app_origin() -> &'static str {
    if cfg!(any(windows, target_os = "android")) {
        "http://tauri.localhost"
    } else {
        "tauri://localhost"
    }
}

/// Appelle la commande `cmd` avec `args` (JSON) comme le ferait l'interface ; renvoie la réponse
/// JSON, ou l'erreur sérialisée de la commande.
pub fn invoke(cmd: &str, args: Value) -> Result<Value, Value> {
    let app = cadre_lib::configure(mock_builder())
        .build(mock_context(noop_assets()))
        .unwrap();
    let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap();
    get_ipc_response(
        &webview,
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
