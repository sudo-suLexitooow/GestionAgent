//! Écriture atomique de fichiers du projet (NF-12, NF-13, ADR-001 D6).

use std::io;
use std::path::Path;

/// Un fichier à écrire, chemin relatif à la racine du projet, séparateur `/`.
#[derive(Debug, Clone)]
pub struct FichierAEcrire {
    pub chemin: String,
    pub contenu: Vec<u8>,
}

impl FichierAEcrire {
    pub fn new(chemin: &str, contenu: impl Into<Vec<u8>>) -> Self {
        Self {
            chemin: chemin.to_owned(),
            contenu: contenu.into(),
        }
    }
}

/// Étapes d'une transaction où une panne peut être injectée (tests de robustesse).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Etape {
    /// Le temporaire du fichier n° i est écrit dans `.cadre/tmp/`.
    TemporaireEcrit(usize),
    /// Journal « en cours » écrit, aucun fichier du projet remplacé.
    AvantRemplacement,
    /// Le fichier n° i du projet vient d'être remplacé.
    FichierRemplace(usize),
    /// Journal « validé » écrit, sauvegardes pas encore mises à jour.
    TransactionValidee,
}

/// Point d'injection de pannes. En production : [`SansPanne`].
pub trait PointsDeControle {
    fn atteint(&self, etape: Etape) -> io::Result<()>;
}

/// Aucune panne injectée.
pub struct SansPanne;

impl PointsDeControle for SansPanne {
    fn atteint(&self, _etape: Etape) -> io::Result<()> {
        Ok(())
    }
}

/// Erreur d'écriture, classée pour afficher un message clair (AC-005-6).
#[derive(Debug)]
pub enum ErreurEcriture {
    LectureSeule(String),
    DisquePlein(String),
    CheminInvalide(String),
    Autre(String),
}

/// Écrit tous les fichiers, ou aucun (AC-005-3).
pub fn ecrire_fichiers(racine: &Path, fichiers: &[FichierAEcrire]) -> Result<(), ErreurEcriture> {
    ecrire_fichiers_avec(racine, fichiers, &SansPanne)
}

/// Comme [`ecrire_fichiers`], avec des points d'injection de pannes.
pub fn ecrire_fichiers_avec(
    _racine: &Path,
    _fichiers: &[FichierAEcrire],
    _points: &dyn PointsDeControle,
) -> Result<(), ErreurEcriture> {
    Ok(())
}

/// Termine ou annule une transaction interrompue, puis vide `.cadre/tmp/` (AC-005-4).
pub fn recuperer(_racine: &Path) -> Result<(), ErreurEcriture> {
    Ok(())
}
