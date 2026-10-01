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

#[test]
fn test_securite_aucun_acces_fichier_hors_de_la_resolution_sure() {
    for (fichier, source) in MODULES_SANS_ACCES_DIRECT {
        // Code de production seulement : les tests unitaires préparent leurs dossiers.
        let production = source.split("#[cfg(test)]").next().unwrap_or_default();
        let appels: Vec<(usize, &str)> = production
            .lines()
            .enumerate()
            .filter(|(_, ligne)| {
                let code = ligne.split("//").next().unwrap_or_default();
                code.contains("fs::") || code.contains("std::fs") || code.contains("File::")
            })
            .map(|(numero, ligne)| (numero + 1, ligne.trim()))
            .collect();
        assert!(
            appels.is_empty(),
            "{fichier} accède au disque sans passer par acces.rs : {appels:?}"
        );
    }
}
