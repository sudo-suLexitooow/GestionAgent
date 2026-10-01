//! Commandes Tauri de lecture et d'écriture des fichiers du projet (appelées par
//! `src/platform/`). Toute écriture passe par la transaction atomique.
//!
//! La racine du projet est tenue côté Rust (état [`ProjetOuvert`], défini par
//! `ouvrir_projet`) : l'interface ne peut ni lire ni écrire hors du projet ouvert.

use super::{classer, ecrire_fichiers, recuperer, valider_chemin, ErreurEcriture, FichierAEcrire};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
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

pub fn recuperer_projet(etat: &ProjetOuvert, racine: &str) -> Result<(), ErreurEcriture> {
    recuperer(&racine_autorisee(etat, racine)?)
}

pub fn lire(
    etat: &ProjetOuvert,
    racine: &str,
    chemin: &str,
) -> Result<Option<String>, ErreurEcriture> {
    let racine = racine_autorisee(etat, racine)?;
    valider_chemin(chemin)?;
    match fs::read_to_string(racine.join(chemin)) {
        Ok(contenu) => Ok(Some(contenu)),
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(erreur) => Err(classer(erreur)),
    }
}

pub fn existe(etat: &ProjetOuvert, racine: &str, chemin: &str) -> Result<bool, ErreurEcriture> {
    let racine = racine_autorisee(etat, racine)?;
    valider_chemin(chemin)?;
    Ok(Path::new(&racine).join(chemin).exists())
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

/// Termine ou annule une écriture interrompue.
#[tauri::command]
pub fn recuperer_ecritures_projet(
    etat: State<'_, ProjetOuvert>,
    racine: String,
) -> Result<(), ErreurDto> {
    Ok(recuperer_projet(&etat, &racine)?)
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

#[tauri::command]
pub fn chemin_projet_existe(
    etat: State<'_, ProjetOuvert>,
    racine: String,
    chemin: String,
) -> Result<bool, ErreurDto> {
    Ok(existe(&etat, &racine, &chemin)?)
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
    fn test_ac_005_4_commande_de_recuperation_vide_les_temporaires() {
        let (dossier, etat) = projet_ouvert();
        let orphelin = dossier.path().join(".cadre/tmp/orphelin");
        fs::create_dir_all(orphelin.parent().unwrap()).unwrap();
        fs::write(&orphelin, "x").unwrap();

        recuperer_projet(&etat, &racine(&dossier)).expect("récupération");

        assert!(!orphelin.exists());
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

    #[test]
    fn test_ac_005_2_detection_d_un_projet_git() {
        let (dossier, etat) = projet_ouvert();
        let r = racine(&dossier);
        assert!(!existe(&etat, &r, ".git").unwrap());

        fs::create_dir(dossier.path().join(".git")).unwrap();

        assert!(existe(&etat, &r, ".git").unwrap());
        assert_eq!(
            code(existe(&etat, &r, "/etc").unwrap_err()),
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
        assert_eq!(code(existe(&etat, &r, "x").unwrap_err()), "CHEMIN_INVALIDE");
        assert_eq!(
            code(recuperer_projet(&etat, &r).unwrap_err()),
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
            code(existe(&etat, &r, "secret.txt").unwrap_err()),
            "CHEMIN_INVALIDE"
        );
        assert_eq!(
            code(recuperer_projet(&etat, &r).unwrap_err()),
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
