//! Vérification d'un dossier de projet avant son ouverture (PRJ-01).

use serde::Serialize;
use std::path::Path;

/// État d'un chemin, sérialisé comme le type TypeScript `FolderStatus` de `src/core/project/ports.ts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum FolderStatus {
    Ok,
    NotFound,
    NotADirectory,
    Unreadable,
}

/// Indique si `path` est un dossier existant et lisible.
pub fn inspect_folder(path: &Path) -> FolderStatus {
    match std::fs::read_dir(path) {
        Ok(_) => FolderStatus::Ok,
        Err(_) => FolderStatus::NotFound,
    }
}
