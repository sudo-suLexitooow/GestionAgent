//! Intégration : les commandes Tauri de lecture du projet telles que les appelle l'interface (US-002).
//! Vérifie le nom des commandes, leurs arguments et le format JSON attendu par `ProjectFiles` (TS).

use serde_json::{json, Value};
use std::fs;

mod common;
use common::invoke;

#[test]
fn test_ac_002_1_commande_list_project_dir_renvoie_les_entrees() {
    let project = tempfile::tempdir().unwrap();
    fs::create_dir_all(project.path().join(".claude/skills/a")).unwrap();

    let response = invoke(
        "list_project_dir",
        json!({ "root": project.path(), "path": ".claude/skills" }),
    );

    assert_eq!(response, Ok(json!([{ "name": "a", "kind": "directory" }])));
}

#[test]
fn test_ac_002_2_commande_list_project_dir_renvoie_null_pour_un_dossier_absent() {
    let project = tempfile::tempdir().unwrap();

    let response = invoke(
        "list_project_dir",
        json!({ "root": project.path(), "path": ".claude/skills" }),
    );

    assert_eq!(response, Ok(Value::Null));
}

#[test]
fn test_ac_002_1_commande_read_project_file_renvoie_les_octets() {
    let project = tempfile::tempdir().unwrap();
    fs::write(project.path().join("SKILL.md"), b"a\r\n\xFF").unwrap();

    let response = invoke(
        "read_project_file",
        json!({ "root": project.path(), "path": "SKILL.md" }),
    );

    assert_eq!(response, Ok(json!([97, 13, 10, 255])));
}

#[test]
fn test_ac_002_4_commande_read_project_file_renvoie_null_pour_un_fichier_absent() {
    let project = tempfile::tempdir().unwrap();

    let response = invoke(
        "read_project_file",
        json!({ "root": project.path(), "path": "SKILL.md" }),
    );

    assert_eq!(response, Ok(Value::Null));
}

#[test]
fn test_ac_002_1_commandes_de_lecture_refusent_un_chemin_hors_du_projet() {
    let parent = tempfile::tempdir().unwrap();
    fs::create_dir(parent.path().join("projet")).unwrap();
    fs::write(parent.path().join("secret.txt"), "secret").unwrap();
    let root = parent.path().join("projet");

    for cmd in ["read_project_file", "list_project_dir"] {
        let response = invoke(cmd, json!({ "root": root, "path": "../secret.txt" }));

        assert_eq!(response, Err(json!("outside-project")), "{cmd}");
    }
}
