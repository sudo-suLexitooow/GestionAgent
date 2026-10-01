//! Écriture atomique de fichiers du projet (NF-12, NF-13, ADR-001 D6).
//!
//! Tout accès au disque passe par [`acces::Projet`] : chaque chemin est résolu de façon sûre
//! (règle R1 sur chaque segment, aucun lien ni jonction, ni sur les parents ni sur la
//! cible) ; les lectures n'acceptent que des fichiers ordinaires.
//!
//! Une écriture de un ou plusieurs fichiers est une transaction dans
//! `.cadre/tmp/txn-<id>/` (même volume que le projet, donc renommages atomiques) :
//!
//! 0. validation des chemins (R1, ni `.git` ni dossiers internes, pas de doublon) ;
//!    `.cadre`, `.cadre/tmp` et `.cadre/backups` doivent être de vrais dossiers ; verrou
//!    exclusif `.cadre/tmp/verrou` (une seule instance de Cadre à la fois) ;
//! 1. récupération d'une éventuelle transaction précédente interrompue ;
//! 2. préparation : `<i>.nouveau` (nouveau contenu) et `<i>.ancien` (copie du fichier
//!    actuel s'il existe), chacun synchronisé sur disque (fsync) ; le plan note aussi les
//!    dossiers que la transaction va créer ;
//! 3. journal `en_cours` (écrit atomiquement) : à partir d'ici, un arrêt brutal est annulé
//!    à la récupération ;
//! 4. remplacement de chaque fichier par renommage de `<i>.nouveau`, puis fsync du dossier ;
//! 5. journal `validee` : l'enregistrement a réussi ;
//! 6. version précédente copiée dans `.cadre/backups/<chemin>` et index mis à jour (une
//!    sauvegarde impossible est abandonnée, jamais bloquante) ;
//! 7. suppression du journal, puis du dossier de transaction.
//!
//! Erreur avant 5 : les fichiers déjà remplacés sont remis d'origine et les dossiers vides
//! créés retirés ; si cette annulation échoue, `AnnulationIncomplete` et le journal reste.
//! Annulation et récupération ne touchent jamais un fichier dont le contenu n'est plus celui
//! écrit par la transaction (modifié par l'utilisateur entre-temps). Une transaction qui ne
//! peut pas être reprise (journal illisible, chemin refusé, annulation impossible, copie
//! d'origine manquante) est mise de côté (`de-cote-txn-…`) sans rien supprimer.
//!
//! Le fichier `.cadre/tmp/verrou` est permanent et n'est JAMAIS supprimé (le supprimer
//! ouvrirait une course entre instances) : après un échec dans un projet sans `.cadre/`,
//! `.cadre/tmp/verrou`, vide, est le seul résidu.
//!
//! Lectures internes bornées : journal et index de 1 Mio au plus (au-delà, le journal est
//! mis de côté et l'index reconstruit).

pub mod acces;
pub mod commandes;

use acces::{motif_de_refus, refus, Genre, Projet, Verrou};

/// Taille maximale lue pour un journal ou l'index des sauvegardes.
const TAILLE_MAX_INTERNE: u64 = 1024 * 1024;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

