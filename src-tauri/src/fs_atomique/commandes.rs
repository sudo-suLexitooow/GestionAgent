//! Commandes Tauri de lecture et d'écriture des fichiers du projet (appelées par
//! `src/platform/`). Toute écriture passe par la transaction atomique.

use super::{classer, ecrire_fichiers, recuperer, valider_chemin, ErreurEcriture, FichierAEcrire};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::Path;

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
            ErreurEcriture::Autre(detail) => ("ECHEC", detail),
        };
        ErreurDto {
            code: code.to_owned(),
            detail,
        }
    }
}

/// Écrit tous les fichiers ou aucun, avec sauvegarde de la version précédente.
#[tauri::command]
pub fn ecrire_fichiers_projet(racine: String, fichiers: Vec<FichierDto>) -> Result<(), ErreurDto> {
    let fichiers: Vec<FichierAEcrire> = fichiers
        .into_iter()
        .map(|fichier| FichierAEcrire::new(&fichier.chemin, fichier.contenu))
        .collect();
    Ok(ecrire_fichiers(Path::new(&racine), &fichiers)?)
}

/// À appeler à l'ouverture d'un projet : termine ou annule une écriture interrompue.
#[tauri::command]
pub fn recuperer_ecritures_projet(racine: String) -> Result<(), ErreurDto> {
    Ok(recuperer(Path::new(&racine))?)
}

/// Contenu texte (UTF-8) d'un fichier du projet, `None` s'il n'existe pas.
#[tauri::command]
pub fn lire_fichier_projet(racine: String, chemin: String) -> Result<Option<String>, ErreurDto> {
    valider_chemin(&chemin)?;
    match fs::read_to_string(Path::new(&racine).join(&chemin)) {
        Ok(contenu) => Ok(Some(contenu)),
        Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(erreur) => Err(classer(erreur).into()),
    }
}

#[tauri::command]
pub fn chemin_projet_existe(racine: String, chemin: String) -> Result<bool, ErreurDto> {
    valider_chemin(&chemin)?;
    Ok(Path::new(&racine).join(&chemin).exists())
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
        let dossier = tempfile::tempdir().unwrap();

        ecrire_fichiers_projet(
            racine(&dossier),
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
        let dossier = tempfile::tempdir().unwrap();

        let erreur = ecrire_fichiers_projet(racine(&dossier), vec![dto("../x", "x")]).unwrap_err();

        assert_eq!(erreur.code, "CHEMIN_INVALIDE");
    }

    #[test]
    fn test_ac_005_4_commande_de_recuperation_vide_les_temporaires() {
        let dossier = tempfile::tempdir().unwrap();
        let orphelin = dossier.path().join(".cadre/tmp/orphelin");
        fs::create_dir_all(orphelin.parent().unwrap()).unwrap();
        fs::write(&orphelin, "x").unwrap();

        recuperer_ecritures_projet(racine(&dossier)).expect("récupération");

        assert!(!orphelin.exists());
    }

    #[test]
    fn test_ac_005_2_lecture_d_un_fichier_du_projet() {
        let dossier = tempfile::tempdir().unwrap();
        fs::write(dossier.path().join(".gitignore"), "dist\r\n").unwrap();

        assert_eq!(
            lire_fichier_projet(racine(&dossier), ".gitignore".into()),
            Ok(Some("dist\r\n".to_owned()))
        );
        assert_eq!(
            lire_fichier_projet(racine(&dossier), "absent.txt".into()),
            Ok(None)
        );
        assert_eq!(
            lire_fichier_projet(racine(&dossier), "../x".into())
                .unwrap_err()
                .code,
            "CHEMIN_INVALIDE"
        );
    }

    #[test]
    fn test_ac_005_2_detection_d_un_projet_git() {
        let dossier = tempfile::tempdir().unwrap();
        assert_eq!(
            chemin_projet_existe(racine(&dossier), ".git".into()),
            Ok(false)
        );

        fs::create_dir(dossier.path().join(".git")).unwrap();

        assert_eq!(
            chemin_projet_existe(racine(&dossier), ".git".into()),
            Ok(true)
        );
        assert_eq!(
            chemin_projet_existe(racine(&dossier), "/etc".into())
                .unwrap_err()
                .code,
            "CHEMIN_INVALIDE"
        );
    }
}
