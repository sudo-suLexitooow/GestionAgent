//! Tests d'intégration de l'écriture atomique (US-005, zone sensible) sur de vrais dossiers
//! temporaires. Tournent en CI sous Linux, Windows et macOS (AC-005-7).

use cadre_lib::fs_atomique::{
    ecrire_fichiers, ecrire_fichiers_avec, Etape, FichierAEcrire, PointsDeControle,
};
use std::fs;
use std::io;
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

/// Panne injectée : l'opération système échoue à l'étape donnée (erreur d'entrée-sortie).
struct ErreurA(Etape);

impl PointsDeControle for ErreurA {
    fn atteint(&self, etape: Etape) -> io::Result<()> {
        if etape == self.0 {
            return Err(io::Error::other(format!("panne simulée à {etape:?}")));
        }
        Ok(())
    }
}

/// Projet avec deux fichiers déjà modifiés par l'utilisateur, et l'enregistrement qui
/// les réécrit en en créant un troisième.
fn projet_existant() -> (TempDir, Vec<FichierAEcrire>) {
    let dossier = projet();
    ecrire(
        dossier.path(),
        ".cadre/cadre.yaml",
        "schema_version: 1 # retouché à la main\n",
    );
    ecrire(dossier.path(), ".gitignore", "node_modules\r\n# perso\r\n");
    let fichiers = vec![
        FichierAEcrire::new(".cadre/cadre.yaml", "schema_version: 1\n"),
        FichierAEcrire::new(".gitignore", "node_modules\r\n# perso\r\n.cadre/tmp/\r\n"),
        FichierAEcrire::new(".cadre/agents/frontend.yaml", "name: frontend\n"),
    ];
    (dossier, fichiers)
}

fn assert_projet_inchange(racine: &Path) {
    assert_eq!(
        lire(racine, ".cadre/cadre.yaml").as_deref(),
        Some("schema_version: 1 # retouché à la main\n")
    );
    assert_eq!(
        lire(racine, ".gitignore").as_deref(),
        Some("node_modules\r\n# perso\r\n")
    );
    assert_eq!(lire(racine, ".cadre/agents/frontend.yaml"), None);
}

mod interruption_apres_le_premier_fichier {
    use super::*;

    #[test]
    fn test_ac_005_3_erreur_apres_le_premier_fichier_aucun_fichier_modifie() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::FichierRemplace(0)));

        assert!(resultat.is_err(), "l'erreur doit être remontée");
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_erreur_apres_le_deuxieme_fichier_aucun_fichier_modifie() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::FichierRemplace(1)));

        assert!(resultat.is_err());
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }

    #[test]
    fn test_ac_005_3_erreur_apres_le_dernier_fichier_le_fichier_cree_est_retire() {
        let (dossier, fichiers) = projet_existant();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &fichiers, &ErreurA(Etape::FichierRemplace(2)));

        assert!(resultat.is_err());
        assert_projet_inchange(racine);
        assert_eq!(temporaires(racine), Vec::<String>::new());
    }
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
