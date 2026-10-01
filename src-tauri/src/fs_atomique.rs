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
use std::fs::{self, OpenOptions};
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
    /// Journal supprimé, dossier de transaction pas encore effacé.
    JournalSupprime,
    /// Journal « validé » écrit dans son fichier provisoire, pas encore renommé.
    JournalValideProvisoire,
    /// Annulation : le fichier n° i vient d'être remis dans son état d'origine.
    FichierRestaure(usize),
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
    /// Une transaction interrompue ne peut pas être reprise sans risque : elle est mise de
    /// côté, rien n'est supprimé ; le détail indique le dossier à examiner.
    RecuperationImpossible(String),
    /// L'enregistrement a échoué et son annulation aussi : des fichiers peuvent être
    /// modifiés ; la récupération suivante termine l'annulation.
    AnnulationIncomplete(String),
    /// Une autre instance de Cadre écrit ou récupère déjà dans ce projet.
    ProjetOccupe,
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
        parents_reels(racine, &fichier.chemin)?;
    }
    sans_doublon(fichiers)?;
    dossiers_internes_reels(racine)?;
    let cadre_cree = !racine.join(".cadre").exists();
    fs::create_dir_all(racine.join(DOSSIER_TMP)).map_err(classer)?;
    dossiers_internes_reels(racine)?;
    let verrou = verrouiller_projet(racine)?;
    // Échec : un `.cadre/` créé par cette écriture est retiré (projet strictement identique).
    let echec = |erreur: ErreurEcriture, verrou: fs::File| {
        if cadre_cree {
            drop(verrou);
            retirer_cadre_vide(racine);
        }
        Err(erreur)
    };
    if let Err(erreur) = recuperer_sous_verrou(racine, points) {
        return echec(erreur, verrou);
    }
    let transaction = match nouveau_dossier_transaction(racine) {
        Ok(transaction) => transaction,
        Err(erreur) => return echec(classer(erreur), verrou),
    };
    let preparation = preparer(racine, &transaction, fichiers, points).and_then(|plan| {
        ecrire_journal(&transaction, EtatTransaction::EnCours, &plan, points)?;
        points.atteint(Etape::AvantRemplacement)?;
        Ok(plan)
    });
    let plan = match preparation {
        Ok(plan) => plan,
        Err(erreur) => {
            let _ = fs::remove_dir_all(&transaction);
            return echec(classer(erreur), verrou);
        }
    };
    let remplacement = remplacer(racine, &transaction, &plan.entrees, points)
        .and_then(|()| ecrire_journal(&transaction, EtatTransaction::Validee, &plan, points));
    if let Err(erreur) = remplacement {
        // Si l'annulation échoue, le journal reste : la prochaine récupération la reprend.
        if let Err(echec) = annuler(racine, &transaction, &plan, points) {
            return Err(ErreurEcriture::AnnulationIncomplete(format!(
                "{erreur} ; annulation interrompue : {echec}"
            )));
        }
        let _ = nettoyer_transaction(&transaction, &SansPanne);
        return echec(classer(erreur), verrou);
    }
    let entrees = plan.entrees;
    // Validée : l'enregistrement a réussi. Interrompu ici, le journal reste et la
    // récupération termine les sauvegardes ; une sauvegarde impossible est abandonnée
    // (jamais de blocage des écritures suivantes).
    if points.atteint(Etape::TransactionValidee).is_ok() {
        let _ = sauvegarder_versions_precedentes(racine, &transaction, &entrees);
        let _ = nettoyer_transaction(&transaction, points);
    }
    Ok(())
}

/// Retire `.cadre/tmp/verrou`, `.cadre/tmp` et `.cadre` s'ils sont vides (créés par une
/// écriture qui a échoué).
fn retirer_cadre_vide(racine: &Path) {
    let _ = fs::remove_file(racine.join(VERROU));
    let _ = fs::remove_dir(racine.join(DOSSIER_TMP));
    let _ = fs::remove_dir(racine.join(".cadre"));
}

/// Supprime le journal d'abord : un arrêt pendant l'effacement du dossier laisse une
/// transaction sans journal, simplement effacée à la récupération suivante.
fn nettoyer_transaction(transaction: &Path, points: &dyn PointsDeControle) -> io::Result<()> {
    match fs::remove_file(transaction.join(JOURNAL)) {
        Ok(()) => synchroniser_dossier(transaction)?,
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => {}
        Err(erreur) => return Err(erreur),
    }
    points.atteint(Etape::JournalSupprime)?;
    fs::remove_dir_all(transaction)
}

