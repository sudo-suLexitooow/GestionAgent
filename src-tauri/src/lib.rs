//! Opérations système de Cadre : fichiers, surveillance, processus, terminal, Git, trousseau.
//! La logique métier reste en TypeScript.

pub mod folder;

use tauri::{Builder, Runtime};

/// Branche plugins et commandes sur un constructeur d'application (réel ou simulé en test).
pub fn configure<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder
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
