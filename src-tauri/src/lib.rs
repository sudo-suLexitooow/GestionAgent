//! Opérations système de Cadre : fichiers, surveillance, processus, terminal, Git, trousseau.
//! La logique métier reste en TypeScript.

mod commands;
pub mod folder;
pub mod project_files;

use tauri::{Builder, Runtime};

/// Branche plugins et commandes sur un constructeur d'application (réel ou simulé en test).
pub fn configure<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::inspect_folder,
            commands::list_project_dir,
            commands::read_project_file
        ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    configure(tauri::Builder::default())
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Cadre");
}

#[cfg(test)]
mod tests {
    // Test de fumée du Sprint 0 : prouve que le harnais `cargo test` tourne sur les 3 OS.
    #[test]
    fn harnais_de_test_operationnel() {
        assert_eq!(env!("CARGO_PKG_NAME"), "cadre");
    }
}