/// Chemin relatif au projet, segments séparés par `/`, sans `.`, `..`, `\`, `:` ni segment
/// vide, hors des dossiers internes de l'écrivain (`.cadre/tmp`, `.cadre/backups`).
pub fn valider_chemin(chemin: &str) -> Result<(), ErreurEcriture> {
    let minuscules = chemin.to_lowercase();
    let interne = [DOSSIER_TMP, DOSSIER_SAUVEGARDES]
        .iter()
        .any(|dossier| minuscules == *dossier || minuscules.starts_with(&format!("{dossier}/")));
    if chemin.split('/').any(|segment| !segment_portable(segment)) || interne {
        return Err(ErreurEcriture::CheminInvalide(chemin.to_owned()));
    }
    Ok(())
}

/// Chemin de lecture : relatif au projet, sans `.`, `..`, segment vide, `\` ni `:`.
pub fn valider_chemin_relatif(chemin: &str) -> Result<(), ErreurEcriture> {
    let invalide = |segment: &str| {
        segment.is_empty() || segment == "." || segment == ".." || segment.contains(['\\', ':'])
    };
    if chemin.split('/').any(invalide) {
        return Err(ErreurEcriture::CheminInvalide(chemin.to_owned()));
    }
    Ok(())
}

/// Règle R1 d'ADR-001 (D4) : nom valide sous Windows, macOS et Linux, et jamais `.git`
/// (un hook écrit dans `.git/hooks/` serait exécuté par Git).
fn segment_portable(segment: &str) -> bool {
    const INTERDITS: [char; 9] = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let base = segment
        .split('.')
        .next()
        .unwrap_or_default()
        .trim_end()
        .to_uppercase();
    let reserve = matches!(base.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || ["COM", "LPT"].iter().any(|prefixe| {
            base.strip_prefix(prefixe).is_some_and(|suffixe| {
                matches!(
                    suffixe,
                    "0" | "1"
                        | "2"
                        | "3"
                        | "4"
                        | "5"
                        | "6"
                        | "7"
                        | "8"
                        | "9"
                        | "\u{b9}"
                        | "\u{b2}"
                        | "\u{b3}"
                )
            })
        });
    !segment.is_empty()
        && segment != "."
        && segment != ".."
        && !segment.ends_with(['.', ' '])
        && !segment
            .chars()
            .any(|c| INTERDITS.contains(&c) || c.is_control())
        && !segment.eq_ignore_ascii_case(".git")
        && !reserve
}

/// Un même fichier (casse comprise : NTFS et APFS l'ignorent) une seule fois par lot.
fn sans_doublon(fichiers: &[FichierAEcrire]) -> Result<(), ErreurEcriture> {
    let mut vus = std::collections::HashSet::new();
    for fichier in fichiers {
        if !vus.insert(fichier.chemin.to_lowercase()) {
            return Err(ErreurEcriture::CheminInvalide(format!(
                "{} figure deux fois dans l'enregistrement",
                fichier.chemin
            )));
        }
    }
    Ok(())
}

/// Termine ou annule une transaction interrompue, puis vide `.cadre/tmp/` (AC-005-4).
///
/// À appeler à l'ouverture du projet ; chaque écriture l'appelle aussi avant de commencer.
pub fn recuperer(racine: &Path) -> Result<(), ErreurEcriture> {
    recuperer_avec(racine, &SansPanne)
}

/// Comme [`recuperer`], avec des points d'injection de pannes.
pub fn recuperer_avec(racine: &Path, points: &dyn PointsDeControle) -> Result<(), ErreurEcriture> {
    if !dossiers_internes_reels(racine)? {
        return Ok(());
    }
    let _verrou = verrouiller_projet(racine)?;
    recuperer_sous_verrou(racine, points)
}

const VERROU: &str = ".cadre/tmp/verrou";

/// Verrou de fichier exclusif du système (libéré par l'OS si le processus meurt), tenu
/// pendant toute écriture et toute récupération : deux instances de Cadre ne peuvent pas
/// travailler en même temps sur le même projet.
fn verrouiller_projet(racine: &Path) -> Result<fs::File, ErreurEcriture> {
    let chemin = racine.join(VERROU);
    match fs::symlink_metadata(&chemin) {
        Ok(meta) if !meta.is_file() => {
            return Err(ErreurEcriture::CheminInvalide(format!(
                "{VERROU} n'est pas un fichier ordinaire"
            )))
        }
        Ok(_) => {}
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => {}
        Err(erreur) => return Err(classer(erreur)),
    }
    let fichier = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(&chemin)
        .map_err(classer)?;
    match fichier.try_lock() {
        Ok(()) => Ok(fichier),
        Err(fs::TryLockError::WouldBlock) => Err(ErreurEcriture::ProjetOccupe),
        Err(fs::TryLockError::Error(erreur)) => Err(classer(erreur)),
    }
}

fn recuperer_sous_verrou(
    racine: &Path,
    points: &dyn PointsDeControle,
) -> Result<(), ErreurEcriture> {
    let contenu = match fs::read_dir(racine.join(DOSSIER_TMP)) {
        Ok(contenu) => contenu,
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => return Ok(()),
        Err(erreur) => return Err(classer(erreur)),
    };
    for element in contenu {
        let element = element.map_err(classer)?;
        // `file_type` ne suit pas les liens : un lien n'est ni suivi ni supprimé.
        let genre = element.file_type().map_err(classer)?;
        let chemin = element.path();
        let nom = element.file_name();
        if genre.is_file() && nom != "verrou" {
            fs::remove_file(&chemin).map_err(classer)?;
        } else if genre.is_dir() && nom.to_string_lossy().starts_with("txn-") {
            let journal = match lire_journal(&chemin)? {
                Ok(journal) => journal,
                Err(raison) => return Err(mettre_de_cote(&chemin, &raison)),
            };
            if let Some(journal) = &journal {
                if let Err(raison) = verifier_plan(racine, &journal.plan) {
                    return Err(mettre_de_cote(&chemin, &raison));
                }
            }
            match journal {
                Some(Journal {
                    etat: EtatTransaction::EnCours,
                    plan,
                }) => annuler(racine, &chemin, &plan, points).map_err(|erreur| {
                    ErreurEcriture::AnnulationIncomplete(format!(
                        "reprise de {} : {erreur}",
                        chemin.display()
                    ))
                })?,
                Some(Journal {
                    etat: EtatTransaction::Validee,
                    plan,
                }) => {
                    // L'enregistrement est déjà validé : une sauvegarde impossible est
                    // abandonnée plutôt que de bloquer toutes les écritures suivantes.
                    let _ = sauvegarder_versions_precedentes(racine, &chemin, &plan.entrees);
                }
                None => {}
            }
            nettoyer_transaction(&chemin, &SansPanne).map_err(classer)?;
        }
    }
    Ok(())
}

/// Dossiers internes de l'écrivain, du plus haut au plus profond.
const DOSSIERS_INTERNES: [&str; 3] = [".cadre", ".cadre/tmp", ".cadre/backups"];

/// Vérifie que les dossiers internes existants sont de vrais dossiers : ni lien symbolique,
/// ni jonction Windows (un dépôt malveillant pourrait les faire pointer hors du projet).
/// Renvoie `true` si `.cadre/tmp` existe.
fn dossiers_internes_reels(racine: &Path) -> Result<bool, ErreurEcriture> {
    let mut tmp_existe = false;
    for dossier in DOSSIERS_INTERNES {
        match fs::symlink_metadata(racine.join(dossier)) {
            Ok(meta) if meta.is_dir() && !meta.file_type().is_symlink() => {
                tmp_existe |= dossier == DOSSIER_TMP;
            }
            Ok(_) => {
                return Err(ErreurEcriture::CheminInvalide(format!(
                    "{dossier} n'est pas un vrai dossier (lien symbolique, jonction ou fichier) : \
                     Cadre refuse d'y écrire"
                )))
            }
            Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => {}
            Err(erreur) => return Err(classer(erreur)),
        }
    }
    Ok(tmp_existe)
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
    #[serde(flatten)]
    plan: Plan,
}

/// Ce que fait la transaction : les fichiers écrits et les dossiers qu'elle crée (retirés
/// à l'annulation s'ils sont vides).
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Plan {
    entrees: Vec<Entree>,
    #[serde(default)]
    dossiers_crees: Vec<String>,
}

/// Écrit le journal de la transaction de façon atomique. Tant qu'il est absent, aucun
/// fichier du projet n'a été touché ; présent, il dit comment terminer ou annuler.
fn ecrire_journal(
    transaction: &Path,
    etat: EtatTransaction,
    plan: &Plan,
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    let journal = Journal {
        etat,
        plan: plan.clone(),
    };
    let provisoire = transaction.join(format!("{JOURNAL}.provisoire"));
    ecrire_et_synchroniser(&provisoire, &serde_json::to_vec_pretty(&journal)?)?;
    if matches!(etat, EtatTransaction::Validee) {
        points.atteint(Etape::JournalValideProvisoire)?;
    }
    fs::rename(&provisoire, transaction.join(JOURNAL))?;
    synchroniser_dossier(transaction)
}

/// Journal d'une transaction interrompue : `Ok(Err(raison))` s'il est illisible.
fn lire_journal(transaction: &Path) -> Result<Result<Option<Journal>, String>, ErreurEcriture> {
    let octets = match fs::read(transaction.join(JOURNAL)) {
        Ok(octets) => octets,
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => return Ok(Ok(None)),
        Err(erreur) => return Err(classer(erreur)),
    };
    Ok(serde_json::from_slice(&octets)
        .map(Some)
        .map_err(|erreur| format!("journal illisible : {erreur}")))
}

/// Un journal ne désigne que des fichiers du projet, jamais à travers un lien.
fn verifier_plan(racine: &Path, plan: &Plan) -> Result<(), String> {
    let chemins = plan.entrees.iter().map(|entree| &entree.chemin);
    for chemin in chemins.chain(plan.dossiers_crees.iter()) {
        valider_chemin(chemin)
            .and_then(|()| parents_reels(racine, chemin))
            .map_err(|_| format!("chemin refusé dans le journal : {chemin:?}"))?;
    }
    Ok(())
}

/// Chaque dossier parent existant de `chemin` (relatif au projet) est un vrai dossier :
/// ni lien symbolique ni jonction.
fn parents_reels(racine: &Path, chemin: &str) -> Result<(), ErreurEcriture> {
    let segments: Vec<&str> = chemin.split('/').collect();
    let mut courant = racine.to_path_buf();
    for segment in &segments[..segments.len().saturating_sub(1)] {
        courant.push(segment);
        match fs::symlink_metadata(&courant) {
            Ok(meta) if meta.is_dir() && !meta.file_type().is_symlink() => {}
            Ok(_) => {
                return Err(ErreurEcriture::CheminInvalide(format!(
                    "{chemin} : un dossier parent est un lien, une jonction ou un fichier"
                )))
            }
            Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => return Ok(()),
            Err(erreur) => return Err(classer(erreur)),
        }
    }
    Ok(())
}

/// Met une transaction impossible à reprendre de côté (`de-cote-txn-…`) : rien n'est
/// supprimé, et la récupération suivante ne la voit plus (pas de blocage permanent).
fn mettre_de_cote(transaction: &Path, raison: &str) -> ErreurEcriture {
    let nom = transaction
        .file_name()
        .map(|nom| nom.to_string_lossy().into_owned())
        .unwrap_or_default();
    let destination = transaction.with_file_name(format!("de-cote-{nom}"));
    let examiner = match fs::rename(transaction, &destination) {
        Ok(()) => destination,
        Err(_) => transaction.to_path_buf(),
    };
    ErreurEcriture::RecuperationImpossible(format!(
        "une écriture interrompue n'a pas pu être reprise ({raison}) ; rien n'a été supprimé, \
         dossier à examiner : {}",
        examiner.display()
    ))
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
) -> io::Result<Plan> {
    let mut entrees = Vec::with_capacity(fichiers.len());
    let mut dossiers_crees: Vec<String> = Vec::new();
    for (i, fichier) in fichiers.iter().enumerate() {
        let segments: Vec<&str> = fichier.chemin.split('/').collect();
        for fin in 1..segments.len() {
            let dossier = segments[..fin].join("/");
            if !racine.join(&dossier).exists() && !dossiers_crees.contains(&dossier) {
                dossiers_crees.push(dossier);
            }
        }
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
    Ok(Plan {
        entrees,
        dossiers_crees,
    })
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
fn annuler(
    racine: &Path,
    transaction: &Path,
    plan: &Plan,
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    for (i, entree) in plan.entrees.iter().enumerate().rev() {
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
            // Jamais un lien déposé à la place de la copie d'origine.
            if fs::symlink_metadata(&ancien).is_ok_and(|meta| meta.is_file()) {
                fs::rename(&ancien, &cible)?;
            }
        } else {
            fs::remove_file(&cible)?;
        }
        synchroniser_dossier(cible.parent().unwrap_or(racine))?;
        points.atteint(Etape::FichierRestaure(i))?;
    }
    // Dossiers créés par la transaction, du plus profond au plus haut, seulement s'ils
    // sont vides (`remove_dir` échoue sinon : un fichier ajouté depuis est conservé).
    for dossier in plan.dossiers_crees.iter().rev() {
        let _ = fs::remove_dir(racine.join(dossier));
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
        let ancien = copie_ancienne(transaction, i);
        // Copie disparue (arrêt pendant le nettoyage) ou remplacée par autre chose qu'un
        // fichier ordinaire (lien) : pas de sauvegarde pour ce fichier.
        let copie_ordinaire = fs::symlink_metadata(&ancien).is_ok_and(|meta| meta.is_file());
        if entree.empreinte_precedente.is_some() && copie_ordinaire {
            let sauvegarde = racine.join(DOSSIER_SAUVEGARDES).join(&entree.chemin);
            let contenu = fs::read(&ancien)?;
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
    fs::File::open(dossier)?.sync_all()?;
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
