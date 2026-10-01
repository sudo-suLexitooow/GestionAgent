//! Test d'architecture (re-revue n°1) : dans l'écrivain atomique et ses commandes, aucun
//! accès au système de fichiers ne contourne la résolution sûre des chemins. Tous les appels
//! `std::fs` vivent dans `src/fs_atomique/acces.rs`, qui vérifie chaque segment (règle R1,
//! ni lien ni jonction) avant d'agir.

const MODULES_SANS_ACCES_DIRECT: [(&str, &str); 2] = [
    ("src/fs_atomique.rs", include_str!("../src/fs_atomique.rs")),
    (
        "src/fs_atomique/commandes.rs",
        include_str!("../src/fs_atomique/commandes.rs"),
    ),
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

#[test]
fn test_securite_aucun_acces_fichier_hors_de_la_resolution_sure() {
    for (fichier, source) in MODULES_SANS_ACCES_DIRECT {
        // Code de production seulement : le module de tests unitaires prépare ses dossiers.
        let production = source
            .split("#[cfg(test)]\nmod tests")
            .next()
            .unwrap_or_default();
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
