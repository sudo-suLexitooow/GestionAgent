// Chargement du modèle `.cadre/` à la réouverture d'un projet (US-006). Lecture seule.
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "../skills/skill";

export type CodeErreurModele =
  | "CADRE_MISSING"
  | "ENCODING"
  | "YAML_SYNTAX"
  | "YAML_DUPLICATE_KEY"
  | "SCHEMA"
  | "UNREADABLE"
  | "TOO_LARGE";

/** Erreur d'un fichier du modèle : chemin relatif au projet et, si connue, ligne (1 = première). */
export interface ErreurFichierModele {
  fichier: string;
  code: CodeErreurModele;
  ligne?: number;
}

export type AgentCharge =
  | {
      fichier: string;
      statut: "ok";
      donnees: Record<string, unknown>;
      /** Octets bruts de `agents/<nom>.md`, `null` s'il est absent. */
      instructions: Uint8Array | null;
    }
  | { fichier: string; statut: "erreur"; erreur: ErreurFichierModele };

export interface ContexteCharge {
  entree: Record<string, unknown>;
  /** Octets bruts de `contexte/<nom>.md`, `null` s'il est absent ou illisible. */
  contenu: Uint8Array | null;
}

export interface ModeleCadre {
  cadre: Record<string, unknown>;
  agents: AgentCharge[];
  contextes: ContexteCharge[];
  skills: ListedSkill[];
}

export type ChargementModele =
  | { etat: "aucun" }
  | { etat: "incomplet"; erreur: ErreurFichierModele }
  | { etat: "charge"; lectureSeule: boolean; modele: ModeleCadre };

export function chargerModele(_files: ProjectFiles, _root: string): Promise<ChargementModele> {
  return Promise.resolve({
    etat: "charge",
    lectureSeule: false,
    modele: { cadre: {}, agents: [], contextes: [], skills: [] },
  });
}
