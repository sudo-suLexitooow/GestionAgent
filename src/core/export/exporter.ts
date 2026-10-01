// Export du modèle `.cadre/` vers un outil (US-008) : le cœur ne connaît que le port d'export.
import type { AdaptateurExport } from "../adapters/adapter";
import type { CodeErreurEnregistrement } from "../cadre/enregistrer";
import type { SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { ProjectFiles } from "../project/ports";

/**
 * Codes d'erreur de l'export : ceux de l'enregistrement, plus les refus décidés avant toute
 * écriture : `MODELE_INVALIDE` (agent en erreur ou refusé par l'adaptateur), `ECRASEMENT_A_CONFIRMER`
 * (fichier existant non généré par Cadre, ou modifié depuis), `FICHIER_LIEN`, `FICHIER_ILLISIBLE`
 * (fichier existant que Cadre ne peut pas lire) et `MANIFESTE_INVALIDE` (`.cadre/generated.yaml`).
 */
export type CodeErreurExport =
  | CodeErreurEnregistrement
  | "MODELE_INVALIDE"
  | "ECRASEMENT_A_CONFIRMER"
  | "FICHIER_LIEN"
  | "FICHIER_ILLISIBLE"
  | "MANIFESTE_INVALIDE";

export interface ErreurExport {
  code: CodeErreurExport;
  detail: string;
}

export interface OptionsExport {
  /** Fichiers dont l'utilisateur a explicitement confirmé l'écrasement (AC-008-4). */
  confirmes?: readonly string[];
}

export type ResultatExport =
  { ok: true; fichiers: string[] } | { ok: false; erreur: ErreurExport; aConfirmer?: string[] };

/* eslint-disable @typescript-eslint/no-unused-vars -- squelette avant implémentation (RED) */
export function exporterModele(
  _disque: { fichiers: ProjectFiles; systeme: SystemeFichiersProjet },
  _racine: string,
  _adaptateur: AdaptateurExport,
  _options?: OptionsExport,
): Promise<ResultatExport> {
  return Promise.resolve({ ok: false, erreur: { code: "ECHEC", detail: "non implémenté" } });
}
/* eslint-enable @typescript-eslint/no-unused-vars */
