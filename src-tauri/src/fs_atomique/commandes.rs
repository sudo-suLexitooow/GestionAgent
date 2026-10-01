//! Commandes Tauri de lecture et d'écriture des fichiers du projet (appelées par
//! `src/platform/`). Toute écriture passe par la transaction atomique.
//!
//! La racine du projet est tenue côté Rust (état [`ProjetOuvert`], défini par
//! `ouvrir_projet`) : l'interface ne peut ni lire ni écrire hors du projet ouvert.

use super::{
    classer, ecrire_fichiers, recuperer, valider_chemin_relatif, ErreurEcriture, FichierAEcrire,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Fichier à écrire, tel que reçu de l'interface.
#[derive(Debug, Clone, Deserialize)]
pub struct FichierDto {
    pub chemin: String,
    pub contenu: String,
}

/// Erreur renvoyée à l'interface : un code stable et le détail technique.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ErreurDto {
    pub code: String,
    pub detail: String,
}

impl From<ErreurEcriture> for ErreurDto {
    fn from(erreur: ErreurEcriture) -> Self {
        let (code, detail) = match erreur {
            ErreurEcriture::LectureSeule(detail) => ("LECTURE_SEULE", detail),
            ErreurEcriture::DisquePlein(detail) => ("DISQUE_PLEIN", detail),
            ErreurEcriture::CheminInvalide(detail) => ("CHEMIN_INVALIDE", detail),
            ErreurEcriture::RecuperationImpossible(detail) => ("RECUPERATION_IMPOSSIBLE", detail),
            ErreurEcriture::AnnulationIncomplete(detail) => ("ANNULATION_INCOMPLETE", detail),
            ErreurEcriture::ProjetOccupe => ("PROJET_OCCUPE", String::new()),
            ErreurEcriture::Autre(detail) => ("ECHEC", detail),
        };
        ErreurDto {
            code: code.to_owned(),
            detail,
        }
    }
}

/// Racine canonique du projet ouvert, seule racine acceptée par les commandes de fichiers.
#[derive(Debug, Default)]
pub struct ProjetOuvert(Mutex<Option<PathBuf>>);

/// Ouvre un projet : retient sa racine canonique, puis termine ou annule une écriture
/// interrompue (AC-005-4, « au prochain démarrage »).
pub fn ouvrir(etat: &ProjetOuvert, chemin: &str) -> Result<(), ErreurEcriture> {
    let racine = canonique(chemin)?;
    if !racine.is_dir() {
        return Err(ErreurEcriture::CheminInvalide(format!(
            "{chemin} n'est pas un dossier"
        )));
    }
    *verrouiller_etat(etat) = Some(racine.clone());
    recuperer(&racine)
}

fn canonique(chemin: &str) -> Result<PathBuf, ErreurEcriture> {
    fs::canonicalize(chemin)
        .map_err(|erreur| ErreurEcriture::CheminInvalide(format!("{chemin} : {erreur}")))
}

fn verrouiller_etat(etat: &ProjetOuvert) -> std::sync::MutexGuard<'_, Option<PathBuf>> {
    // Un panic pendant une commande ne doit pas rendre le projet inutilisable.
    etat.0
        .lock()
        .unwrap_or_else(|empoisonne| empoisonne.into_inner())
}

/// Racine du projet ouvert si `racine` la désigne ; sinon `CheminInvalide`.
fn racine_autorisee(etat: &ProjetOuvert, racine: &str) -> Result<PathBuf, ErreurEcriture> {
    let ouverte = verrouiller_etat(etat)
        .clone()
        .ok_or_else(|| ErreurEcriture::CheminInvalide("aucun projet ouvert".to_owned()))?;
    if canonique(racine)? != ouverte {
        return Err(ErreurEcriture::CheminInvalide(format!(
            "{racine} n'est pas le projet ouvert"
        )));
    }
    Ok(ouverte)
}

pub fn ecrire(
    etat: &ProjetOuvert,
    racine: &str,
    fichiers: Vec<FichierDto>,
) -> Result<(), ErreurEcriture> {
    let racine = racine_autorisee(etat, racine)?;
    let fichiers: Vec<FichierAEcrire> = fichiers
        .into_iter()
        .map(|fichier| FichierAEcrire::new(&fichier.chemin, fichier.contenu))
        .collect();
    ecrire_fichiers(&racine, &fichiers)
}

pub fn lire(
    etat: &ProjetOuvert,
    racine: &str,
    chemin: &str,
) -> Result<Option<String>, ErreurEcriture> {
    let racine = racine_autorisee(etat, racine)?;
    valider_chemin_relatif(chemin)?;
    match fs::read_to_string(racine.join(chemin)) {
        Ok(contenu) => Ok(Some(contenu)),
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(erreur) => Err(classer(erreur)),
    }
}

