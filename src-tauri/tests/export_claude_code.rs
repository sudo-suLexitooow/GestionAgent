//! Intégration US-008 (zone sensible) : le lot d'un export vers Claude Code
//! (`.claude/agents/<nom>.md` et `.cadre/generated.yaml`) passe par l'écriture atomique
//! d'US-005 sur de vrais fichiers. Tourne en CI sous Linux, Windows et macOS.

use cadre_lib::fs_atomique::commandes::{ouvrir, ProjetOuvert};
use cadre_lib::fs_atomique::{
    ecrire_fichiers, ecrire_fichiers_avec, ErreurEcriture, Etape, FichierAEcrire, PointsDeControle,
};
use cadre_lib::project_files::{read_file, ReadError};
use std::fs;
use std::io;
use std::path::Path;
use tempfile::TempDir;

const AGENT: &str = ".claude/agents/frontend.md";
const MANIFESTE: &str = ".cadre/generated.yaml";

fn ecrire(racine: &Path, chemin: &str, contenu: &str) {
    let cible = racine.join(chemin);
    fs::create_dir_all(cible.parent().unwrap()).unwrap();
    fs::write(cible, contenu).unwrap();
}

fn lire(racine: &Path, chemin: &str) -> Option<String> {
    fs::read_to_string(racine.join(chemin)).ok()
}

/// Projet avec un modèle, un sous-agent déjà exporté et le manifeste qui l'inscrit.
fn projet_exporte() -> TempDir {
    let dossier = tempfile::tempdir().expect("dossier temporaire");
    ecrire(dossier.path(), ".cadre/cadre.yaml", "schema_version: 1\n");
    ecrire(dossier.path(), AGENT, "---\nname: frontend\n---\nancien\n");
    ecrire(dossier.path(), MANIFESTE, "files: []\n");
    dossier
}

/// Lot d'un export de deux agents : un fichier remplacé, un créé, le manifeste.
fn lot_export() -> Vec<FichierAEcrire> {
    vec![
        FichierAEcrire::new(AGENT, "---\nname: frontend\n---\nnouveau\n"),
        FichierAEcrire::new(".claude/agents/backend.md", "---\nname: backend\n---\n"),
        FichierAEcrire::new(MANIFESTE, "files:\n  - path: .claude/agents/frontend.md\n"),
    ]
}

fn assert_projet_inchange(racine: &Path) {
    assert_eq!(
        lire(racine, AGENT).as_deref(),
        Some("---\nname: frontend\n---\nancien\n")
    );
    assert_eq!(lire(racine, ".claude/agents/backend.md"), None);
    assert_eq!(lire(racine, MANIFESTE).as_deref(), Some("files: []\n"));
}

