import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { DropSource, FolderAccess, FolderStatus } from "../core/project/ports";

/** Implémentation réelle des ports d'ouverture : plugin dialog, commande `inspect_folder`, dépôt natif. */
export const tauriFolderAccess: FolderAccess = {
  pickFolder: () => open({ directory: true, multiple: false }),
  inspectFolder: (path) => invoke<FolderStatus>("inspect_folder", { path }),
};

export const tauriDropSource: DropSource = {
  onDrop: () => Promise.resolve(() => undefined),
};
