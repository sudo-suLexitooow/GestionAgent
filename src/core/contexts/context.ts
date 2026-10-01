// Contextes du modèle `.cadre/` (ADR-001, D2) : métadonnées dans `cadre.yaml`, contenu brut dans
// `.cadre/contexte/<nom>.md`, à l'octet près.

/** Type d'un contexte (`cadre.yaml`, `contexts[].type`). */
export type ContextType = "projet" | "conventions" | "architecture" | "autre";

/** Fichier de contexte qu'un outil (ou le format générique) dépose à la racine du projet. */
export interface ContextFileSpec {
  /** Nom du fichier à la racine du projet (ex. `CLAUDE.md`). */
  file: string;
  /** Nom Cadre du contexte importé (`cadreName`). */
  name: string;
  type: ContextType;
  /** Miroir importé, ni édité ni exporté (AGENTS.md au MVP 0, Q-04). */
  readonly?: boolean;
}
