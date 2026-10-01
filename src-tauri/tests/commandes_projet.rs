//! Intégration : commandes de fichiers du projet telles que les appelle l'interface (US-005).
//! La racine est tenue côté Rust : rien n'est écrit tant que `ouvrir_projet` n'a pas eu lieu,
//! ni ailleurs que dans le projet ouvert (revue B, point 8).

use serde_json::{json, Value};
use tauri::test::{get_ipc_response, mock_builder, mock_context, noop_assets, INVOKE_KEY};
use tauri::webview::InvokeRequest;
use tauri::WebviewWindow;

fn app_origin() -> &'static str {
    if cfg!(any(windows, target_os = "android")) {
        "http://tauri.localhost"
    } else {
        "tauri://localhost"
    }
}

fn fenetre() -> WebviewWindow<tauri::test::MockRuntime> {
    let app = cadre_lib::configure(mock_builder())
        .build(mock_context(noop_assets()))
        .unwrap();
    tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap()
}

fn invoquer(
    fenetre: &WebviewWindow<tauri::test::MockRuntime>,
    commande: &str,
    args: Value,
) -> Result<Value, Value> {
    get_ipc_response(
        fenetre,
        InvokeRequest {
            cmd: commande.into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            url: app_origin().parse().unwrap(),
            body: tauri::ipc::InvokeBody::Json(args),
            headers: Default::default(),
            invoke_key: INVOKE_KEY.to_string(),
        },
    )
    .map(|corps| corps.deserialize::<Value>().unwrap())
}

fn ecrire_claude_md(
    fenetre: &WebviewWindow<tauri::test::MockRuntime>,
    racine: &std::path::Path,
) -> Result<Value, Value> {
    invoquer(
        fenetre,
        "ecrire_fichiers_projet",
        json!({ "racine": racine, "fichiers": [{ "chemin": "CLAUDE.md", "contenu": "# P\n" }] }),
    )
}

#[test]
fn test_securite_ecriture_refusee_tant_qu_aucun_projet_n_est_ouvert() {
    let projet = tempfile::tempdir().unwrap();
    let fenetre = fenetre();

    let reponse = ecrire_claude_md(&fenetre, projet.path());

    assert_eq!(reponse.unwrap_err()["code"], "CHEMIN_INVALIDE");
    assert!(!projet.path().join("CLAUDE.md").exists());
}

#[test]
fn test_ac_005_3_ecriture_dans_le_projet_ouvert_et_refus_ailleurs() {
    let projet = tempfile::tempdir().unwrap();
    let autre = tempfile::tempdir().unwrap();
    let fenetre = fenetre();

    assert_eq!(
        invoquer(
            &fenetre,
            "ouvrir_projet",
            json!({ "chemin": projet.path() })
        ),
        Ok(Value::Null)
    );
    assert_eq!(ecrire_claude_md(&fenetre, projet.path()), Ok(Value::Null));
    let refus = ecrire_claude_md(&fenetre, autre.path());

    assert_eq!(
        std::fs::read_to_string(projet.path().join("CLAUDE.md")).unwrap(),
        "# P\n"
    );
    assert_eq!(refus.unwrap_err()["code"], "CHEMIN_INVALIDE");
    assert!(!autre.path().join("CLAUDE.md").exists());
}
