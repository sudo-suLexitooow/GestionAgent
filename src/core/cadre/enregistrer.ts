// Enregistrement du modèle `.cadre/` (US-005).
import type { CodeErreurFichiers, SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { CadreYaml } from "./cadre-yaml";

export interface ErreurEnregistrement {
  code: CodeErreurFichiers;
  /** Libellé à afficher à l'utilisateur. */
  message: string;
  /** Détail technique (journal, rapport de bogue). */
  detail: string;
}

export type ResultatEnregistrement = { ok: true } | { ok: false; erreur: ErreurEnregistrement };

export function enregistrerCadre(
  _fs: SystemeFichiersProjet,
  _racine: string,
  _cadre: CadreYaml,
): Promise<ResultatEnregistrement> {
  return Promise.resolve({ ok: true });
}
