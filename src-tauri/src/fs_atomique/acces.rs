//! Seul point d'accès au disque de l'écrivain atomique et de ses commandes (re-revue n°1).
//!
//! Toute opération sur un chemin du projet passe par [`Projet::reel`], qui :
//! - applique la règle R1 (ADR-001 D4) à chaque segment du chemin relatif ;
//! - vérifie, sans jamais suivre de lien, que chaque segment existant n'est ni un lien
//!   symbolique ni une jonction, et que chaque segment intermédiaire est un vrai dossier.
//!
//! Les lectures exigent en plus un fichier ordinaire (pas de dossier, FIFO, périphérique).
//! Le test d'architecture `tests/architecture_fichiers.rs` vérifie qu'aucun autre fichier de
//! `fs_atomique` n'appelle `std::fs`.

use super::segment_portable;
use std::fmt;
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

/// Chemin refusé par la résolution sûre.
#[derive(Debug)]
pub struct CheminRefuse(pub String);

impl fmt::Display for CheminRefuse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for CheminRefuse {}

pub fn refus(message: String) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, CheminRefuse(message))
}

/// Message du refus si `erreur` vient de la résolution sûre.
pub fn motif_de_refus(erreur: &io::Error) -> Option<String> {
    erreur
        .get_ref()
        .and_then(|interne| interne.downcast_ref::<CheminRefuse>())
        .map(|refus| refus.0.clone())
}

/// Nature d'une entrée, lue sans suivre les liens.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Genre {
    Fichier,
    Dossier,
    /// Lien symbolique, jonction, FIFO, périphérique…
    Autre,
}

fn genre_de(meta: &fs::Metadata) -> Genre {
    let type_ = meta.file_type();
    if type_.is_symlink() {
        Genre::Autre
    } else if type_.is_dir() {
        Genre::Dossier
    } else if type_.is_file() {
        Genre::Fichier
    } else {
        Genre::Autre
    }
}

/// Verrou exclusif du système, libéré par l'OS si le processus meurt.
pub struct Verrou {
    /// Tenu ouvert : le verrou dure tant que le fichier est ouvert.
    _fichier: File,
}

/// Racine d'un projet ; les chemins sont relatifs, séparateur `/` (`""` = la racine).
pub struct Projet {
    racine: PathBuf,
}

impl Projet {
    pub fn new(racine: &Path) -> Self {
        Self {
            racine: racine.to_path_buf(),
        }
    }

    /// Chemin absolu à afficher dans un message (aucun accès au disque).
    pub fn afficher(&self, relatif: &str) -> String {
        self.racine.join(relatif).display().to_string()
    }

    /// Résolution sûre d'un chemin relatif (voir le commentaire du module).
    pub fn reel(&self, relatif: &str) -> io::Result<PathBuf> {
        let mut courant = self.racine.clone();
        if relatif.is_empty() {
            return Ok(courant);
        }
        let segments: Vec<&str> = relatif.split('/').collect();
        if let Some(segment) = segments.iter().find(|segment| !segment_portable(segment)) {
            return Err(refus(format!("{relatif} : segment refusé ({segment:?})")));
        }
        let mut existe = true;
        for (i, segment) in segments.iter().enumerate() {
            courant.push(segment);
            if !existe {
                continue;
            }
            match fs::symlink_metadata(&courant) {
                Ok(meta) => {
                    let genre = genre_de(&meta);
                    let dernier = i + 1 == segments.len();
                    if meta.file_type().is_symlink() {
                        return Err(refus(format!(
                            "{relatif} : passe par un lien symbolique ou une jonction"
                        )));
                    }
                    if !dernier && genre != Genre::Dossier {
                        return Err(refus(format!(
                            "{relatif} : un dossier parent n'est pas un dossier"
                        )));
                    }
                }
                Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => existe = false,
                Err(erreur) => return Err(erreur),
            }
        }
        Ok(courant)
    }

    /// Nature de l'entrée, `None` si elle n'existe pas.
    pub fn genre(&self, relatif: &str) -> io::Result<Option<Genre>> {
        match fs::symlink_metadata(self.reel(relatif)?) {
            Ok(meta) => Ok(Some(genre_de(&meta))),
            Err(erreur) if erreur.kind() == io::ErrorKind::NotFound => Ok(None),
            Err(erreur) => Err(erreur),
        }
    }

    pub fn existe(&self, relatif: &str) -> io::Result<bool> {
        Ok(self.genre(relatif)?.is_some())
    }

    /// Octets d'un fichier ordinaire, `None` s'il n'existe pas.
    pub fn lire(&self, relatif: &str) -> io::Result<Option<Vec<u8>>> {
        match self.genre(relatif)? {
            None => Ok(None),
            Some(Genre::Fichier) => fs::read(self.reel(relatif)?).map(Some),
            Some(_) => Err(refus(format!("{relatif} n'est pas un fichier ordinaire"))),
        }
    }

    /// Crée un fichier qui ne doit pas exister, écrit son contenu et le synchronise (fsync).
    pub fn creer_nouveau(&self, relatif: &str, contenu: &[u8]) -> io::Result<()> {
        let mut fichier = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(self.reel(relatif)?)?;
        fichier.write_all(contenu)?;
        fichier.sync_all()
    }

