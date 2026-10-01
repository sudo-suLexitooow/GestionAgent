//! Test d'architecture (re-revue n°1, US-076) : dans l'écrivain atomique, ses commandes et les
//! commandes de lecture du projet, aucun accès au système de fichiers ne contourne la
//! résolution sûre des chemins. Tous les appels `std::fs` vivent dans
//! `src/fs_atomique/acces.rs`, qui vérifie chaque segment (règle R1, ni lien ni jonction)
//! avant d'agir.

const MODULES_SANS_ACCES_DIRECT: [(&str, &str); 4] = [
    ("src/fs_atomique.rs", include_str!("../src/fs_atomique.rs")),
    (
        "src/fs_atomique/commandes.rs",
        include_str!("../src/fs_atomique/commandes.rs"),
    ),
    (
        "src/project_files.rs",
        include_str!("../src/project_files.rs"),
    ),
    ("src/commands.rs", include_str!("../src/commands.rs")),
];

/// `std::fs` et les méthodes de `Path` qui interrogent le disque (elles suivent les liens).
const ACCES_DISQUE: [&str; 11] = [
    "fs::",
    "std::fs",
    "File::",
    ".exists(",
    ".is_dir(",
    ".is_file(",
    ".metadata(",
    ".symlink_metadata(",
    ".read_dir(",
    ".canonicalize(",
    ".read_link(",
];

/// Code de production seulement : coupe au module de tests unitaires (`#[cfg(test)]` suivi
/// de `mod tests`), qui prépare ses dossiers avec `std::fs`.
fn code_de_production(source: &str) -> String {
    source
        .replace("\r\n", "\n")
        .split("#[cfg(test)]\nmod tests")
        .next()
        .unwrap_or_default()
        .to_owned()
}

/// Sous Windows, le checkout Git peut convertir les fins de ligne en CRLF.
#[test]
fn test_securite_decoupage_du_module_de_tests_independant_des_fins_de_ligne() {
    let source = "fn prod() {}\r\n\r\n#[cfg(test)]\r\nmod tests {\r\n    use std::fs;\r\n}\r\n";

    let production = code_de_production(source);

    assert!(production.contains("fn prod()"), "{production:?}");
    assert!(!production.contains("std::fs"), "{production:?}");
}

#[test]
fn test_securite_aucun_acces_fichier_hors_de_la_resolution_sure() {
    for (fichier, source) in MODULES_SANS_ACCES_DIRECT {
        let production = code_de_production(source);
        let appels: Vec<(usize, &str)> = production
            .lines()
            .enumerate()
            .filter(|(_, ligne)| {
                let code = ligne.split("//").next().unwrap_or_default();
                ACCES_DISQUE.iter().any(|motif| code.contains(motif))
            })
            .map(|(numero, ligne)| (numero + 1, ligne.trim()))
            .collect();
        assert!(
            appels.is_empty(),
            "{fichier} accède au disque sans passer par acces.rs : {appels:?}"
        );
    }
}
