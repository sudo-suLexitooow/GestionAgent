//! Tests d'intégration de l'écriture atomique (US-005, zone sensible) sur de vrais dossiers
//! temporaires. Tournent en CI sous Linux, Windows et macOS (AC-005-7).

use cadre_lib::fs_atomique::{ecrire_fichiers, FichierAEcrire};
use std::fs;
use std::path::Path;
use tempfile::TempDir;

fn projet() -> TempDir {
    tempfile::tempdir().expect("dossier temporaire")
}

fn ecrire(racine: &Path, chemin: &str, contenu: &str) {
    let cible = racine.join(chemin);
    fs::create_dir_all(cible.parent().unwrap()).unwrap();
    fs::write(cible, contenu).unwrap();
}

fn lire(racine: &Path, chemin: &str) -> Option<String> {
    fs::read_to_string(racine.join(chemin)).ok()
}

/// Fichiers restant dans `.cadre/tmp/` (vide ou absent = aucun temporaire résiduel).
fn temporaires(racine: &Path) -> Vec<String> {
    let mut noms = Vec::new();
    let mut a_visiter = vec![racine.join(".cadre/tmp")];
    while let Some(dossier) = a_visiter.pop() {
        let Ok(entrees) = fs::read_dir(&dossier) else {
            continue;
        };
        for entree in entrees {
            let chemin = entree.unwrap().path();
            noms.push(chemin.display().to_string());
            if chemin.is_dir() {
                a_visiter.push(chemin);
            }
        }
    }
    noms
}

mod transaction_reussie {
    use super::*;

    #[test]
    fn test_ac_005_3_tous_les_fichiers_sont_ecrits_et_aucun_temporaire_ne_reste() {
        let dossier = projet();
        let racine = dossier.path();
        ecrire(racine, ".cadre/cadre.yaml", "ancien cadre\n");
        ecrire(racine, ".gitignore", "node_modules\n");

        ecrire_fichiers(
            racine,
            &[
                FichierAEcrire::new(".cadre/cadre.yaml", "nouveau cadre\n"),
                FichierAEcrire::new(".gitignore", "node_modules\n.cadre/tmp/\n"),
                FichierAEcrire::new(".cadre/agents/frontend.yaml", "name: frontend\n"),
            ],
        )
        .expect("écriture réussie");

        assert_eq!(
            lire(racine, ".cadre/cadre.yaml").as_deref(),
            Some("nouveau cadre\n")
        );
        assert_eq!(
            lire(racine, ".gitignore").as_deref(),
            Some("node_modules\n.cadre/tmp/\n")
        );
        assert_eq!(
            lire(racine, ".cadre/agents/frontend.yaml").as_deref(),
            Some("name: frontend\n")
        );
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
}
