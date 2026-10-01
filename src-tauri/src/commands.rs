//! Commandes Tauri exposées à l'interface. Fines : elles délèguent aux modules système.

use crate::folder::{self, FolderStatus};
use crate::project_files::{self, DirEntry, ReadError};
use std::path::Path;

/// Vérifie qu'un chemin est un dossier existant et lisible, avant d'ouvrir un projet (US-001).
#[tauri::command]
pub fn inspect_folder(path: String) -> FolderStatus {
    folder::inspect_folder(Path::new(&path))
}

// Les commandes de lecture sont asynchrones (`async`) : Tauri les exécute hors du fil principal,
// une lecture lente (disque réseau, gros dossier) ne gèle donc pas l'interface.
// `root` vient de l'interface et n'est pas contrôlé ici (voir `project_files`).

/// Liste un dossier du projet `root` (`path` relatif à la racine) ; `null` s'il n'existe pas (US-002).
#[tauri::command(async)]
pub fn list_project_dir(root: String, path: String) -> Result<Option<Vec<DirEntry>>, ReadError> {
    project_files::list_dir(Path::new(&root), &path)
}

/// Lit un fichier du projet `root` en octets bruts ; `null` s'il n'existe pas (US-002).
#[tauri::command(async)]
pub fn read_project_file(root: String, path: String) -> Result<Option<Vec<u8>>, ReadError> {
    project_files::read_file(Path::new(&root), &path)
}