const CADRE: &str = ".cadre";
/// Temporaires et journaux de transaction, sur le même volume que le projet.
const DOSSIER_TMP: &str = ".cadre/tmp";
const DOSSIER_SAUVEGARDES: &str = ".cadre/backups";
const INDEX_SAUVEGARDES: &str = ".cadre/backups/index.yaml";
const VERROU: &str = ".cadre/tmp/verrou";
const NOM_VERROU: &str = "verrou";
const JOURNAL: &str = "journal.json";

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
    let projet = Projet::new(racine);
    for fichier in fichiers {
        valider_chemin(&fichier.chemin)?;
        projet.reel(&fichier.chemin).map_err(classer)?;
    }
    sans_doublon(fichiers)?;
    dossiers_internes_reels(&projet)?;
    projet.creer_dossiers(DOSSIER_TMP).map_err(classer)?;
    // Le fichier de verrou n'est jamais supprimé (pas de course entre instances) : après un
    // échec dans un projet sans `.cadre/`, `.cadre/tmp/verrou` (vide) est le seul résidu.
    let _verrou = verrouiller_projet(&projet)?;
    recuperer_sous_verrou(&projet, points)?;
    let transaction = nouvelle_transaction(&projet).map_err(classer)?;
    let preparation = preparer(&projet, &transaction, fichiers, points).and_then(|plan| {
        ecrire_journal(
            &projet,
            &transaction,
            EtatTransaction::EnCours,
            &plan,
            points,
        )?;
        points.atteint(Etape::AvantRemplacement)?;
        Ok(plan)
    });
    let plan = match preparation {
        Ok(plan) => plan,
        Err(erreur) => {
            let _ = projet.supprimer_arbre(&transaction);
            return Err(classer(erreur));
        }
    };
    let remplacement = remplacer(&projet, &transaction, &plan.entrees, points).and_then(|()| {
        ecrire_journal(
            &projet,
            &transaction,
            EtatTransaction::Validee,
            &plan,
            points,
        )
    });
    if let Err(erreur) = remplacement {
        // Si l'annulation échoue, le journal reste : la prochaine récupération la reprend.
        if let Err(echec) = annuler(&projet, &transaction, &plan, points) {
            return Err(ErreurEcriture::AnnulationIncomplete(format!(
                "{erreur} ; annulation interrompue : {echec}"
            )));
        }
        let _ = nettoyer_transaction(&projet, &transaction, &SansPanne);
        return Err(classer(erreur));
    }
    // Validée : l'enregistrement a réussi. Interrompu ici, le journal reste et la
    // récupération termine les sauvegardes ; une sauvegarde impossible est abandonnée
    // (jamais de blocage des écritures suivantes).
    if points.atteint(Etape::TransactionValidee).is_ok() {
        let _ = sauvegarder_versions_precedentes(&projet, &transaction, &plan.entrees);
        let _ = nettoyer_transaction(&projet, &transaction, points);
    }
    Ok(())
}

/// Supprime le journal d'abord : un arrêt pendant l'effacement du dossier laisse une
/// transaction sans journal, simplement effacée à la récupération suivante.
fn nettoyer_transaction(
    projet: &Projet,
    transaction: &str,
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    match projet.supprimer_fichier(&format!("{transaction}/{JOURNAL}")) {
        Ok(()) => projet.synchroniser_dossier(transaction)?,
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => {}
        Err(erreur) => return Err(erreur),
    }
    points.atteint(Etape::JournalSupprime)?;
    projet.supprimer_arbre(transaction)
}

/// Chemin écrit par Cadre : règle R1 sur chaque segment, ni `.git` ni dossiers internes de
/// l'écrivain (`.cadre/tmp`, `.cadre/backups`, quelle que soit la casse).
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

/// Règle R1 d'ADR-001 (D4) : nom valide sous Windows, macOS et Linux (255 octets au plus,
/// ni caractère interdit, ni nom réservé, ni nom court 8.3 `XXXXXX~1`), et jamais `.git`
/// (un hook écrit dans `.git/hooks/` serait exécuté par Git). L'unicité après
/// normalisation NFC n'est pas vérifiée (R1 partielle).
fn segment_portable(segment: &str) -> bool {
    const INTERDITS: [char; 9] = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let tronc = segment.split('.').next().unwrap_or_default();
    let base = tronc.trim_end().to_uppercase();
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
    // Nom court 8.3 de Windows (`GIT~1` désigne `.git`, `CADRE~1` désigne `.cadre`).
    let nom_court = tronc.rsplit_once('~').is_some_and(|(avant, chiffres)| {
        !avant.is_empty() && !chiffres.is_empty() && chiffres.bytes().all(|c| c.is_ascii_digit())
    });
    !segment.is_empty()
        && segment.len() <= 255
        && segment != "."
        && segment != ".."
        && !segment.ends_with(['.', ' '])
        && !segment
            .chars()
            .any(|c| INTERDITS.contains(&c) || c.is_control())
        && !segment.eq_ignore_ascii_case(".git")
        && !segment.chars().any(ignore_par_hfs)
        && !reserve
        && !nom_court
}

