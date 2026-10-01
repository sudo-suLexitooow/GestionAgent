import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import type { DropSource, FolderAccess, FolderStatus } from "../core/project/ports";

/** Implémentation réelle des ports d'ouverture : plugin dialog, commande `inspect_folder`, dépôt natif. */
export const tauriFolderAccess: FolderAccess = {
  pickFolder: () => open({ directory: true, multiple: false }),
  inspectFolder: (path) => invoke<FolderStatus>("inspect_folder", { path }),
  prepareProject: () => Promise.resolve(),
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
