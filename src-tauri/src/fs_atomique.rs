//! Écriture atomique de fichiers du projet (NF-12, NF-13, ADR-001 D6).
//!
//! Une écriture de un ou plusieurs fichiers est une transaction dans
//! `.cadre/tmp/txn-<id>/` (même volume que le projet, donc renommages atomiques) :
//!
//! 1. récupération d'une éventuelle transaction précédente interrompue ;
//! 2. préparation : `<i>.nouveau` (nouveau contenu) et `<i>.ancien` (copie du fichier
//!    actuel s'il existe), chacun synchronisé sur disque (fsync) ;
//! 3. journal `en_cours` (écrit atomiquement) : à partir d'ici, un arrêt brutal est annulé
//!    à la récupération ;
//! 4. remplacement de chaque fichier par renommage de `<i>.nouveau` (remplace la cible sous
//!    Windows comme sous Unix), puis fsync du dossier (Unix) ;
//! 5. journal `validee` : l'enregistrement a réussi ;
//! 6. version précédente copiée dans `.cadre/backups/<chemin>` et index mis à jour ;
//! 7. suppression du dossier de transaction.
//!
//! Erreur avant 5 : les fichiers déjà remplacés sont remis d'origine. Annulation et
//! récupération ne touchent jamais un fichier dont le contenu n'est plus celui écrit par la
//! transaction (modifié par l'utilisateur entre-temps).

pub mod commandes;

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
    for fichier in fichiers {
        valider_chemin(&fichier.chemin)?;
    }
    recuperer(racine)?;
    let transaction = nouveau_dossier_transaction(racine).map_err(classer)?;
    let preparation = preparer(racine, &transaction, fichiers, points).and_then(|entrees| {
        ecrire_journal(&transaction, EtatTransaction::EnCours, &entrees)?;
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
    let remplacement = remplacer(racine, &transaction, &entrees, points)
        .and_then(|()| ecrire_journal(&transaction, EtatTransaction::Validee, &entrees));
    if let Err(erreur) = remplacement {
        // Si l'annulation échoue, le journal reste : la prochaine récupération la reprend.
        annuler(racine, &transaction, &entrees).map_err(classer)?;
        let _ = fs::remove_dir_all(&transaction);
        return Err(classer(erreur));
    }
    // Validée : l'enregistrement a réussi. Si la mise à jour des sauvegardes échoue, le
    // journal reste et la prochaine récupération la termine.
    let sauvegarde = points
        .atteint(Etape::TransactionValidee)
        .and_then(|()| sauvegarder_versions_precedentes(racine, &transaction, &entrees));
    if sauvegarde.is_ok() {
        let _ = fs::remove_dir_all(&transaction);
    }
    Ok(())
}

/// Chemin relatif au projet, segments séparés par `/`, sans `.`, `..`, `\`, `:` ni segment
/// vide, hors des dossiers internes de l'écrivain (`.cadre/tmp`, `.cadre/backups`).
pub fn valider_chemin(chemin: &str) -> Result<(), ErreurEcriture> {
    let segments: Vec<&str> = chemin.split('/').collect();
    let segment_invalide = |segment: &&str| {
        segment.is_empty() || *segment == "." || *segment == ".." || segment.contains(['\\', ':'])
    };
    let interne = [DOSSIER_TMP, DOSSIER_SAUVEGARDES]
        .iter()
        .any(|dossier| chemin == *dossier || chemin.starts_with(&format!("{dossier}/")));
    if segments.iter().any(segment_invalide) || interne {
        return Err(ErreurEcriture::CheminInvalide(chemin.to_owned()));
    }
    Ok(())
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
            match lire_journal(&chemin)? {
                Some(Journal {
                    etat: EtatTransaction::EnCours,
                    entrees,
                }) => annuler(racine, &chemin, &entrees).map_err(classer)?,
                Some(Journal {
                    etat: EtatTransaction::Validee,
                    entrees,
                }) => {
                    sauvegarder_versions_precedentes(racine, &chemin, &entrees).map_err(classer)?
                }
                None => {}
            }
            fs::remove_dir_all(&chemin).map_err(classer)?;
        } else {
            fs::remove_file(&chemin).map_err(classer)?;
        }
    }
    Ok(())
}

const JOURNAL: &str = "journal.json";

/// `EnCours` : des fichiers du projet sont peut-être remplacés, la récupération les remet
/// d'origine. `Validee` : tout est écrit, la récupération termine les sauvegardes.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum EtatTransaction {
    EnCours,
    Validee,
}

#[derive(Debug, Serialize, Deserialize)]
struct Journal {
    etat: EtatTransaction,
    entrees: Vec<Entree>,
}

/// Écrit le journal de la transaction de façon atomique. Tant qu'il est absent, aucun
/// fichier du projet n'a été touché ; présent, il dit comment terminer ou annuler.
fn ecrire_journal(transaction: &Path, etat: EtatTransaction, entrees: &[Entree]) -> io::Result<()> {
    let journal = Journal {
        etat,
        entrees: entrees.to_vec(),
    };
    let provisoire = transaction.join(format!("{JOURNAL}.provisoire"));
    ecrire_et_synchroniser(&provisoire, &serde_json::to_vec_pretty(&journal)?)?;
    fs::rename(&provisoire, transaction.join(JOURNAL))?;
    synchroniser_dossier(transaction)
}