/// Vrai si `.git` (dossier, ou fichier d'un worktree) est à la racine du projet ouvert ou
/// dans l'un de ses dossiers parents.
pub fn dans_un_depot_git(etat: &ProjetOuvert, racine: &str) -> Result<bool, ErreurEcriture> {
    let racine = racine_autorisee(etat, racine)?;
    Ok(racine
        .ancestors()
        .any(|dossier| fs::symlink_metadata(dossier.join(".git")).is_ok()))
}

#[tauri::command]
pub fn projet_dans_un_depot_git(
    etat: State<'_, ProjetOuvert>,
    racine: String,
) -> Result<bool, ErreurDto> {
    Ok(dans_un_depot_git(&etat, &racine)?)
}

#[tauri::command]
pub fn ouvrir_projet(etat: State<'_, ProjetOuvert>, chemin: String) -> Result<(), ErreurDto> {
    Ok(ouvrir(&etat, &chemin)?)
}

/// Écrit tous les fichiers ou aucun, avec sauvegarde de la version précédente.
#[tauri::command]
pub fn ecrire_fichiers_projet(
    etat: State<'_, ProjetOuvert>,
    racine: String,
    fichiers: Vec<FichierDto>,
) -> Result<(), ErreurDto> {
    Ok(ecrire(&etat, &racine, fichiers)?)
}

