// Implémentation réelle du port de fichiers : commandes Rust `fs_atomique::commandes`.
import { invoke, type InvokeArgs } from "@tauri-apps/api/core";
import {
  CODES_ERREUR_FICHIERS,
  ErreurSystemeFichiers,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../core/fichiers/systeme-fichiers";

function versErreur(erreur: unknown): ErreurSystemeFichiers {
  if (typeof erreur === "object" && erreur !== null && "code" in erreur && "detail" in erreur) {
    const codeConnu = CODES_ERREUR_FICHIERS.find((code) => code === erreur.code) ?? "ECHEC";
    return new ErreurSystemeFichiers(codeConnu, String(erreur.detail));
  }
  return new ErreurSystemeFichiers("ECHEC", String(erreur));
}

async function appeler<T>(commande: string, args: InvokeArgs): Promise<T> {
  try {
    return await invoke<T>(commande, args);
  } catch (erreur) {
    throw versErreur(erreur);
  }
}

export class SystemeFichiersTauri implements SystemeFichiersProjet {
  lireTexte(racine: string, chemin: string): Promise<string | null> {
    return appeler("lire_fichier_projet", { racine, chemin });
  }

  estDansUnDepotGit(racine: string): Promise<boolean> {
    return appeler("projet_dans_un_depot_git", { racine });
  }

  existe(racine: string, chemin: string): Promise<boolean> {
    return appeler("chemin_projet_existe", { racine, chemin });
  }

  ecrireTransaction(racine: string, fichiers: FichierAEcrire[]): Promise<void> {
    return appeler("ecrire_fichiers_projet", { racine, fichiers });
  }

  recupererEcritures(racine: string): Promise<void> {
    return appeler("recuperer_ecritures_projet", { racine });
  }
}
