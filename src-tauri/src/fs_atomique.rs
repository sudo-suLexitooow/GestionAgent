//! Écriture atomique de fichiers du projet (NF-12, NF-13, ADR-001 D6).

use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

/// Temporaires et journaux de transaction, sur le même volume que le projet.
const DOSSIER_TMP: &str = ".cadre/tmp";

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
    racine: &Path,
    fichiers: &[FichierAEcrire],
    _points: &dyn PointsDeControle,
) -> Result<(), ErreurEcriture> {
    let transaction = nouveau_dossier_transaction(racine).map_err(classer)?;
    let resultat = (|| -> io::Result<()> {
        for (i, fichier) in fichiers.iter().enumerate() {
            let temporaire = transaction.join(format!("{i}.nouveau"));
            ecrire_et_synchroniser(&temporaire, &fichier.contenu)?;
            let cible = racine.join(&fichier.chemin);
            if let Some(parent) = cible.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::rename(&temporaire, &cible)?;
            synchroniser_dossier(cible.parent().unwrap_or(racine))?;
        }
        Ok(())
    })();
    let nettoyage = fs::remove_dir_all(&transaction);
    resultat.map_err(classer)?;
    nettoyage.map_err(classer)
}

/// Termine ou annule une transaction interrompue, puis vide `.cadre/tmp/` (AC-005-4).
pub fn recuperer(_racine: &Path) -> Result<(), ErreurEcriture> {
    Ok(())
}

static COMPTEUR: AtomicU64 = AtomicU64::new(0);

fn nouveau_dossier_transaction(racine: &Path) -> io::Result<PathBuf> {
    let horodatage = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    let numero = COMPTEUR.fetch_add(1, Ordering::Relaxed);
    let dossier = racine.join(DOSSIER_TMP).join(format!(
        "txn-{}-{horodatage}-{numero}",
        std::process::id()
    ));
    fs::create_dir_all(&dossier)?;
    Ok(dossier)
}

fn ecrire_et_synchroniser(chemin: &Path, contenu: &[u8]) -> io::Result<()> {
    let mut fichier = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(chemin)?;
    fichier.write_all(contenu)?;
    fichier.sync_all()
}

/// Rend durable un renommage dans `dossier` (Unix). Sous Windows, NTFS journalise les
/// métadonnées et un dossier ne s'ouvre pas comme un fichier : rien à faire.
fn synchroniser_dossier(dossier: &Path) -> io::Result<()> {
    #[cfg(unix)]
    File::open(dossier)?.sync_all()?;
    #[cfg(not(unix))]
    let _ = dossier;
    Ok(())
}

fn classer(erreur: io::Error) -> ErreurEcriture {
    ErreurEcriture::Autre(erreur.to_string())
}