/// Contenu texte (UTF-8) d'un fichier du projet, `None` s'il n'existe pas.
#[tauri::command]
pub fn lire_fichier_projet(
    etat: State<'_, ProjetOuvert>,
    racine: String,
    chemin: String,
) -> Result<Option<String>, ErreurDto> {
    Ok(lire(&etat, &racine, &chemin)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn dto(chemin: &str, contenu: &str) -> FichierDto {
        FichierDto {
            chemin: chemin.to_owned(),
            contenu: contenu.to_owned(),
        }
    }

    fn racine(dossier: &tempfile::TempDir) -> String {
        dossier.path().to_string_lossy().into_owned()
    }

    /// Projet temporaire ouvert par `ouvrir`, comme le fait l'interface.
    fn projet_ouvert() -> (tempfile::TempDir, ProjetOuvert) {
        let dossier = tempfile::tempdir().unwrap();
        let etat = ProjetOuvert::default();
        ouvrir(&etat, &racine(&dossier)).expect("ouverture");
        (dossier, etat)
    }

    fn code(erreur: ErreurEcriture) -> String {
        ErreurDto::from(erreur).code
    }

    #[test]
    fn test_ac_005_6_codes_d_erreur_stables_pour_l_interface() {
        let cas = [
            (
                ErreurEcriture::LectureSeule("d1".into()),
                "LECTURE_SEULE",
                "d1",
            ),
            (
                ErreurEcriture::DisquePlein("d2".into()),
                "DISQUE_PLEIN",
                "d2",
            ),
            (
                ErreurEcriture::CheminInvalide("d3".into()),
                "CHEMIN_INVALIDE",
                "d3",
            ),
            (
                ErreurEcriture::RecuperationImpossible("d5".into()),
                "RECUPERATION_IMPOSSIBLE",
                "d5",
            ),
            (ErreurEcriture::Autre("d4".into()), "ECHEC", "d4"),
        ];
        for (erreur, code, detail) in cas {
            assert_eq!(
                ErreurDto::from(erreur),
                ErreurDto {
                    code: code.into(),
                    detail: detail.into()
                }
            );
        }
    }

    #[test]
    fn test_ac_005_3_commande_ecrit_tous_les_fichiers() {
        let (dossier, etat) = projet_ouvert();

        ecrire(
            &etat,
            &racine(&dossier),
            vec![
                dto(".cadre/cadre.yaml", "schema_version: 1\n"),
                dto(".gitignore", ".cadre/tmp/\n"),
            ],
        )
        .expect("écriture");

        assert_eq!(
            fs::read_to_string(dossier.path().join(".cadre/cadre.yaml")).unwrap(),
            "schema_version: 1\n"
        );
        assert_eq!(
            fs::read_to_string(dossier.path().join(".gitignore")).unwrap(),
            ".cadre/tmp/\n"
        );
    }

    #[test]
    fn test_ac_005_6_commande_renvoie_un_code_d_erreur() {
        let (dossier, etat) = projet_ouvert();

        let erreur = ecrire(&etat, &racine(&dossier), vec![dto("../x", "x")]).unwrap_err();

        assert_eq!(code(erreur), "CHEMIN_INVALIDE");
    }

    #[test]
    fn test_ac_005_2_lecture_d_un_fichier_du_projet() {
        let (dossier, etat) = projet_ouvert();
        let r = racine(&dossier);
        fs::write(dossier.path().join(".gitignore"), "dist\r\n").unwrap();

        assert_eq!(
            lire(&etat, &r, ".gitignore").unwrap(),
            Some("dist\r\n".to_owned())
        );
        assert_eq!(lire(&etat, &r, "absent.txt").unwrap(), None);
        assert_eq!(
            code(lire(&etat, &r, "../x").unwrap_err()),
            "CHEMIN_INVALIDE"
        );
    }

    /// Revue B n° 8 : la racine est tenue côté Rust.
    #[test]
    fn test_securite_aucun_projet_ouvert_toute_commande_refusee() {
        let dossier = tempfile::tempdir().unwrap();
        let etat = ProjetOuvert::default();
        let r = racine(&dossier);

        assert_eq!(
            code(ecrire(&etat, &r, vec![dto("CLAUDE.md", "x")]).unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert_eq!(code(lire(&etat, &r, "x").unwrap_err()), "CHEMIN_INVALIDE");
        assert_eq!(
            code(dans_un_depot_git(&etat, &r).unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert!(!dossier.path().join("CLAUDE.md").exists());
    }

    #[test]
    fn test_securite_racine_differente_du_projet_ouvert_refusee() {
        let (_projet, etat) = projet_ouvert();
        let autre = tempfile::tempdir().unwrap();
        fs::write(autre.path().join("secret.txt"), "secret").unwrap();
        let r = racine(&autre);

        assert_eq!(
            code(ecrire(&etat, &r, vec![dto("CLAUDE.md", "x")]).unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert_eq!(
            code(lire(&etat, &r, "secret.txt").unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert_eq!(
            code(dans_un_depot_git(&etat, &r).unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert!(!autre.path().join("CLAUDE.md").exists());
    }

    #[test]
    fn test_securite_ouvrir_un_chemin_qui_n_est_pas_un_dossier_est_refuse() {
        let dossier = tempfile::tempdir().unwrap();
        let fichier = dossier.path().join("notes.txt");
        fs::write(&fichier, "x").unwrap();
        let etat = ProjetOuvert::default();

        assert_eq!(
            code(ouvrir(&etat, &fichier.to_string_lossy()).unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert_eq!(
            code(ouvrir(&etat, &dossier.path().join("absent").to_string_lossy()).unwrap_err()),
            "CHEMIN_INVALIDE"
        );
    }

    #[test]
    fn test_securite_racine_equivalente_acceptee_apres_canonicalisation() {
        let (dossier, etat) = projet_ouvert();
        let equivalente = dossier.path().join(".").to_string_lossy().into_owned();

        ecrire(&etat, &equivalente, vec![dto("CLAUDE.md", "x")]).expect("même projet");

        assert!(dossier.path().join("CLAUDE.md").exists());
    }

    /// Revue B n° 12 : un projet dans un sous-dossier d'un dépôt Git est un projet Git.
    #[test]
    fn test_ac_005_2_projet_dans_un_sous_dossier_d_un_depot_git() {
        let depot = tempfile::tempdir().unwrap();
        fs::create_dir(depot.path().join(".git")).unwrap();
        let projet = depot.path().join("apps/web");
        fs::create_dir_all(&projet).unwrap();
        let etat = ProjetOuvert::default();
        let r = projet.to_string_lossy().into_owned();
        ouvrir(&etat, &r).expect("ouverture");

        assert!(dans_un_depot_git(&etat, &r).unwrap());
    }

    #[test]
    fn test_ac_005_2_projet_hors_de_tout_depot_git() {
        let (dossier, etat) = projet_ouvert();

        assert!(!dans_un_depot_git(&etat, &racine(&dossier)).unwrap());
    }

    /// Revue B n° 9 : AC-005-4 « après le prochain démarrage » = à l'ouverture du projet.
    #[test]
    fn test_ac_005_4_ouvrir_le_projet_supprime_les_temporaires_orphelins() {
        let dossier = tempfile::tempdir().unwrap();
        let orphelin = dossier.path().join(".cadre/tmp/txn-ancien/0.nouveau");
        fs::create_dir_all(orphelin.parent().unwrap()).unwrap();
        fs::write(&orphelin, "x").unwrap();

        ouvrir(&ProjetOuvert::default(), &racine(&dossier)).expect("ouverture");

        assert!(!dossier.path().join(".cadre/tmp/txn-ancien").exists());
    }
}
