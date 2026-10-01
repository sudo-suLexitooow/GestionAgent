import { open } from "@tauri-apps/plugin-dialog";
import type { DropSource, FolderAccess } from "../core/project/ports";

/** Implémentation réelle des ports d'ouverture : plugin dialog, commande `inspect_folder`, dépôt natif. */
export const tauriFolderAccess: FolderAccess = {
  pickFolder: () => open({ directory: true, multiple: false }),
  inspectFolder: () => Promise.resolve("not-found"),
};

export const tauriDropSource: DropSource = {
  onDrop: () => Promise.resolve(() => undefined),
};
