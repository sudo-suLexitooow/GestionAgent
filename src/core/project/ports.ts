// Ports d'ouverture d'un projet (PRJ-01). Le cœur ne connaît que ces interfaces :
// l'implémentation réelle (Tauri) vit dans `src/platform/`, le faux en mémoire dans `src/core/testing/`.

/** État d'un chemin sur le disque, tel que le rapporte la commande système `inspect_folder`. */
export type FolderStatus = "ok" | "not-found" | "not-a-directory" | "unreadable";

/** Accès au sélecteur de dossier et au système de fichiers, limité à ce que l'ouverture exige. */
export interface FolderAccess {
  /** Ouvre le sélecteur de dossier ; `null` si l'utilisateur annule. */
  pickFolder(): Promise<string | null>;
  /** Vérifie qu'un chemin est un dossier existant et lisible. */
  inspectFolder(path: string): Promise<FolderStatus>;
  /**
   * Ouvre le projet côté système : la racine est retenue par Rust (seule racine où lire et
   * écrire) et une écriture interrompue est terminée ou annulée (AC-005-4). Rejette en cas d'échec.
   */
  prepareProject(path: string): Promise<void>;
}

/** Nature d'une entrée de dossier ; `other` : ni fichier ni dossier (lien cassé, périphérique…). */
export type EntryKind = "file" | "directory" | "other";

export interface DirEntry {
  name: string;
  kind: EntryKind;
}

/** Motif de refus d'une lecture, tel que le rapportent les commandes système. */
export type ReadError = "outside-project" | "unreadable" | "too-large";

/** Rejet d'une lecture du projet : porte le motif rapporté par la commande système. */
export class ProjectReadError extends Error {
  constructor(readonly reason: ReadError) {
    super(reason);
    this.name = "ProjectReadError";
  }
}

/**
 * Lecture seule du contenu d'un projet (SKL-01, PRJ-02). `path` est relatif à la racine `root`,
 * séparateur `/` ; un chemin relatif qui sortirait de la racine fournie (`..`, chemin absolu) est
 * refusé. Ni la racine elle-même ni les liens symboliques (suivis) ne sont contrôlés.
 * Un élément absent donne `null` ; un échec rejette avec un `ProjectReadError`.
 */
export interface ProjectFiles {
  /** Entrées du dossier ; `null` s'il est absent ou si ce n'est pas un dossier. */
  listDir(root: string, path: string): Promise<DirEntry[] | null>;
  /**
   * Octets bruts du fichier, sans aucune conversion (encodage, fins de ligne). Seul un fichier
   * ordinaire de 8 Mio au plus est lu (sinon `unreadable` ou `too-large`).
   */
  readFile(root: string, path: string): Promise<Uint8Array | null>;
}

/** Source des chemins déposés par glisser-déposer dans la fenêtre. */
export interface DropSource {
  /** Abonne `listener` aux dépôts ; renvoie la fonction de désabonnement. */
  onDrop(listener: (paths: string[]) => void): Promise<() => void>;
}
