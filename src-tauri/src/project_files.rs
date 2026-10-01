//! Lecture seule du contenu d'un projet (SKL-01, PRJ-02) : lister un dossier, lire un fichier en
//! octets bruts. Le chemin relatif ne peut pas sortir de la racine fournie (pas de `..`, pas de
//! chemin absolu). Limites connues : la racine elle-même, fournie par l'interface, n'est pas
//! contrôlée ici (elle sera tenue côté Rust par une story de suivi), et les liens symboliques sont
//! suivis (skills partagées par lien), y compris hors de la racine. Lecture seule.

use serde::Serialize;
use std::io::{ErrorKind, Read};
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
    TooLarge,
}

/// Taille maximale d'un fichier lu (8 Mio) : au-delà, la lecture est refusée (`TooLarge`).
pub const MAX_FILE_SIZE: u64 = 8 * 1024 * 1024;

/// Chemin de `relative` sous `root`. Refuse un chemin absolu, une racine ou un préfixe de lecteur
/// (Windows) et tout segment `..` : le chemin relatif ne sort pas de la racine fournie. Ni `root`
/// ni les liens symboliques rencontrés ne sont contrôlés.
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

/// Liste le dossier `relative` du projet `root` ; `None` s'il n'existe pas ou si ce n'est pas un
/// dossier (un fichier `.cadre` n'est pas un modèle, un fichier `.claude/skills` ne contient aucune skill).
pub fn list_dir(root: &Path, relative: &str) -> Result<Option<Vec<DirEntry>>, ReadError> {
    let path = resolve(root, relative)?;
    if kind_of(&path) == EntryKind::File {
        return Ok(None);
    }
    let reader = match std::fs::read_dir(path) {
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
/// Seul un fichier ordinaire (éventuellement atteint par un lien) est lu : un dossier, une FIFO ou un
/// périphérique (`/dev/zero`) est refusé avant toute ouverture, pour ne jamais bloquer ni lire sans fin.
/// Au-delà de `MAX_FILE_SIZE`, la lecture est refusée (`TooLarge`).
pub fn read_file(root: &Path, relative: &str) -> Result<Option<Vec<u8>>, ReadError> {
    let path = resolve(root, relative)?;
    let metadata = match std::fs::metadata(&path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err(ReadError::Unreadable),
    };
    if !metadata.is_file() {
        return Err(ReadError::Unreadable);
    }
    if metadata.len() > MAX_FILE_SIZE {
        return Err(ReadError::TooLarge);
    }
    // Le fichier peut grossir entre la vérification et la lecture : la lecture reste bornée.
    let file = std::fs::File::open(&path).map_err(|_| ReadError::Unreadable)?;
    let mut bytes = Vec::new();
    file.take(MAX_FILE_SIZE + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| ReadError::Unreadable)?;
    if bytes.len() as u64 > MAX_FILE_SIZE {
        return Err(ReadError::TooLarge);
    }
    Ok(Some(bytes))
}