/// Caractères ignorés par HFS+ dans les noms (comme `is_hfs_dotgit` de Git) : `.g\u{200c}it`
/// y désigne `.git`.
fn ignore_par_hfs(c: char) -> bool {
    matches!(
        c,
        '\u{200C}'..='\u{200F}' | '\u{202A}'..='\u{202E}' | '\u{206A}'..='\u{206F}' | '\u{FEFF}'
    )
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
/// Appelée à l'ouverture du projet ; chaque écriture la fait aussi avant de commencer. Le
/// verrou n'est pris que s'il y a quelque chose à récupérer : un projet en lecture seule
/// sans écriture interrompue s'ouvre sans rien écrire.
pub fn recuperer(racine: &Path) -> Result<(), ErreurEcriture> {
    recuperer_avec(racine, &SansPanne)
}

/// Comme [`recuperer`], avec des points d'injection de pannes.
pub fn recuperer_avec(racine: &Path, points: &dyn PointsDeControle) -> Result<(), ErreurEcriture> {
    let projet = Projet::new(racine);
    if !dossiers_internes_reels(&projet)? {
        return Ok(());
    }
    let a_recuperer = projet
        .lister(DOSSIER_TMP)
        .map_err(classer)?
        .iter()
        .any(|(nom, _)| nom != NOM_VERROU && !nom.starts_with("de-cote-"));
    if !a_recuperer {
        return Ok(());
    }
    let _verrou = verrouiller_projet(&projet)?;
    recuperer_sous_verrou(&projet, points)
}

/// Verrou de fichier exclusif du système (libéré par l'OS si le processus meurt), tenu
/// pendant toute écriture et toute récupération : deux instances de Cadre ne peuvent pas
/// travailler en même temps sur le même projet.
fn verrouiller_projet(projet: &Projet) -> Result<Verrou, ErreurEcriture> {
    projet
        .verrouiller(VERROU)
        .map_err(classer)?
        .ok_or(ErreurEcriture::ProjetOccupe)
}

fn recuperer_sous_verrou(
    projet: &Projet,
    points: &dyn PointsDeControle,
) -> Result<(), ErreurEcriture> {
    for (nom, genre) in projet.lister(DOSSIER_TMP).map_err(classer)? {
        let chemin = format!("{DOSSIER_TMP}/{nom}");
        // Nom refusé par R1 (dépôt forgé) : ni lu, ni suivi, ni supprimé.
        if projet.reel(&chemin).is_err() {
            continue;
        }
        match genre {
            Genre::Fichier if nom != NOM_VERROU => {
                projet.supprimer_fichier(&chemin).map_err(classer)?;
            }
            Genre::Dossier if nom.starts_with("txn-") => {
                reprendre_transaction(projet, &chemin, points)?;
            }
            // Liens, transactions mises de côté, autres dossiers : jamais touchés.
            _ => {}
        }
    }
    Ok(())
}

/// Annule (`en_cours`) ou termine (`validee`) une transaction interrompue, puis l'efface ;
/// la met de côté si elle ne peut pas être reprise sans risque.
fn reprendre_transaction(
    projet: &Projet,
    transaction: &str,
    points: &dyn PointsDeControle,
) -> Result<(), ErreurEcriture> {
    let journal = match lire_journal(projet, transaction) {
        Ok(journal) => journal,
        Err(raison) => return Err(mettre_de_cote(projet, transaction, &raison)),
    };
    if let Some(journal) = &journal {
        if let Err(raison) = verifier_plan(projet, &journal.plan) {
            return Err(mettre_de_cote(projet, transaction, &raison));
        }
    }
    match journal {
        Some(Journal {
            etat: EtatTransaction::EnCours,
            plan,
        }) => {
            if let Err(erreur) = annuler(projet, transaction, &plan, points) {
                // Cas structurel (copie manquante, cible devenue dossier ou lien) : jamais
                // réparable, mis de côté. Erreur d'entrée-sortie (fichier verrouillé, accès
                // refusé, EIO…) : peut-être passagère, le journal reste pour une nouvelle
                // tentative à la prochaine opération ou ouverture.
                if motif_de_refus(&erreur).is_some() {
                    let raison = format!("annulation impossible : {erreur}");
                    return Err(mettre_de_cote(projet, transaction, &raison));
                }
                return Err(ErreurEcriture::AnnulationIncomplete(format!(
                    "reprise de {} interrompue, nouvelle tentative à la prochaine opération : \
                     {erreur}",
                    projet.afficher(transaction)
                )));
            }
        }
        Some(Journal {
            etat: EtatTransaction::Validee,
            plan,
        }) => {
            // L'enregistrement est déjà validé : une sauvegarde impossible est abandonnée
            // plutôt que de bloquer toutes les écritures suivantes.
            let _ = sauvegarder_versions_precedentes(projet, transaction, &plan.entrees);
        }
        None => {}
    }
    nettoyer_transaction(projet, transaction, &SansPanne).map_err(classer)
}

/// Vérifie que `.cadre`, `.cadre/tmp` et `.cadre/backups`, s'ils existent, sont de vrais
/// dossiers (ni lien, ni jonction, ni fichier). Renvoie `true` si `.cadre/tmp` existe.
fn dossiers_internes_reels(projet: &Projet) -> Result<bool, ErreurEcriture> {
    let mut tmp_existe = false;
    for dossier in [CADRE, DOSSIER_TMP, DOSSIER_SAUVEGARDES] {
        match projet.genre(dossier).map_err(classer)? {
            None => {}
            Some(Genre::Dossier) => tmp_existe |= dossier == DOSSIER_TMP,
            Some(_) => {
                return Err(ErreurEcriture::CheminInvalide(format!(
                    "{dossier} n'est pas un vrai dossier (lien symbolique, jonction ou \
                     fichier) : Cadre refuse d'y écrire"
                )))
            }
        }
    }
    Ok(tmp_existe)
}

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
    projet: &Projet,
    transaction: &str,
    etat: EtatTransaction,
    plan: &Plan,
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    let journal = Journal {
        etat,
        plan: plan.clone(),
    };
    let provisoire = format!("{transaction}/{JOURNAL}.provisoire");
    projet.creer_nouveau(&provisoire, &serde_json::to_vec_pretty(&journal)?)?;
    if matches!(etat, EtatTransaction::Validee) {
        points.atteint(Etape::JournalValideProvisoire)?;
    }
    projet.renommer(&provisoire, &format!("{transaction}/{JOURNAL}"))?;
    projet.synchroniser_dossier(transaction)
}

