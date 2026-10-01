// Enregistrement du modèle `.cadre/` (US-005).
import {
  ErreurSystemeFichiers,
  type CodeErreurFichiers,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../fichiers/systeme-fichiers";
import { serialiserCadre, type CadreYaml } from "./cadre-yaml";
import { completerGitignore } from "./gitignore";

export interface ErreurEnregistrement {
  code: CodeErreurFichiers;
  /** Libellé à afficher à l'utilisateur. */
  message: string;
  /** Détail technique (journal, rapport de bogue). */
  detail: string;
}

export type ResultatEnregistrement = { ok: true } | { ok: false; erreur: ErreurEnregistrement };

const RASSURANCE = "Vos fichiers n'ont pas été modifiés.";

/** Libellés utilisateur (fr, Q-22) des erreurs d'enregistrement (AC-005-6). */
export const MESSAGES_ERREUR_ENREGISTREMENT: Record<CodeErreurFichiers, string> = {
  LECTURE_SEULE: `Enregistrement impossible : le dossier du projet est en lecture seule ou son accès est refusé. ${RASSURANCE}`,
  DISQUE_PLEIN: `Enregistrement impossible : le disque est plein. Libérez de l'espace puis réessayez. ${RASSURANCE}`,
  CHEMIN_INVALIDE: `Enregistrement impossible : un chemin de fichier est invalide. ${RASSURANCE}`,
  PROJET_OCCUPE:
    "Le projet est en cours d'enregistrement par une autre fenêtre de Cadre. Réessayez.",
  ANNULATION_INCOMPLETE:
    "L'enregistrement a échoué et n'a pas pu être entièrement annulé ; Cadre terminera l'annulation à la prochaine opération.",
  RECUPERATION_IMPOSSIBLE:
    "Enregistrement impossible : une écriture interrompue n'a pas pu être reprise. Elle a été mise de côté sans rien supprimer (voir le détail) ; réessayez pour enregistrer.",
  ECHEC: `Enregistrement impossible à cause d'une erreur inattendue. ${RASSURANCE}`,
};

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
    return {
      code: erreur.code,
      message: MESSAGES_ERREUR_ENREGISTREMENT[erreur.code],
      detail: erreur.detail,
    };
  }
  return {
    code: "ECHEC",
    message: MESSAGES_ERREUR_ENREGISTREMENT.ECHEC,
    detail: erreur instanceof Error ? erreur.message : String(erreur),
  };
}
