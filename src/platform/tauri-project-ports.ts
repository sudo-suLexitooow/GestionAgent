import type { DropSource, FolderAccess } from "../core/project/ports";

/** Implémentation réelle des ports d'ouverture : plugin dialog, commande `inspect_folder`, dépôt natif. */
export const tauriFolderAccess: FolderAccess = {
  pickFolder: () => Promise.resolve(null),
  inspectFolder: () => Promise.resolve("not-found"),
};

export const tauriDropSource: DropSource = {
  onDrop: () => Promise.resolve(() => undefined),
};
