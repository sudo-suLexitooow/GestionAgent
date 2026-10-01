import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import type {
  DirEntry,
  DropSource,
  FolderAccess,
  FolderStatus,
  ProjectFiles,
} from "../core/project/ports";

/** Implémentation réelle des ports d'ouverture : plugin dialog, commande `inspect_folder`, dépôt natif. */
export const tauriFolderAccess: FolderAccess = {
  pickFolder: () => open({ directory: true, multiple: false }),
  inspectFolder: (path) => invoke<FolderStatus>("inspect_folder", { path }),
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
  listDir: () => Promise.resolve<DirEntry[] | null>([]),
  readFile: () => Promise.resolve<Uint8Array | null>(new Uint8Array()),
};
