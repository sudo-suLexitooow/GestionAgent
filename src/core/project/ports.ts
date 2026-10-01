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

/** Source des chemins déposés par glisser-déposer dans la fenêtre. */
export interface DropSource {
  /** Abonne `listener` aux dépôts ; renvoie la fonction de désabonnement. */
  onDrop(listener: (paths: string[]) => void): Promise<() => void>;
}
