//! Lecture seule du contenu du projet ouvert (SKL-01, PRJ-02, US-076) : lister un dossier, lire
//! un fichier en octets bruts.
//!
//! Portée : la racine est celle du projet ouvert par `ouvrir_projet` (état [`ProjetOuvert`],
//! chemin canonique) ; une autre racine, ou aucun projet ouvert, est refusée (`OutsideProject`).
//! Dans le projet, chaque chemin passe par la résolution sûre de [`Projet::reel`] : règle R1 sur
//! chaque segment (`..`, chemin absolu, préfixes et noms réservés Windows → `OutsideProject`),
//! aucun lien symbolique ni jonction suivi, ni sur la cible ni sur un dossier parent (`Link`),
//! même s'il reste dans le projet. Seul un fichier ordinaire de `MAX_FILE_SIZE` au plus est lu.

use crate::fs_atomique::acces::{genre_de_refus, Genre, Motif, Projet};
use crate::fs_atomique::commandes::{racine_autorisee, ProjetOuvert};
use serde::Serialize;
use std::io;
use std::path::Path;

/// Nature d'une entrée de dossier, sérialisée comme le type TypeScript `EntryKind`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum EntryKind {
    File,
    Directory,
    /// Lien symbolique ou jonction : jamais suivi (US-076).
    Link,
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
    /// Aucun projet ouvert, autre racine, ou chemin refusé par la règle R1.
    OutsideProject,
    Unreadable,
    TooLarge,
    /// Le chemin passe par un lien symbolique ou une jonction, non suivi (US-076).
    Link,
}

/// Taille maximale d'un fichier lu (8 Mio) : au-delà, la lecture est refusée (`TooLarge`).
pub const MAX_FILE_SIZE: u64 = 8 * 1024 * 1024;

/// Projet ouvert si `root` le désigne (après canonicalisation) ; sinon `OutsideProject`.
fn open_project(etat: &ProjetOuvert, root: &Path) -> Result<Projet, ReadError> {
    let root = root.to_str().ok_or(ReadError::OutsideProject)?;
    let racine = racine_autorisee(etat, root).map_err(|_| ReadError::OutsideProject)?;
    Ok(Projet::new(&racine))
}

fn read_error(erreur: io::Error) -> ReadError {
    match genre_de_refus(&erreur) {
        Some(Motif::Segment) => ReadError::OutsideProject,
        Some(Motif::Lien) => ReadError::Link,
        Some(Motif::Taille) => ReadError::TooLarge,
        Some(Motif::Nature) | None => ReadError::Unreadable,
    }
}

/// Liste le dossier `relative` du projet ouvert ; `None` s'il n'existe pas ou si c'est un
/// fichier (un fichier `.cadre` n'est pas un modèle, un fichier `.claude/skills` ne contient
/// aucune skill). La nature des entrées est lue sans suivre les liens.
pub fn list_dir(
    etat: &ProjetOuvert,
    root: &Path,
    relative: &str,
) -> Result<Option<Vec<DirEntry>>, ReadError> {
    let projet = open_project(etat, root)?;
    match projet.genre(relative).map_err(read_error)? {
        None | Some(Genre::Fichier) => return Ok(None),
        Some(Genre::Dossier) => {}
        Some(Genre::Lien) => return Err(ReadError::Link),
        Some(Genre::Autre) => return Err(ReadError::Unreadable),
    }
    let entries = projet.lister(relative).map_err(read_error)?;
    Ok(Some(
        entries
            .into_iter()
            .map(|(name, genre)| DirEntry {
                name,
                kind: match genre {
                    Genre::Fichier => EntryKind::File,
                    Genre::Dossier => EntryKind::Directory,
                    Genre::Lien => EntryKind::Link,
                    Genre::Autre => EntryKind::Other,
                },
            })
            .collect(),
    ))
}

/// Lit le fichier `relative` du projet ouvert en octets bruts ; `None` s'il n'existe pas.
/// Seul un fichier ordinaire est lu : un dossier, une FIFO ou un périphérique est refusé avant
/// toute ouverture. Au-delà de `MAX_FILE_SIZE`, même s'il grossit pendant la lecture : `TooLarge`.
pub fn read_file(
    etat: &ProjetOuvert,
    root: &Path,
    relative: &str,
) -> Result<Option<Vec<u8>>, ReadError> {
    open_project(etat, root)?
        .lire_au_plus(relative, MAX_FILE_SIZE)
        .map_err(read_error)
}
