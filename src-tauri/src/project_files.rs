//! Lecture seule du contenu d'un projet (SKL-01, PRJ-02) : lister un dossier, lire un fichier en
//! octets bruts. Les chemins sont relatifs à la racine du projet et ne peuvent pas en sortir.

use serde::Serialize;
use std::path::Path;

/// Nature d'une entrée de dossier, sérialisée comme le type TypeScript `EntryKind`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum EntryKind {
    File,
    Directory,
    Other,
}

/// Entrée d'un dossier, sérialisée comme le type TypeScript `DirEntry`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub kind: EntryKind,
}

/// Échec de lecture, sérialisé comme le type TypeScript `ReadError`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReadError {
    OutsideProject,
    Unreadable,
}

/// Liste le dossier `relative` du projet `root` ; `None` s'il n'existe pas.
pub fn list_dir(_root: &Path, _relative: &str) -> Result<Option<Vec<DirEntry>>, ReadError> {
    Err(ReadError::Unreadable)
}
