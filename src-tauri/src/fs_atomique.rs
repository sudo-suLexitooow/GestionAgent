//! Écriture atomique de fichiers du projet (NF-12, NF-13, ADR-001 D6).

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
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
    points: &dyn PointsDeControle,
) -> Result<(), ErreurEcriture> {
    recuperer(racine)?;
    let transaction = nouveau_dossier_transaction(racine).map_err(classer)?;
    let preparation = preparer(racine, &transaction, fichiers, points).and_then(|entrees| {
        ecrire_journal(&transaction, &entrees)?;
        points.atteint(Etape::AvantRemplacement)?;
        Ok(entrees)
    });
    let entrees = match preparation {
        Ok(entrees) => entrees,
        Err(erreur) => {
            let _ = fs::remove_dir_all(&transaction);
            return Err(classer(erreur));
        }
    };
    if let Err(erreur) = remplacer(racine, &transaction, &entrees, points) {
        // Si l'annulation échoue, le journal reste : la prochaine récupération la reprend.
        annuler(racine, &transaction, &entrees).map_err(classer)?;
        let _ = fs::remove_dir_all(&transaction);
        return Err(classer(erreur));
    }
    fs::remove_dir_all(&transaction).map_err(classer)
}

/// Termine ou annule une transaction interrompue, puis vide `.cadre/tmp/` (AC-005-4).
///
/// À appeler à l'ouverture du projet ; chaque écriture l'appelle aussi avant de commencer.
pub fn recuperer(racine: &Path) -> Result<(), ErreurEcriture> {
    let contenu = match fs::read_dir(racine.join(DOSSIER_TMP)) {
        Ok(contenu) => contenu,
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(erreur) => return Err(classer(erreur)),
    };
    for element in contenu {
        let chemin = element.map_err(classer)?.path();
        if chemin.is_dir() {
            if let Some(entrees) = lire_journal(&chemin)? {
                annuler(racine, &chemin, &entrees).map_err(classer)?;
            }
            fs::remove_dir_all(&chemin).map_err(classer)?;
        } else {
            fs::remove_file(&chemin).map_err(classer)?;
        }
    }
    Ok(())
}

const JOURNAL: &str = "journal.json";

/// Écrit le journal de la transaction de façon atomique. Tant qu'il est absent, aucun
/// fichier du projet n'a été touché ; présent, il permet d'annuler après un arrêt brutal.
fn ecrire_journal(transaction: &Path, entrees: &[Entree]) -> io::Result<()> {
    let provisoire = transaction.join(format!("{JOURNAL}.provisoire"));
    ecrire_et_synchroniser(&provisoire, &serde_json::to_vec_pretty(entrees)?)?;
    fs::rename(&provisoire, transaction.join(JOURNAL))?;
    synchroniser_dossier(transaction)
}

/// Journal d'une transaction interrompue. Un journal illisible est une erreur : supprimer
/// la transaction ferait perdre les copies des fichiers d'origine.
fn lire_journal(transaction: &Path) -> Result<Option<Vec<Entree>>, ErreurEcriture> {
    let octets = match fs::read(transaction.join(JOURNAL)) {
        Ok(octets) => octets,
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(erreur) => return Err(classer(erreur)),
    };
    serde_json::from_slice(&octets).map(Some).map_err(|erreur| {
        ErreurEcriture::Autre(format!(
            "journal de transaction illisible dans {} : {erreur}",
            transaction.display()
        ))
    })
}

/// Ce que la transaction fait d'un fichier : de quoi l'annuler sans écraser un tiers.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entree {
    chemin: String,
    existait: bool,
    empreinte_nouvelle: String,
}

fn temporaire_nouveau(transaction: &Path, i: usize) -> PathBuf {
    transaction.join(format!("{i}.nouveau"))
}

fn copie_ancienne(transaction: &Path, i: usize) -> PathBuf {
    transaction.join(format!("{i}.ancien"))
}

/// Écrit les nouveaux contenus et une copie des fichiers existants dans la transaction.
fn preparer(
    racine: &Path,
    transaction: &Path,
    fichiers: &[FichierAEcrire],
    points: &dyn PointsDeControle,
) -> io::Result<Vec<Entree>> {
    let mut entrees = Vec::with_capacity(fichiers.len());
    for (i, fichier) in fichiers.iter().enumerate() {
        ecrire_et_synchroniser(&temporaire_nouveau(transaction, i), &fichier.contenu)?;
        points.atteint(Etape::TemporaireEcrit(i))?;
        let existait = match fs::read(racine.join(&fichier.chemin)) {
            Ok(ancien) => {
                ecrire_et_synchroniser(&copie_ancienne(transaction, i), &ancien)?;
                true
            }
            Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => false,
            Err(erreur) => return Err(erreur),
        };
        entrees.push(Entree {
            chemin: fichier.chemin.clone(),
            existait,
            empreinte_nouvelle: empreinte(&fichier.contenu),
        });
    }
    synchroniser_dossier(transaction)?;
    Ok(entrees)
}

fn remplacer(
    racine: &Path,
    transaction: &Path,
    entrees: &[Entree],
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    for (i, entree) in entrees.iter().enumerate() {
        let cible = racine.join(&entree.chemin);
        if let Some(parent) = cible.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::rename(temporaire_nouveau(transaction, i), &cible)?;
        synchroniser_dossier(cible.parent().unwrap_or(racine))?;
        points.atteint(Etape::FichierRemplace(i))?;
    }
    Ok(())
}

/// Remet chaque fichier remplacé par la transaction dans son état d'origine. Un fichier
/// dont le contenu n'est plus celui écrit par la transaction n'est jamais touché.
fn annuler(racine: &Path, transaction: &Path, entrees: &[Entree]) -> io::Result<()> {
    for (i, entree) in entrees.iter().enumerate().rev() {
        let cible = racine.join(&entree.chemin);
        let actuel = match fs::read(&cible) {
            Ok(contenu) => contenu,
            Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => continue,
            Err(erreur) => return Err(erreur),
        };
        if empreinte(&actuel) != entree.empreinte_nouvelle {
            continue;
        }
        let ancien = copie_ancienne(transaction, i);
        if entree.existait {
            if ancien.exists() {
                fs::rename(&ancien, &cible)?;
            }
        } else {
            fs::remove_file(&cible)?;
        }
        synchroniser_dossier(cible.parent().unwrap_or(racine))?;
    }
    Ok(())
}

fn empreinte(contenu: &[u8]) -> String {
    Sha256::digest(contenu)
        .iter()
        .map(|octet| format!("{octet:02x}"))
        .collect()
}

static COMPTEUR: AtomicU64 = AtomicU64::new(0);

fn nouveau_dossier_transaction(racine: &Path) -> io::Result<PathBuf> {
    let horodatage = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    let numero = COMPTEUR.fetch_add(1, Ordering::Relaxed);
    let dossier = racine
        .join(DOSSIER_TMP)
        .join(format!("txn-{}-{horodatage}-{numero}", std::process::id()));
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
