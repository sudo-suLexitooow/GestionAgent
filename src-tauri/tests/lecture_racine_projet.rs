//! Intégration (US-076, zone sensible « portée ») : les lectures ne se font que dans le projet
//! ouvert par `ouvrir_projet`, sur de vrais fichiers temporaires. Un fichier témoin, hors du
//! projet, ne doit jamais être lu.

use cadre_lib::fs_atomique::commandes::{ouvrir, ProjetOuvert};
use cadre_lib::project_files::{list_dir, read_file, ReadError};
use serde_json::json;
use std::fs;
use std::path::Path;

mod common;
use common::{invoke, invoke_in_open_project};

const TEMOIN: &str = "contenu du fichier témoin";

/// Dossier hors de tout projet ouvert, avec `temoin.txt` réellement lisible.
fn dossier_exterieur() -> tempfile::TempDir {
    let dossier = tempfile::tempdir().unwrap();
    fs::write(dossier.path().join("temoin.txt"), TEMOIN).unwrap();
    dossier
}

fn ouvert(racine: &Path) -> ProjetOuvert {
    let etat = ProjetOuvert::default();
    ouvrir(&etat, racine.to_str().unwrap()).expect("ouverture du projet");
    etat
}

#[test]
fn test_ac_076_1_aucun_projet_ouvert_les_lectures_sont_refusees() {
    let exterieur = dossier_exterieur();
    let etat = ProjetOuvert::default();

    assert_eq!(
        read_file(&etat, exterieur.path(), "temoin.txt"),
        Err(ReadError::OutsideProject)
    );
    assert_eq!(
        list_dir(&etat, exterieur.path(), ""),
        Err(ReadError::OutsideProject)
    );
}

#[test]
fn test_ac_076_1_aucun_projet_ouvert_les_commandes_de_lecture_sont_refusees() {
    let exterieur = dossier_exterieur();

    for (cmd, path) in [
        ("read_project_file", "temoin.txt"),
        ("list_project_dir", ""),
    ] {
        let reponse = invoke(cmd, json!({ "root": exterieur.path(), "path": path }));

        assert_eq!(reponse, Err(json!("outside-project")), "{cmd}");
    }
}

#[test]
fn test_ac_076_2_une_autre_racine_que_le_projet_ouvert_est_refusee() {
    let projet = tempfile::tempdir().unwrap();
    let exterieur = dossier_exterieur();
    let etat = ouvert(projet.path());

    assert_eq!(
        read_file(&etat, exterieur.path(), "temoin.txt"),
        Err(ReadError::OutsideProject)
    );
    assert_eq!(
        list_dir(&etat, exterieur.path(), ""),
        Err(ReadError::OutsideProject)
    );
}

#[test]
fn test_ac_076_2_une_racine_parente_du_projet_ouvert_est_refusee() {
    let parent = dossier_exterieur();
    let projet = parent.path().join("projet");
    fs::create_dir(&projet).unwrap();
    let etat = ouvert(&projet);

    assert_eq!(
        read_file(&etat, parent.path(), "temoin.txt"),
        Err(ReadError::OutsideProject)
    );
    assert_eq!(
        list_dir(&etat, parent.path(), ""),
        Err(ReadError::OutsideProject)
    );
}

#[test]
fn test_ac_076_2_les_commandes_refusent_une_autre_racine_que_le_projet_ouvert() {
    let projet = tempfile::tempdir().unwrap();
    let exterieur = dossier_exterieur();

    for (cmd, path) in [
        ("read_project_file", "temoin.txt"),
        ("list_project_dir", ""),
    ] {
        let reponse = invoke_in_open_project(
            projet.path(),
            cmd,
            json!({ "root": exterieur.path(), "path": path }),
        );

        assert_eq!(reponse, Err(json!("outside-project")), "{cmd}");
    }
}

#[test]
fn test_ac_076_2_une_racine_equivalente_au_projet_ouvert_est_acceptee() {
    let projet = tempfile::tempdir().unwrap();
    fs::write(projet.path().join("CLAUDE.md"), "# Projet").unwrap();
    let etat = ouvert(projet.path());
    let equivalente = projet.path().join(".");

    assert_eq!(
        read_file(&etat, &equivalente, "CLAUDE.md"),
        Ok(Some(b"# Projet".to_vec()))
    );
}
