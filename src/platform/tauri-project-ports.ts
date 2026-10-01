import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import {
  ProjectReadError,
  type DirEntry,
  type DropSource,
  type FolderAccess,
  type FolderStatus,
  type ProjectFiles,
  type ProjectWarning,
  type ReadError,
} from "../core/project/ports";

/** Implémentation réelle des ports d'ouverture : plugin dialog, commande `inspect_folder`, dépôt natif. */
export const tauriFolderAccess: FolderAccess = {
  pickFolder: () => open({ directory: true, multiple: false }),
  inspectFolder: (path) => invoke<FolderStatus>("inspect_folder", { path }),
  prepareProject: (path) => invoke<ProjectWarning | null>("ouvrir_projet", { chemin: path }),
};

export const tauriDropSource: DropSource = {
  onDrop: (listener) => {
    // Hors d'une fenêtre Tauri (navigateur de `npm run dev`, tests), il n'y a pas de dépôt natif.
    if (!isTauri()) return Promise.resolve(() => undefined);
    return getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "drop") listener(event.payload.paths);
    });
  },
};

/** Lecture seule du projet par les commandes `list_project_dir` et `read_project_file`. */
export const tauriProjectFiles: ProjectFiles = {
  listDir: (root, path) => invokeReading<DirEntry[] | null>("list_project_dir", { root, path }),
  // Les octets arrivent en tableau JSON de nombres (`Vec<u8>` côté Rust).
  readFile: async (root, path) => {
    const bytes = await invokeReading<number[] | null>("read_project_file", { root, path });
    return bytes === null ? null : Uint8Array.from(bytes);
  },
};

const READ_ERRORS: readonly unknown[] = [
  "outside-project",
  "unreadable",
  "too-large",
] satisfies ReadError[];

/** Appelle une commande de lecture ; tout rejet devient un `ProjectReadError` (inconnu : illisible). */
async function invokeReading<T>(cmd: string, args: Record<string, string>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    throw new ProjectReadError(READ_ERRORS.includes(error) ? (error as ReadError) : "unreadable");
  }
}
