//! Intégration : lecture du contenu d'un projet sur de vrais fichiers temporaires (US-002).

use cadre_lib::project_files::{
    list_dir, read_file, DirEntry, EntryKind, ReadError, MAX_FILE_SIZE,
};
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

#[test]
fn test_ac_002_2_un_fichier_a_la_place_du_dossier_donne_none_sans_erreur() {
    let project = tempfile::tempdir().unwrap();
    fs::create_dir(project.path().join(".claude")).unwrap();
    fs::write(project.path().join(".claude/skills"), "pas un dossier").unwrap();
    fs::write(project.path().join(".cadre"), "pas un modèle").unwrap();

    assert_eq!(list_dir(project.path(), ".claude/skills"), Ok(None));
    assert_eq!(list_dir(project.path(), ".cadre"), Ok(None));
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

/// Un projet contenant, à `.claude/skills/a/SKILL.md`, ce que `create` y place.
fn project_with_skill_md(create: impl FnOnce(&std::path::Path)) -> tempfile::TempDir {
    let project = tempfile::tempdir().unwrap();
    let skill = project.path().join(".claude/skills/a");
    fs::create_dir_all(&skill).unwrap();
    create(&skill.join("SKILL.md"));
    project
}

#[test]
fn test_ac_002_3_un_fichier_au_plafond_de_taille_est_lu() {
    let project = project_with_skill_md(|path| {
        fs::write(path, vec![b'a'; MAX_FILE_SIZE as usize]).unwrap();
    });

    let bytes = read_file(project.path(), ".claude/skills/a/SKILL.md");

    assert_eq!(bytes.map(|b| b.map(|b| b.len())), Ok(Some(8 * 1024 * 1024)));
}

#[test]
fn test_ac_002_3_un_fichier_au_dela_du_plafond_de_taille_est_refuse() {
    let project = project_with_skill_md(|path| {
        fs::write(path, vec![b'a'; MAX_FILE_SIZE as usize + 1]).unwrap();
    });

    let bytes = read_file(project.path(), ".claude/skills/a/SKILL.md");

    assert_eq!(bytes.map(|b| b.map(|b| b.len())), Err(ReadError::TooLarge));
}

#[test]
fn test_ac_002_3_un_dossier_n_est_pas_lu_comme_un_fichier() {
    let project = project_with_skill_md(|path| fs::create_dir(path).unwrap());

    assert_eq!(
        read_file(project.path(), ".claude/skills/a/SKILL.md"),
        Err(ReadError::Unreadable)
    );
}

/// Fichiers spéciaux et liens symboliques : compilés seulement sous Linux et macOS (`cfg(unix)`),
/// où `/dev/zero`, les FIFO et les liens sans privilège existent. Aucun test désactivé.
#[cfg(unix)]
mod fichiers_speciaux_unix {
    use super::*;
    use std::os::unix::fs::symlink;
    use std::sync::mpsc;
    use std::time::Duration;

    /// Lit `.claude/skills/a/SKILL.md` dans un fil séparé et échoue si la lecture ne rend pas la main
    /// en 2 secondes : un fichier spécial ne doit ni bloquer ni être lu sans fin (le test non plus).
    fn read_skill_md_without_blocking(
        project: &tempfile::TempDir,
    ) -> Result<Option<Vec<u8>>, ReadError> {
        let root = project.path().to_path_buf();
        let (sender, receiver) = mpsc::channel();
        std::thread::spawn(move || {
            let _ = sender.send(read_file(&root, ".claude/skills/a/SKILL.md"));
        });
        receiver
            .recv_timeout(Duration::from_secs(2))
            .expect("la lecture bloque ou ne finit pas")
    }

    #[test]
    fn test_ac_002_3_un_lien_vers_dev_zero_est_refuse_sans_bloquer() {
        let project = project_with_skill_md(|path| symlink("/dev/zero", path).unwrap());

        assert_eq!(
            read_skill_md_without_blocking(&project),
            Err(ReadError::Unreadable)
        );
    }

    #[test]
    fn test_ac_002_3_une_fifo_est_refusee_sans_bloquer() {
        let project = project_with_skill_md(|path| {
            let status = std::process::Command::new("mkfifo")
                .arg(path)
                .status()
                .unwrap();
            assert!(status.success());
        });

        assert_eq!(
            read_skill_md_without_blocking(&project),
            Err(ReadError::Unreadable)
        );
    }

    #[test]
    fn test_ac_002_1_un_lien_vers_un_fichier_du_projet_est_lu() {
        let project = project_with_skill_md(|path| {
            fs::write(path.with_file_name("vrai.md"), "contenu").unwrap();
            symlink(path.with_file_name("vrai.md"), path).unwrap();
        });

        assert_eq!(
            read_file(project.path(), ".claude/skills/a/SKILL.md"),
            Ok(Some(b"contenu".to_vec()))
        );
    }

    #[test]
    fn test_ac_002_1_un_lien_vers_un_dossier_est_liste_comme_dossier_et_un_lien_casse_comme_autre()
    {
        let project = tempfile::tempdir().unwrap();
        let shared = tempfile::tempdir().unwrap();
        let skills = project.path().join(".claude/skills");
        fs::create_dir_all(&skills).unwrap();
        symlink(shared.path(), skills.join("partagee")).unwrap();
        symlink(project.path().join("disparu"), skills.join("cassee")).unwrap();

        let entries = list_dir(project.path(), ".claude/skills").unwrap().unwrap();

        assert_eq!(
            sorted(entries),
            vec![
                DirEntry {
                    name: "cassee".into(),
                    kind: EntryKind::Other
                },
                DirEntry {
                    name: "partagee".into(),
                    kind: EntryKind::Directory
                },
            ]
        );
    }
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

#[test]
fn test_ac_003_1_un_chemin_vide_liste_la_racine_et_ses_fichiers_de_contexte() {
    let project = tempfile::tempdir().unwrap();
    fs::write(project.path().join("CLAUDE.md"), "# Projet\r\n").unwrap();
    fs::write(project.path().join("AGENTS.md"), "# Agents\n").unwrap();
    fs::create_dir(project.path().join(".cadre")).unwrap();

    let entries = list_dir(project.path(), "").unwrap().unwrap();

    assert_eq!(
        sorted(entries),
        vec![
            DirEntry {
                name: ".cadre".into(),
                kind: EntryKind::Directory
            },
            DirEntry {
                name: "AGENTS.md".into(),
                kind: EntryKind::File
            },
            DirEntry {
                name: "CLAUDE.md".into(),
                kind: EntryKind::File
            },
        ]
    );
}

/// Formes de chemin propres à Windows (lecteur relatif, chemins étendus, UNC, racine du lecteur,
/// `\` comme séparateur) : compilées seulement sous Windows (`cfg(windows)`), où elles ont ce sens.
/// Sous Linux et macOS, `\` est un caractère ordinaire d'un nom de fichier. Aucun test désactivé.
#[cfg(windows)]
mod chemins_windows {
    use super::*;

    #[test]
    fn test_ac_002_1_la_lecture_refuse_les_prefixes_et_racines_windows() {
        let project = tempfile::tempdir().unwrap();

        for relative in [
            r"C:relatif",
            r"\\?\C:\x",
            r"\\srv\share\x",
            "//srv/share/x",
            r"\x",
            r"a\..\..\x",
        ] {
            assert_eq!(
                read_file(project.path(), relative),
                Err(ReadError::OutsideProject),
                "{relative}"
            );
            assert_eq!(
                list_dir(project.path(), relative),
                Err(ReadError::OutsideProject),
                "{relative}"
            );
        }
    }
}