    /// Crée les dossiers manquants, un segment à la fois, chacun revérifié.
    pub fn creer_dossiers(&self, relatif: &str) -> io::Result<()> {
        if relatif.is_empty() {
            return Ok(());
        }
        let segments: Vec<&str> = relatif.split('/').collect();
        for fin in 1..=segments.len() {
            let dossier = segments[..fin].join("/");
            match self.genre(&dossier)? {
                Some(Genre::Dossier) => {}
                Some(_) => return Err(refus(format!("{dossier} n'est pas un dossier"))),
                None => match fs::create_dir(self.reel(&dossier)?) {
                    Ok(()) => {}
                    Err(erreur) if erreur.kind() == io::ErrorKind::AlreadyExists => {
                        if self.genre(&dossier)? != Some(Genre::Dossier) {
                            return Err(refus(format!("{dossier} n'est pas un dossier")));
                        }
                    }
                    Err(erreur) => return Err(erreur),
                },
            }
        }
        Ok(())
    }

    /// Renommage atomique (remplace la cible sous Windows comme sous Unix).
    pub fn renommer(&self, de: &str, vers: &str) -> io::Result<()> {
        fs::rename(self.reel(de)?, self.reel(vers)?)
    }

    pub fn supprimer_fichier(&self, relatif: &str) -> io::Result<()> {
        match self.genre(relatif)? {
            Some(Genre::Fichier) => fs::remove_file(self.reel(relatif)?),
            None => Err(io::Error::from(io::ErrorKind::NotFound)),
            Some(_) => Err(refus(format!("{relatif} n'est pas un fichier ordinaire"))),
        }
    }

    /// Supprime un dossier seulement s'il est vide.
    pub fn supprimer_dossier_vide(&self, relatif: &str) -> io::Result<()> {
        match self.genre(relatif)? {
            Some(Genre::Dossier) => fs::remove_dir(self.reel(relatif)?),
            _ => Err(refus(format!("{relatif} n'est pas un dossier"))),
        }
    }

    /// Supprime un vrai dossier et son contenu (`remove_dir_all` ne suit pas les liens).
    pub fn supprimer_arbre(&self, relatif: &str) -> io::Result<()> {
        match self.genre(relatif)? {
            Some(Genre::Dossier) => fs::remove_dir_all(self.reel(relatif)?),
            None => Ok(()),
            Some(_) => Err(refus(format!("{relatif} n'est pas un dossier"))),
        }
    }

    /// Entrées d'un vrai dossier (nom UTF-8, nature sans suivre les liens) ; vide s'il
    /// n'existe pas.
    pub fn lister(&self, relatif: &str) -> io::Result<Vec<(String, Genre)>> {
        match self.genre(relatif)? {
            None => return Ok(Vec::new()),
            Some(Genre::Dossier) => {}
            Some(_) => return Err(refus(format!("{relatif} n'est pas un dossier"))),
        }
        let mut entrees = Vec::new();
        for entree in fs::read_dir(self.reel(relatif)?)? {
            let entree = entree?;
            let Ok(nom) = entree.file_name().into_string() else {
                continue;
            };
            let genre = match entree.file_type()? {
                t if t.is_symlink() => Genre::Autre,
                t if t.is_dir() => Genre::Dossier,
                t if t.is_file() => Genre::Fichier,
                _ => Genre::Autre,
            };
            entrees.push((nom, genre));
        }
        Ok(entrees)
    }

    /// Rend durable un renommage dans `relatif` (Unix). Sous Windows, NTFS journalise les
    /// métadonnées et un dossier ne s'ouvre pas comme un fichier : rien à faire.
    pub fn synchroniser_dossier(&self, relatif: &str) -> io::Result<()> {
        let dossier = self.reel(relatif)?;
        #[cfg(unix)]
        File::open(dossier)?.sync_all()?;
        #[cfg(not(unix))]
        let _ = dossier;
        Ok(())
    }

    /// Prend le verrou exclusif du fichier `relatif` (créé s'il manque) ; `None` si une
    /// autre instance le tient.
    pub fn verrouiller(&self, relatif: &str) -> io::Result<Option<Verrou>> {
        match self.genre(relatif)? {
            None | Some(Genre::Fichier) => {}
            Some(_) => return Err(refus(format!("{relatif} n'est pas un fichier ordinaire"))),
        }
        let fichier = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(self.reel(relatif)?)?;
        match fichier.try_lock() {
            Ok(()) => Ok(Some(Verrou { _fichier: fichier })),
            Err(fs::TryLockError::WouldBlock) => Ok(None),
            Err(fs::TryLockError::Error(erreur)) => Err(erreur),
        }
    }

    /// Supprime le fichier du verrou PUIS le relâche : aucune autre instance ne peut
    /// prendre entre-temps un verrou sur un fichier voué à disparaître.
    pub fn supprimer_puis_liberer(&self, verrou: Verrou, relatif: &str) {
        let _ = self.supprimer_fichier(relatif);
        drop(verrou);
    }
}

/// Chemin canonique (liens résolus) d'un dossier choisi par l'utilisateur.
pub fn canonique(chemin: &str) -> io::Result<PathBuf> {
    fs::canonicalize(chemin)
}

pub fn est_dossier(chemin: &Path) -> bool {
    chemin.is_dir()
}

/// Vrai si `.git` existe à la racine ou dans un de ses dossiers parents (sans le suivre).
pub fn git_dans_un_ancetre(racine: &Path) -> bool {
    racine
        .ancestors()
        .any(|dossier| fs::symlink_metadata(dossier.join(".git")).is_ok())
}
