// Enregistrement du modèle `.cadre/` (US-005).
import {
  ErreurSystemeFichiers,
  type CodeErreurFichiers,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../fichiers/systeme-fichiers";
import { serialiserCadre, type CadreYaml } from "./cadre-yaml";
import { completerGitignore } from "./gitignore";

/** Erreur d'enregistrement : code stable (libellé dans `src/ui/i18n/`, AC-005-6) et détail. */
export interface ErreurEnregistrement {
  code: CodeErreurFichiers;
  /** Détail technique (journal, rapport de bogue). */
  detail: string;
}

export type ResultatEnregistrement = { ok: true } | { ok: false; erreur: ErreurEnregistrement };

/**
 * Écrit `.cadre/cadre.yaml` et, dans un projet Git, complète le `.gitignore` racine :
 * le tout en une seule transaction (tout ou rien).
 */
export async function enregistrerCadre(
  fs: SystemeFichiersProjet,
  racine: string,
  cadre: CadreYaml,
): Promise<ResultatEnregistrement> {
  try {
    const fichiers: FichierAEcrire[] = [
      { chemin: ".cadre/cadre.yaml", contenu: serialiserCadre(cadre) },
    ];
    if (await fs.estDansUnDepotGit(racine)) {
      const gitignore = completerGitignore(await fs.lireTexte(racine, ".gitignore"));
      if (gitignore !== null) fichiers.push({ chemin: ".gitignore", contenu: gitignore });
    }
    await fs.ecrireTransaction(racine, fichiers);
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: versErreurEnregistrement(erreur) };
  }
}

function versErreurEnregistrement(erreur: unknown): ErreurEnregistrement {
  if (erreur instanceof ErreurSystemeFichiers) {
    return { code: erreur.code, detail: erreur.detail };
  }
  return { code: "ECHEC", detail: erreur instanceof Error ? erreur.message : String(erreur) };
}
