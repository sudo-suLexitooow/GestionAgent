// Enregistrement du modèle `.cadre/` (US-005).
import {
  ErreurSystemeFichiers,
  type CodeErreurFichiers,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../fichiers/systeme-fichiers";
import { DossierLieError } from "../project/dossier-lie";
import type { SkillImportFailure } from "../skills/import-skills";
import { serialiserCadre, type CadreYaml } from "./cadre-yaml";
import { completerGitignore } from "./gitignore";

/**
 * Codes d'erreur d'enregistrement : ceux du système de fichiers (AC-005-6), plus les refus décidés
 * avant toute écriture (US-077) : `SOURCE_MODIFIEE` (un fichier importé a changé depuis l'import,
 * détail = son chemin) et `MODELE_EXISTANT` (un modèle `.cadre/` est apparu entre-temps) ; et
 * (US-007) `MODELE_NON_MODIFIABLE` (modèle incomplet ou d'un format plus récent, détail = son
 * chemin) et `AGENT_EXISTANT` (un agent du même nom, casse comprise, est apparu, détail = le nom).
 */
export type CodeErreurEnregistrement =
  | CodeErreurFichiers
  | "SOURCE_MODIFIEE"
  | "MODELE_EXISTANT"
  | "MODELE_NON_MODIFIABLE"
  | "AGENT_EXISTANT";

/** Erreur d'enregistrement : code stable (libellé dans `src/ui/i18n/`, AC-005-6) et détail. */
export interface ErreurEnregistrement {
  code: CodeErreurEnregistrement;
  /** Détail technique (journal, rapport de bogue). */
  detail: string;
}

/**
 * Résultat d'un enregistrement. `skillsNonImportees` : skills de l'outil qui n'ont pas pu être
 * copiées dans le modèle créé (US-004), présent seulement s'il y en a.
 */
export type ResultatEnregistrement =
  | { ok: true; skillsNonImportees?: SkillImportFailure[] }
  | { ok: false; erreur: ErreurEnregistrement };

/**
 * Écrit `.cadre/cadre.yaml` et, dans un projet Git, complète le `.gitignore` racine :
 * le tout en une seule transaction (tout ou rien).
 */
export function enregistrerCadre(
  fs: SystemeFichiersProjet,
  racine: string,
  cadre: CadreYaml,
): Promise<ResultatEnregistrement> {
  return enregistrerFichiers(fs, racine, [
    { chemin: ".cadre/cadre.yaml", contenu: serialiserCadre(cadre) },
  ]);
}

/**
 * Écrit `fichiers` et, dans un projet Git, complète le `.gitignore` racine : le tout en une seule
 * transaction (tout ou rien), seul chemin d'écriture du projet (US-005).
 */
export async function enregistrerFichiers(
  fs: SystemeFichiersProjet,
  racine: string,
  fichiers: readonly FichierAEcrire[],
): Promise<ResultatEnregistrement> {
  try {
    const lot = [...fichiers];
    if (await fs.estDansUnDepotGit(racine)) {
      const gitignore = completerGitignore(await fs.lireTexte(racine, ".gitignore"));
      if (gitignore !== null) lot.push({ chemin: ".gitignore", contenu: gitignore });
    }
    await fs.ecrireTransaction(racine, lot);
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: versErreurEnregistrement(erreur) };
  }
}

export function versErreurEnregistrement(erreur: unknown): ErreurEnregistrement {
  if (erreur instanceof ErreurSystemeFichiers) {
    return { code: erreur.code, detail: erreur.detail };
  }
  // Un dossier lié (p. ex. `.cadre`) : refus nommé, comme le fait l'écriture côté système (US-079).
  if (erreur instanceof DossierLieError) return { code: "CHEMIN_INVALIDE", detail: erreur.chemin };
  return { code: "ECHEC", detail: erreur instanceof Error ? erreur.message : String(erreur) };
}
