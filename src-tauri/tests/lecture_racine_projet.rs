//! Intégration (US-076, zone sensible « portée ») : les lectures ne se font que dans le projet
//! ouvert par `ouvrir_projet`, sur de vrais fichiers temporaires. Un fichier témoin, hors du
//! projet, ne doit jamais être lu.

use cadre_lib::fs_atomique::commandes::{ouvrir, ProjetOuvert};
use cadre_lib::project_files::{list_dir, read_file, DirEntry, EntryKind, ReadError};
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

/// Crée `lien` pointant vers le dossier `cible` : lien symbolique sous Unix, jonction sous
/// Windows (pas de droits administrateur nécessaires).
fn lier_dossier(cible: &Path, lien: &Path) {
    fs::create_dir_all(lien.parent().unwrap()).unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(cible, lien).unwrap();
    #[cfg(windows)]
    {
        // `mklink` attend des `\` : normalise les `/` venus des chemins relatifs du test.
        let normaliser = |chemin: &Path| chemin.components().collect::<std::path::PathBuf>();
        let statut = std::process::Command::new("cmd")
            .args(["/C", "mklink", "/J"])
            .arg(normaliser(lien))
            .arg(normaliser(cible))
            .status()
            .unwrap();
        assert!(statut.success(), "création de la jonction");
    }
}

/// Un projet ouvert dont `.claude/skills` est un lien (jonction sous Windows) vers un dossier
/// extérieur contenant une skill témoin `a/SKILL.md`.
fn projet_avec_skills_liees_a_l_exterieur() -> (tempfile::TempDir, tempfile::TempDir, ProjetOuvert)
{
    let projet = tempfile::tempdir().unwrap();
    let exterieur = dossier_exterieur();
    fs::create_dir(exterieur.path().join("a")).unwrap();
    fs::write(exterieur.path().join("a/SKILL.md"), TEMOIN).unwrap();
    lier_dossier(exterieur.path(), &projet.path().join(".claude/skills"));
    let etat = ouvert(projet.path());
    (projet, exterieur, etat)
}

#[test]
fn test_ac_076_3_un_lien_sur_un_dossier_parent_vers_l_exterieur_est_refuse() {
    let (projet, _exterieur, etat) = projet_avec_skills_liees_a_l_exterieur();

    assert_eq!(
        read_file(&etat, projet.path(), ".claude/skills/a/SKILL.md"),
        Err(ReadError::Link)
    );
    assert_eq!(
        list_dir(&etat, projet.path(), ".claude/skills"),
        Err(ReadError::Link)
    );
    assert_eq!(
        list_dir(&etat, projet.path(), ".claude/skills/a"),
        Err(ReadError::Link)
    );
}

#[test]
fn test_ac_076_3_un_lien_liste_est_signale_comme_lien_sans_etre_suivi() {
    let (projet, _exterieur, etat) = projet_avec_skills_liees_a_l_exterieur();

    assert_eq!(
        list_dir(&etat, projet.path(), ".claude"),
        Ok(Some(vec![DirEntry {
            name: "skills".into(),
            kind: EntryKind::Link
        }]))
    );
}

#[test]
fn test_ac_076_3_les_commandes_refusent_un_lien_vers_l_exterieur() {
    let (projet, _exterieur, _etat) = projet_avec_skills_liees_a_l_exterieur();
    let root = projet.path();

    let lecture = invoke_in_open_project(
        root,
        "read_project_file",
        json!({ "root": root, "path": ".claude/skills/a/SKILL.md" }),
    );
    let listing = invoke_in_open_project(
        root,
        "list_project_dir",
        json!({ "root": root, "path": ".claude" }),
    );

    assert_eq!(lecture, Err(json!("link")));
    assert_eq!(listing, Ok(json!([{ "name": "skills", "kind": "link" }])));
}

/// Décision de l'orchestrateur (US-076) : aucun lien n'est suivi en lecture, même s'il reste
/// dans le projet (une skill partagée par lien est « en erreur : lien non pris en charge »).
#[test]
fn test_ac_076_3_un_lien_vers_un_dossier_du_projet_n_est_pas_suivi() {
    let projet = tempfile::tempdir().unwrap();
    fs::create_dir_all(projet.path().join("partage/a")).unwrap();
    fs::write(projet.path().join("partage/a/SKILL.md"), "interne").unwrap();
    lier_dossier(
        &projet.path().join("partage"),
        &projet.path().join(".claude/skills"),
    );
    let etat = ouvert(projet.path());

    assert_eq!(
        read_file(&etat, projet.path(), ".claude/skills/a/SKILL.md"),
        Err(ReadError::Link)
    );
    assert_eq!(
        list_dir(&etat, projet.path(), ".claude/skills"),
        Err(ReadError::Link)
    );
}

