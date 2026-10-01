//! Vérification d'un dossier de projet avant son ouverture (PRJ-01).

use serde::Serialize;
use std::io::ErrorKind;
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
    match std::fs::metadata(path) {
        Err(error) => status_for_error(error.kind()),
        Ok(metadata) if !metadata.is_dir() => FolderStatus::NotADirectory,
        Ok(_) => match std::fs::read_dir(path) {
            Ok(_) => FolderStatus::Ok,
            Err(error) => status_for_error(error.kind()),
        },
    }
}

/// Traduit une erreur d'accès en état affichable : seule l'absence du chemin est « inexistant »,
/// toute autre erreur (droits insuffisants, verrou, support débranché…) rend le dossier illisible.
fn status_for_error(kind: ErrorKind) -> FolderStatus {
    match kind {
        ErrorKind::NotFound => FolderStatus::NotFound,
        _ => FolderStatus::Unreadable,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ac_001_4_acces_refuse_signifie_illisible() {
        assert_eq!(
            status_for_error(ErrorKind::PermissionDenied),
            FolderStatus::Unreadable
        );
    }

    #[test]
    fn test_ac_001_4_chemin_absent_signifie_inexistant() {
        assert_eq!(
            status_for_error(ErrorKind::NotFound),
            FolderStatus::NotFound
        );
    }
}
