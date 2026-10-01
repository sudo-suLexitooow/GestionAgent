//! Commandes Tauri exposées à l'interface. Fines : elles délèguent aux modules système.

use crate::folder::{self, FolderStatus};
use std::path::Path;

/// Vérifie qu'un chemin est un dossier existant et lisible, avant d'ouvrir un projet (US-001).
#[tauri::command]
pub fn inspect_folder(path: String) -> FolderStatus {
    folder::inspect_folder(Path::new(&path))
}