/// Formes de chemin Windows (lecteur, chemins étendus, UNC, `\`, noms réservés, noms courts
/// 8.3, point ou espace final) : refusées sur toutes les plateformes, avant tout accès au disque.
#[test]
fn test_ac_076_3_les_prefixes_et_noms_speciaux_windows_sont_refuses_partout() {
    let projet = tempfile::tempdir().unwrap();
    let etat = ouvert(projet.path());

    for relative in [
        r"C:relatif",
        r"C:\x",
        r"\\?\C:\x",
        r"\\srv\share\x",
        "//srv/share/x",
        r"\x",
        r"a\..\..\x",
        "CON",
        "nul.txt",
        "GIT~1/config",
        ".git/config",
        "a./SKILL.md",
        "a /SKILL.md",
        "./CLAUDE.md",
        "a//b",
    ] {
        assert_eq!(
            read_file(&etat, projet.path(), relative),
            Err(ReadError::OutsideProject),
            "{relative}"
        );
        assert_eq!(
            list_dir(&etat, projet.path(), relative),
            Err(ReadError::OutsideProject),
            "{relative}"
        );
    }
}

/// Liens symboliques de fichiers : créés sans privilège seulement sous Unix (`cfg(unix)`).
#[cfg(unix)]
mod liens_de_fichiers_unix {
    use super::*;
    use std::os::unix::fs::symlink;

    #[test]
    fn test_ac_076_3_un_lien_de_fichier_vers_l_exterieur_est_refuse() {
        let projet = tempfile::tempdir().unwrap();
        let exterieur = dossier_exterieur();
        symlink(
            exterieur.path().join("temoin.txt"),
            projet.path().join("CLAUDE.md"),
        )
        .unwrap();
        let etat = ouvert(projet.path());

        assert_eq!(
            read_file(&etat, projet.path(), "CLAUDE.md"),
            Err(ReadError::Link)
        );
        assert_eq!(
            list_dir(&etat, projet.path(), ""),
            Ok(Some(vec![DirEntry {
                name: "CLAUDE.md".into(),
                kind: EntryKind::Link
            }]))
        );
    }

    #[test]
    fn test_ac_076_3_un_lien_de_fichier_interne_n_est_pas_suivi() {
        let projet = tempfile::tempdir().unwrap();
        fs::write(projet.path().join("vrai.md"), "interne").unwrap();
        symlink(
            projet.path().join("vrai.md"),
            projet.path().join("CLAUDE.md"),
        )
        .unwrap();
        let etat = ouvert(projet.path());

        assert_eq!(
            read_file(&etat, projet.path(), "CLAUDE.md"),
            Err(ReadError::Link)
        );
    }
}

/// Droits Unix : exigent un utilisateur non root (la CI ; en local, `setpriv`).
#[cfg(unix)]
mod droits_unix {
    use super::*;
    use std::os::unix::fs::PermissionsExt;

    #[test]
    fn test_ac_076_3_un_fichier_sans_droit_de_lecture_est_illisible() {
        let projet = tempfile::tempdir().unwrap();
        let fichier = projet.path().join("CLAUDE.md");
        fs::write(&fichier, "secret").unwrap();
        fs::set_permissions(&fichier, fs::Permissions::from_mode(0o000)).unwrap();
        let etat = ouvert(projet.path());

        assert_eq!(
            read_file(&etat, projet.path(), "CLAUDE.md"),
            Err(ReadError::Unreadable)
        );
    }

    #[test]
    fn test_ac_076_3_un_dossier_sans_droit_de_lecture_est_illisible() {
        let projet = tempfile::tempdir().unwrap();
        let dossier = projet.path().join(".claude");
        fs::create_dir(&dossier).unwrap();
        fs::set_permissions(&dossier, fs::Permissions::from_mode(0o000)).unwrap();
        let etat = ouvert(projet.path());

        let resultat = list_dir(&etat, projet.path(), ".claude");
        fs::set_permissions(&dossier, fs::Permissions::from_mode(0o755)).unwrap();

        assert_eq!(resultat, Err(ReadError::Unreadable));
    }
}
