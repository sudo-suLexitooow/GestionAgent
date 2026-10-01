//! Lecture seule du contenu d'un projet (SKL-01, PRJ-02) : lister un dossier, lire un fichier en
//! octets bruts. Les chemins sont relatifs à la racine du projet et ne peuvent pas en sortir.

use serde::Serialize;
use std::io::ErrorKind;
use std::path::{Component, Path, PathBuf};

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

/// Chemin absolu de `relative` sous `root`. Refuse un chemin absolu, une racine ou un préfixe de
/// lecteur (Windows) et tout segment `..` : rien ne peut être lu hors du projet par ce chemin.
fn resolve(root: &Path, relative: &str) -> Result<PathBuf, ReadError> {
    let relative = Path::new(relative);
    let stays_inside = relative
        .components()
        .all(|component| matches!(component, Component::Normal(_) | Component::CurDir));
    if stays_inside {
        Ok(root.join(relative))
    } else {
        Err(ReadError::OutsideProject)
    }
}

/// Liste le dossier `relative` du projet `root` ; `None` s'il n'existe pas.
pub fn list_dir(root: &Path, relative: &str) -> Result<Option<Vec<DirEntry>>, ReadError> {
    let reader = match std::fs::read_dir(resolve(root, relative)?) {
        Ok(reader) => reader,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err(ReadError::Unreadable),
    };
    let mut entries = Vec::new();
    for entry in reader {
        let entry = entry.map_err(|_| ReadError::Unreadable)?;
        entries.push(DirEntry {
            name: entry.file_name().to_string_lossy().into_owned(),
            kind: kind_of(&entry.path()),
        });
    }
    Ok(Some(entries))
}

/// Nature d'une entrée, en suivant les liens symboliques (une skill peut être un lien vers un dossier).
fn kind_of(path: &Path) -> EntryKind {
    match std::fs::metadata(path) {
        Ok(metadata) if metadata.is_dir() => EntryKind::Directory,
        Ok(metadata) if metadata.is_file() => EntryKind::File,
        _ => EntryKind::Other,
    }
}

/// Lit le fichier `relative` du projet `root` en octets bruts ; `None` s'il n'existe pas.
pub fn read_file(root: &Path, relative: &str) -> Result<Option<Vec<u8>>, ReadError> {
    match std::fs::read(resolve(root, relative)?) {
        Ok(bytes) => Ok(Some(bytes)),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(None),
        Err(_) => Err(ReadError::Unreadable),
    }
}