/// Journal d'une transaction interrompue. Un journal illisible est une erreur : supprimer
/// la transaction ferait perdre les copies des fichiers d'origine.
fn lire_journal(transaction: &Path) -> Result<Option<Journal>, ErreurEcriture> {
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
    /// Absente si le fichier n'existait pas avant la transaction.
    empreinte_precedente: Option<String>,
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
        let empreinte_precedente = match fs::read(racine.join(&fichier.chemin)) {
            Ok(ancien) => {
                ecrire_et_synchroniser(&copie_ancienne(transaction, i), &ancien)?;
                Some(empreinte(&ancien))
            }
            Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => None,
            Err(erreur) => return Err(erreur),
        };
        entrees.push(Entree {
            chemin: fichier.chemin.clone(),
            empreinte_precedente,
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
        if entree.empreinte_precedente.is_some() {
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

const DOSSIER_SAUVEGARDES: &str = ".cadre/backups";
const INDEX_SAUVEGARDES: &str = ".cadre/backups/index.yaml";

/// Une ligne de `.cadre/backups/index.yaml` (ADR-001, D6).
#[derive(Debug, Serialize, Deserialize)]
struct EntreeIndex {
    path: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    previous_sha256: Option<String>,
    written_sha256: String,
    date: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct IndexSauvegardes {
    files: Vec<EntreeIndex>,
}

/// Copie la version précédente de chaque fichier remplacé dans `.cadre/backups/<chemin>`
/// (une seule version par fichier, Q-15) et met à jour l'index. Rejouable sans risque.
fn sauvegarder_versions_precedentes(
    racine: &Path,
    transaction: &Path,
    entrees: &[Entree],
) -> io::Result<()> {
    for (i, entree) in entrees.iter().enumerate() {
        if entree.empreinte_precedente.is_some() {
            let sauvegarde = racine.join(DOSSIER_SAUVEGARDES).join(&entree.chemin);
            let contenu = fs::read(copie_ancienne(transaction, i))?;
            remplacer_par(
                &transaction.join(format!("{i}.sauvegarde")),
                &sauvegarde,
                &contenu,
            )?;
        }
    }

    let chemin_index = racine.join(INDEX_SAUVEGARDES);
    // L'index n'est qu'une aide (dossier ignoré par Git) : illisible, il est reconstruit.
    let mut index: IndexSauvegardes = fs::read(&chemin_index)
        .ok()
        .and_then(|octets| serde_json::from_slice(&octets).ok())
        .unwrap_or_default();
    let date = humantime::format_rfc3339_seconds(SystemTime::now()).to_string();
    for entree in entrees {
        index.files.retain(|ligne| ligne.path != entree.chemin);
        index.files.push(EntreeIndex {
            path: entree.chemin.clone(),
            previous_sha256: entree.empreinte_precedente.clone(),
            written_sha256: entree.empreinte_nouvelle.clone(),
            date: date.clone(),
        });
    }
    index.files.sort_by(|a, b| a.path.cmp(&b.path));
    let mut octets = serde_json::to_vec_pretty(&index)?;
    octets.push(b'\n');
    remplacer_par(
        &transaction.join("index.provisoire"),
        &chemin_index,
        &octets,
    )
}

/// Écriture atomique d'un fichier : `provisoire` (même volume), fsync, renommage.
fn remplacer_par(provisoire: &Path, cible: &Path, contenu: &[u8]) -> io::Result<()> {
    let _ = fs::remove_file(provisoire);
    ecrire_et_synchroniser(provisoire, contenu)?;
    let parent = cible.parent().unwrap_or(Path::new("."));
    fs::create_dir_all(parent)?;
    fs::rename(provisoire, cible)?;
    synchroniser_dossier(parent)
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

#[cfg(unix)]
mod codes_systeme {
    /// ENOSPC, EDQUOT (Linux 122, macOS 69).
    pub const DISQUE_PLEIN: &[i32] = &[28, 122, 69];
    /// EROFS.
    pub const LECTURE_SEULE: &[i32] = &[30];
}

#[cfg(windows)]
mod codes_systeme {
    /// ERROR_HANDLE_DISK_FULL, ERROR_DISK_FULL, ERROR_DISK_QUOTA_EXCEEDED.
    pub const DISQUE_PLEIN: &[i32] = &[39, 112, 1295];
    /// ERROR_WRITE_PROTECT.
    pub const LECTURE_SEULE: &[i32] = &[19];
}

fn classer(erreur: io::Error) -> ErreurEcriture {
    let detail = erreur.to_string();
    let code = erreur.raw_os_error().unwrap_or_default();
    if codes_systeme::DISQUE_PLEIN.contains(&code) {
        ErreurEcriture::DisquePlein(detail)
    } else if codes_systeme::LECTURE_SEULE.contains(&code)
        || erreur.kind() == io::ErrorKind::PermissionDenied
    {
        ErreurEcriture::LectureSeule(detail)
    } else {
        ErreurEcriture::Autre(detail)
    }
}