/// Journal d'une transaction interrompue ; `Err(raison)` s'il ne peut pas être lu (dossier,
/// lien, contenu invalide…) : la transaction sera mise de côté.
fn lire_journal(projet: &Projet, transaction: &str) -> Result<Option<Journal>, String> {
    match projet.lire_au_plus(&format!("{transaction}/{JOURNAL}"), TAILLE_MAX_INTERNE) {
        Ok(None) => Ok(None),
        Ok(Some(octets)) => serde_json::from_slice(&octets)
            .map(Some)
            .map_err(|erreur| format!("journal illisible : {erreur}")),
        Err(erreur) => Err(format!("journal illisible : {erreur}")),
    }
}

/// Un journal ne désigne que des fichiers du projet, jamais à travers un lien.
fn verifier_plan(projet: &Projet, plan: &Plan) -> Result<(), String> {
    let chemins = plan.entrees.iter().map(|entree| &entree.chemin);
    for chemin in chemins.chain(plan.dossiers_crees.iter()) {
        let refuse = valider_chemin(chemin).is_err() || projet.reel(chemin).is_err();
        if refuse {
            return Err(format!("chemin refusé dans le journal : {chemin:?}"));
        }
    }
    Ok(())
}

/// Met une transaction impossible à reprendre de côté (`de-cote-txn-…`, suffixe `-2`,
/// `-3`… si le nom est pris) : rien n'est supprimé, et la récupération suivante ne la voit
/// plus (pas de blocage permanent).
fn mettre_de_cote(projet: &Projet, transaction: &str, raison: &str) -> ErreurEcriture {
    let nom = transaction.rsplit('/').next().unwrap_or(transaction);
    let libre = (1..=1000)
        .map(|n| match n {
            1 => format!("{DOSSIER_TMP}/de-cote-{nom}"),
            n => format!("{DOSSIER_TMP}/de-cote-{nom}-{n}"),
        })
        .find(|candidat| matches!(projet.existe(candidat), Ok(false)));
    let examiner = match libre {
        Some(destination) if projet.renommer(transaction, &destination).is_ok() => destination,
        _ => transaction.to_owned(),
    };
    ErreurEcriture::RecuperationImpossible(format!(
        "une écriture interrompue n'a pas pu être reprise ({raison}) ; des fichiers du projet \
         peuvent être partiellement modifiés ; rien n'a été supprimé, les copies d'origine \
         (*.ancien) sont dans : {}",
        projet.afficher(&examiner)
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

fn temporaire_nouveau(transaction: &str, i: usize) -> String {
    format!("{transaction}/{i}.nouveau")
}

fn copie_ancienne(transaction: &str, i: usize) -> String {
    format!("{transaction}/{i}.ancien")
}

fn parent(chemin: &str) -> &str {
    chemin.rsplit_once('/').map_or("", |(parent, _)| parent)
}

/// Écrit les nouveaux contenus et une copie des fichiers existants dans la transaction.
fn preparer(
    projet: &Projet,
    transaction: &str,
    fichiers: &[FichierAEcrire],
    points: &dyn PointsDeControle,
) -> io::Result<Plan> {
    let mut entrees = Vec::with_capacity(fichiers.len());
    let mut dossiers_crees: Vec<String> = Vec::new();
    for (i, fichier) in fichiers.iter().enumerate() {
        let segments: Vec<&str> = fichier.chemin.split('/').collect();
        for fin in 1..segments.len() {
            let dossier = segments[..fin].join("/");
            if !projet.existe(&dossier)? && !dossiers_crees.contains(&dossier) {
                dossiers_crees.push(dossier);
            }
        }
        projet.creer_nouveau(&temporaire_nouveau(transaction, i), &fichier.contenu)?;
        points.atteint(Etape::TemporaireEcrit(i))?;
        let empreinte_precedente = match projet.lire(&fichier.chemin)? {
            Some(ancien) => {
                projet.creer_nouveau(&copie_ancienne(transaction, i), &ancien)?;
                Some(empreinte(&ancien))
            }
            None => None,
        };
        entrees.push(Entree {
            chemin: fichier.chemin.clone(),
            empreinte_precedente,
            empreinte_nouvelle: empreinte(&fichier.contenu),
        });
    }
    projet.synchroniser_dossier(transaction)?;
    Ok(Plan {
        entrees,
        dossiers_crees,
    })
}

fn remplacer(
    projet: &Projet,
    transaction: &str,
    entrees: &[Entree],
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    for (i, entree) in entrees.iter().enumerate() {
        projet.creer_dossiers(parent(&entree.chemin))?;
        projet.renommer(&temporaire_nouveau(transaction, i), &entree.chemin)?;
        projet.synchroniser_dossier(parent(&entree.chemin))?;
        points.atteint(Etape::FichierRemplace(i))?;
    }
    Ok(())
}

/// Remet chaque fichier remplacé par la transaction dans son état d'origine. Un fichier
/// dont le contenu n'est plus celui écrit par la transaction n'est jamais touché. Une cible
/// illisible ou devenue dossier, ou une copie d'origine manquante alors que la cible porte
/// le nouveau contenu, est une erreur : rien n'est nettoyé en silence.
fn annuler(
    projet: &Projet,
    transaction: &str,
    plan: &Plan,
    points: &dyn PointsDeControle,
) -> io::Result<()> {
    for (i, entree) in plan.entrees.iter().enumerate().rev() {
        let Some(actuel) = projet.lire(&entree.chemin)? else {
            continue;
        };
        let deja_d_origine =
            entree.empreinte_precedente.as_deref() == Some(entree.empreinte_nouvelle.as_str());
        if empreinte(&actuel) != entree.empreinte_nouvelle || deja_d_origine {
            continue;
        }
        if entree.empreinte_precedente.is_some() {
            let ancien = copie_ancienne(transaction, i);
            if projet.genre(&ancien)? != Some(Genre::Fichier) {
                return Err(refus(format!(
                    "copie d'origine manquante pour {}",
                    entree.chemin
                )));
            }
            projet.renommer(&ancien, &entree.chemin)?;
        } else {
            projet.supprimer_fichier(&entree.chemin)?;
        }
        projet.synchroniser_dossier(parent(&entree.chemin))?;
        points.atteint(Etape::FichierRestaure(i))?;
    }
    // Dossiers créés par la transaction, du plus profond au plus haut, seulement s'ils
    // sont vides (un fichier ajouté depuis est conservé).
    for dossier in plan.dossiers_crees.iter().rev() {
        let _ = projet.supprimer_dossier_vide(dossier);
    }
    Ok(())
}

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
    projet: &Projet,
    transaction: &str,
    entrees: &[Entree],
) -> io::Result<()> {
    for (i, entree) in entrees.iter().enumerate() {
        // Copie disparue (arrêt pendant le nettoyage) : pas de sauvegarde pour ce fichier.
        let ancien = copie_ancienne(transaction, i);
        if entree.empreinte_precedente.is_none() {
            continue;
        }
        if let Some(contenu) = projet.lire(&ancien)? {
            remplacer_par(
                projet,
                &format!("{transaction}/{i}.sauvegarde"),
                &format!("{DOSSIER_SAUVEGARDES}/{}", entree.chemin),
                &contenu,
            )?;
        }
    }

    // L'index n'est qu'une aide (dossier ignoré par Git) : illisible, il est reconstruit.
    let mut index: IndexSauvegardes = projet
        .lire_au_plus(INDEX_SAUVEGARDES, TAILLE_MAX_INTERNE)
        .ok()
        .flatten()
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
        projet,
        &format!("{transaction}/index.provisoire"),
        INDEX_SAUVEGARDES,
        &octets,
    )
}

/// Écriture atomique d'un fichier interne : `provisoire` (même volume), fsync, renommage.
fn remplacer_par(projet: &Projet, provisoire: &str, cible: &str, contenu: &[u8]) -> io::Result<()> {
    let _ = projet.supprimer_fichier(provisoire);
    projet.creer_nouveau(provisoire, contenu)?;
    projet.creer_dossiers(parent(cible))?;
    projet.renommer(provisoire, cible)?;
    projet.synchroniser_dossier(parent(cible))
}

fn empreinte(contenu: &[u8]) -> String {
    Sha256::digest(contenu)
        .iter()
        .map(|octet| format!("{octet:02x}"))
        .collect()
}

static COMPTEUR: AtomicU64 = AtomicU64::new(0);

fn nouvelle_transaction(projet: &Projet) -> io::Result<String> {
    let horodatage = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    let numero = COMPTEUR.fetch_add(1, Ordering::Relaxed);
    let transaction = format!(
        "{DOSSIER_TMP}/txn-{}-{horodatage}-{numero}",
        std::process::id()
    );
    projet.creer_dossiers(&transaction)?;
    Ok(transaction)
}

#[cfg(unix)]
mod codes_systeme {
    /// ENOSPC et EDQUOT, dont la valeur dépend de l'OS.
    #[cfg(target_os = "linux")]
    pub const DISQUE_PLEIN: &[i32] = &[28, 122];
    #[cfg(target_os = "macos")]
    pub const DISQUE_PLEIN: &[i32] = &[28, 69];
    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    pub const DISQUE_PLEIN: &[i32] = &[28];
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
    if let Some(motif) = motif_de_refus(&erreur) {
        return ErreurEcriture::CheminInvalide(motif);
    }
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
