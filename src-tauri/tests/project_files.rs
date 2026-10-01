//! Intégration : lecture du contenu d'un projet sur de vrais fichiers temporaires (US-002).

use cadre_lib::project_files::{list_dir, read_file, DirEntry, EntryKind, ReadError};
use std::fs;

fn sorted(mut entries: Vec<DirEntry>) -> Vec<DirEntry> {
    entries.sort_by(|a, b| a.name.cmp(&b.name));
    entries
}

#[test]
fn test_ac_002_1_liste_les_entrees_d_un_dossier_du_projet_avec_leur_nature() {
    let project = tempfile::tempdir().unwrap();
    let skills = project.path().join(".claude/skills");
    fs::create_dir_all(skills.join("a")).unwrap();
    fs::write(skills.join("notes.txt"), "x").unwrap();

    let entries = list_dir(project.path(), ".claude/skills").unwrap().unwrap();

    assert_eq!(
        sorted(entries),
        vec![
            DirEntry {
                name: "a".into(),
                kind: EntryKind::Directory
            },
            DirEntry {
                name: "notes.txt".into(),
                kind: EntryKind::File
            },
        ]
    );
}

#[test]
fn test_ac_002_2_dossier_absent_donne_none_sans_erreur() {
    let project = tempfile::tempdir().unwrap();

    assert_eq!(list_dir(project.path(), ".claude/skills"), Ok(None));
}

/// Un projet et, à côté, un dossier étranger contenant `secret.txt`, réellement lisible.
fn project_next_to_a_secret() -> (tempfile::TempDir, std::path::PathBuf) {
    let parent = tempfile::tempdir().unwrap();
    fs::create_dir(parent.path().join("projet")).unwrap();
    fs::create_dir(parent.path().join("autre")).unwrap();
    fs::write(parent.path().join("autre/secret.txt"), "secret").unwrap();
    (parent, std::path::PathBuf::from("projet"))
}

#[test]
fn test_ac_002_1_la_lecture_refuse_tout_chemin_qui_sort_du_projet() {
    let (parent, project) = project_next_to_a_secret();
    let root = parent.path().join(project);
    let secret = parent.path().join("autre/secret.txt");
    let absolute = secret.to_str().unwrap();

    for relative in ["../autre/secret.txt", "a/../../autre/secret.txt", absolute] {
        assert_eq!(
            read_file(&root, relative),
            Err(ReadError::OutsideProject),
            "{relative}"
        );
    }
    for relative in ["..", "../autre", parent.path().to_str().unwrap()] {
        assert_eq!(
            list_dir(&root, relative),
            Err(ReadError::OutsideProject),
            "{relative}"
        );
    }
}

#[test]
fn test_ac_002_1_lit_un_fichier_du_projet_a_l_octet_pres() {
    let project = tempfile::tempdir().unwrap();
    let skill = project.path().join(".claude/skills/a");
    fs::create_dir_all(&skill).unwrap();
    // BOM, fins de ligne CRLF et octet non UTF-8 : rien n'est converti.
    let bytes = b"\xEF\xBB\xBF---\r\nname: a\r\n---\r\n\xFF".to_vec();
    fs::write(skill.join("SKILL.md"), &bytes).unwrap();

    assert_eq!(
        read_file(project.path(), ".claude/skills/a/SKILL.md"),
        Ok(Some(bytes))
    );
}

#[test]
fn test_ac_002_4_fichier_absent_donne_none_sans_erreur() {
    let project = tempfile::tempdir().unwrap();
    fs::create_dir_all(project.path().join(".claude/skills/a")).unwrap();

    assert_eq!(
        read_file(project.path(), ".claude/skills/a/SKILL.md"),
        Ok(None)
    );
}