/// Crée `lien` vers le dossier `cible` : lien symbolique sous Unix, jonction sous Windows.
fn lier_dossier(cible: &Path, lien: &Path) {
    fs::create_dir_all(lien.parent().unwrap()).unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(cible, lien).unwrap();
    #[cfg(windows)]
    {
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

/// Dossier hors du projet, avec un sous-agent témoin qui ne doit jamais être touché.
fn dossier_victime() -> TempDir {
    let victime = tempfile::tempdir().expect("dossier temporaire");
    ecrire(victime.path(), "frontend.md", "précieux");
    ecrire(victime.path(), "agents/frontend.md", "précieux");
    victime
}

fn assert_victime_intacte(victime: &Path) {
    assert_eq!(lire(victime, "frontend.md").as_deref(), Some("précieux"));
    assert_eq!(
        lire(victime, "agents/frontend.md").as_deref(),
        Some("précieux")
    );
    assert_eq!(lire(victime, "backend.md"), None);
    assert_eq!(lire(victime, "agents/backend.md"), None);
}

fn ouvert(racine: &Path) -> ProjetOuvert {
    let etat = ProjetOuvert::default();
    ouvrir(&etat, racine.to_str().unwrap()).expect("ouverture du projet");
    etat
}

/// `.claude` ou `.claude/agents` remplacé par un lien vers un dossier hors du projet : l'export
/// est refusé, rien n'est écrit, ni dans le projet ni hors de lui.
fn assert_lien_refuse(dossier_lie: &str) {
    let victime = dossier_victime();
    let dossier = projet_exporte();
    let racine = dossier.path();
    fs::remove_dir_all(racine.join(".claude")).unwrap();
    let cible = if dossier_lie == ".claude" {
        victime.path().to_path_buf()
    } else {
        fs::create_dir_all(racine.join(".claude")).unwrap();
        victime.path().join("agents")
    };
    lier_dossier(&cible, &racine.join(dossier_lie));

    let lecture = read_file(&ouvert(racine), racine, AGENT);
    let ecriture = ecrire_fichiers(racine, &lot_export());

    assert!(matches!(lecture, Err(ReadError::Link)), "{lecture:?}");
    assert!(
        matches!(ecriture, Err(ErreurEcriture::CheminInvalide(_))),
        "{ecriture:?}"
    );
    assert_victime_intacte(victime.path());
    assert_eq!(lire(racine, MANIFESTE).as_deref(), Some("files: []\n"));
}

#[test]
fn test_ac_008_4_dossier_claude_en_lien_lecture_et_ecriture_refusees_rien_n_est_ecrit() {
    assert_lien_refuse(".claude");
}

#[test]
fn test_ac_008_4_dossier_claude_agents_en_lien_lecture_et_ecriture_refusees_rien_n_est_ecrit() {
    assert_lien_refuse(".claude/agents");
}

#[cfg(unix)]
#[test]
fn test_ac_008_4_sous_agent_en_lien_vers_un_fichier_externe_n_est_ni_lu_ni_ecrase() {
    let victime = dossier_victime();
    let dossier = projet_exporte();
    let racine = dossier.path();
    fs::remove_file(racine.join(AGENT)).unwrap();
    std::os::unix::fs::symlink(victime.path().join("frontend.md"), racine.join(AGENT)).unwrap();

    let lecture = read_file(&ouvert(racine), racine, AGENT);
    let ecriture = ecrire_fichiers(racine, &lot_export());

    assert!(matches!(lecture, Err(ReadError::Link)), "{lecture:?}");
    assert!(
        matches!(ecriture, Err(ErreurEcriture::CheminInvalide(_))),
        "{ecriture:?}"
    );
    assert_victime_intacte(victime.path());
    assert_eq!(lire(racine, MANIFESTE).as_deref(), Some("files: []\n"));
}

/// Panne injectée : l'opération système échoue à l'étape donnée.
struct ErreurA(Etape);

impl PointsDeControle for ErreurA {
    fn atteint(&self, etape: Etape) -> io::Result<()> {
        if etape == self.0 {
            return Err(io::Error::other(format!("panne simulée à {etape:?}")));
        }
        Ok(())
    }
}

#[test]
fn test_ac_008_3_erreur_au_milieu_de_l_export_aucun_fichier_modifie() {
    for etape in [
        Etape::TemporaireEcrit(1),
        Etape::AvantRemplacement,
        Etape::FichierRemplace(0),
        Etape::FichierRemplace(1),
        Etape::FichierRemplace(2),
    ] {
        let dossier = projet_exporte();
        let racine = dossier.path();

        let resultat = ecrire_fichiers_avec(racine, &lot_export(), &ErreurA(etape));

        assert!(resultat.is_err(), "{etape:?}");
        assert_projet_inchange(racine);
    }
}

#[test]
fn test_ac_008_1_le_lot_d_export_est_ecrit_en_entier_et_le_sous_agent_relu_a_l_octet_pres() {
    let dossier = projet_exporte();
    let racine = dossier.path();

    ecrire_fichiers(racine, &lot_export()).expect("export écrit");

    assert_eq!(
        read_file(&ouvert(racine), racine, AGENT).unwrap(),
        Some(b"---\nname: frontend\n---\nnouveau\n".to_vec())
    );
    assert_eq!(
        lire(racine, ".claude/agents/backend.md").as_deref(),
        Some("---\nname: backend\n---\n")
    );
}

/// Vrai si le système de fichiers de `dossier` ne distingue pas `A` de `a` (APFS, NTFS).
fn insensible_a_la_casse(dossier: &Path) -> bool {
    fs::write(dossier.join("Sonde-Casse"), "x").unwrap();
    let insensible = fs::symlink_metadata(dossier.join("sonde-casse")).is_ok();
    fs::remove_file(dossier.join("Sonde-Casse")).unwrap();
    insensible
}

/// Revue n° 1 de la PR #16 : un `Frontend.md` écrit par l'utilisateur et l'export de
/// `frontend.md`. Sous Windows et macOS (insensibles à la casse), la lecture de `frontend.md`
/// trouve `Frontend.md` : le cœur le voit existant et hors manifeste, et demande une
/// confirmation (testé dans le cœur) ; même confirmé, son contenu est conservé dans
/// `.cadre/backups/`. Sous Linux, ce sont deux fichiers : aucun n'est perdu.
#[test]
fn test_ac_008_4_frontend_md_et_frontend_md_majuscule_existant_demande_confirmation() {
    let dossier = tempfile::tempdir().expect("dossier temporaire");
    let racine = dossier.path();
    ecrire(racine, ".cadre/cadre.yaml", "schema_version: 1\n");
    ecrire(racine, ".claude/agents/Frontend.md", "écrit à la main\n");
    let lot = [FichierAEcrire::new(AGENT, "---\nname: frontend\n---\n")];

    let lecture = read_file(&ouvert(racine), racine, AGENT).expect("lecture");

    if insensible_a_la_casse(racine) {
        // Existant pour le cœur : `ECRASEMENT_A_CONFIRMER`, jamais d'écrasement silencieux.
        assert_eq!(lecture, Some("écrit à la main\n".as_bytes().to_vec()));
        ecrire_fichiers(racine, &lot).expect("écrasement confirmé");
        assert_eq!(
            lire(racine, &format!(".cadre/backups/{AGENT}")).as_deref(),
            Some("écrit à la main\n")
        );
    } else {
        assert_eq!(lecture, None);
        ecrire_fichiers(racine, &lot).expect("export écrit");
        assert_eq!(
            lire(racine, ".claude/agents/Frontend.md").as_deref(),
            Some("écrit à la main\n")
        );
        assert_eq!(
            lire(racine, AGENT).as_deref(),
            Some("---\nname: frontend\n---\n")
        );
    }
}
