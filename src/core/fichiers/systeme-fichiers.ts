// Port d'accès aux fichiers du projet. Implémentations : `src/platform/` (commandes Tauri)
// et `src/core/testing/` (en mémoire, pour les tests).

/** Fichier à écrire : chemin relatif à la racine du projet, séparateur `/`. */
export interface FichierAEcrire {
  chemin: string;
  contenu: string;
}

/** Codes d'erreur renvoyés par le système (commandes Rust `fs_atomique`). */
export const CODES_ERREUR_FICHIERS = [
  "LECTURE_SEULE",
  "DISQUE_PLEIN",
  "CHEMIN_INVALIDE",
  "PROJET_OCCUPE",
  "ANNULATION_INCOMPLETE",
  "RECUPERATION_IMPOSSIBLE",
  "ECHEC",
] as const;

export type CodeErreurFichiers = (typeof CODES_ERREUR_FICHIERS)[number];

export class ErreurSystemeFichiers extends Error {
  constructor(
    readonly code: CodeErreurFichiers,
    readonly detail: string,
  ) {
    super(`${code} : ${detail}`);
    this.name = "ErreurSystemeFichiers";
  }
}

/** Toute méthode rejette avec une `ErreurSystemeFichiers` en cas d'échec. */
export interface SystemeFichiersProjet {
  /** Contenu texte du fichier, `null` s'il n'existe pas. */
  lireTexte(racine: string, chemin: string): Promise<string | null>;
  existe(racine: string, chemin: string): Promise<boolean>;
  /** Vrai si le projet est dans un dépôt Git : `.git` à sa racine ou dans un dossier parent. */
  estDansUnDepotGit(racine: string): Promise<boolean>;
  /** Écrit tous les fichiers ou aucun ; la version précédente est conservée (NF-12, NF-13). */
  ecrireTransaction(racine: string, fichiers: FichierAEcrire[]): Promise<void>;
  /** Termine ou annule une écriture interrompue et supprime les temporaires (AC-005-4). */
  recupererEcritures(racine: string): Promise<void>;
}
