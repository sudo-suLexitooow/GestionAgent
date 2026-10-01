//! Intégration : lecture du contenu d'un projet sur de vrais fichiers temporaires (US-002).

use cadre_lib::project_files::{list_dir, DirEntry, EntryKind};
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
