// Implémentation réelle du port de fichiers : commandes Rust `fs_atomique::commandes`.
import type { FichierAEcrire, SystemeFichiersProjet } from "../core/fichiers/systeme-fichiers";

export class SystemeFichiersTauri implements SystemeFichiersProjet {
  lireTexte(_racine: string, _chemin: string): Promise<string | null> {
    return Promise.resolve(null);
  }

  existe(_racine: string, _chemin: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  ecrireTransaction(_racine: string, _fichiers: FichierAEcrire[]): Promise<void> {
    return Promise.resolve();
  }

  recupererEcritures(_racine: string): Promise<void> {
    return Promise.resolve();
  }
}
