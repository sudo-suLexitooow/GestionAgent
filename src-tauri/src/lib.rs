//! Opérations système de Cadre : fichiers, surveillance, processus, terminal, Git, trousseau.
//! La logique métier reste en TypeScript.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Cadre");
}
