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
   * écrire) et une écriture interrompue est terminée ou annulée (AC-005-4). Une reprise
   * impossible n'empêche pas l'ouverture : elle est renvoyée comme avertissement. Rejette
   * seulement si le dossier ne peut pas être ouvert.
   */
  prepareProject(path: string): Promise<ProjectWarning | null>;
}

/** Avertissement de la préparation : code du système (`PROJET_OCCUPE`…) et détail. */
export interface ProjectWarning {
  code: string;
  detail: string;
}

/**
 * Nature d'une entrée de dossier, lue sans suivre les liens. `link` : lien symbolique ou jonction
 * (jamais suivi, US-076) ; `other` : ni fichier, ni dossier, ni lien (FIFO, périphérique…).
 */
export type EntryKind = "file" | "directory" | "link" | "other";

export interface DirEntry {
  name: string;
  kind: EntryKind;
}

/**
 * Motif de refus d'une lecture, tel que le rapportent les commandes système. `outside-project` :
 * aucun projet ouvert, racine autre que celle du projet ouvert, ou chemin refusé (`..`, absolu,
 * préfixe ou nom réservé Windows) ; `link` : le chemin passe par un lien ou une jonction (US-076).
 */
export type ReadError = "outside-project" | "unreadable" | "too-large" | "link";

/** Rejet d'une lecture du projet : porte le motif rapporté par la commande système. */
export class ProjectReadError extends Error {
  constructor(readonly reason: ReadError) {
    super(reason);
    this.name = "ProjectReadError";
  }
}

/** Raison affichable d'un échec de lecture d'un fichier : trop gros, lien, sinon illisible. */
export function readFailureReason(error: unknown): "unreadable" | "too-large" | "link" {
  if (
    error instanceof ProjectReadError &&
    (error.reason === "too-large" || error.reason === "link")
  )
    return error.reason;
  return "unreadable";
}

/**
 * Lecture seule du contenu d'un projet (SKL-01, PRJ-02). `path` est relatif à la racine `root`,
 * séparateur `/` (`""` désigne la racine elle-même) ; un chemin relatif qui sortirait de la racine fournie (`..`, chemin absolu) est
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
