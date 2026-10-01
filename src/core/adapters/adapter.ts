// Interface d'adaptateur (NF-19) : tout ce qui est propre à un outil (Claude Code, Codex…) vit
// derrière elle, dans `src/core/adapters/<outil>/`. Le reste du cœur ne connaît que ce contrat.
import type { ContextFileSpec } from "../contexts/context";
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "../skills/skill";

export interface ToolAdapter {
  /** Identifiant de l'outil, tel qu'inscrit dans `cadre.yaml` (`tools`). */
  readonly id: string;
  /** Nom de l'outil affiché à l'utilisateur (choix de l'outil cible d'un agent, AC-007-2) ; à défaut, `id`. */
  readonly name?: string;
  /** Fichiers de contexte propres à l'outil, à la racine du projet (ex. `CLAUDE.md`) ; aucun si absent. */
  readonly contextFiles?: readonly ContextFileSpec[];
  /** Skills présentes dans les dossiers natifs de l'outil, triées par dossier (lecture seule). */
  detectSkills(files: ProjectFiles, root: string): Promise<ListedSkill[]>;
}

/** Agent du modèle, tel que le reçoit un adaptateur pour l'export (US-008). */
export interface AgentAExporter {
  /** UUID v4, identité stable (ADR-001, D3). */
  id: string;
  name: string;
  /** Rôle (instructions de l'agent) ; `""` s'il est absent. */
  role: string;
  /** `""` si elle est absente. */
  description: string;
}

/** Partie du modèle `.cadre/` exportée vers un outil : les agents dont il est la cible. */
export interface ModeleAExporter {
  agents: readonly AgentAExporter[];
}

/** Raison pour laquelle un adaptateur refuse d'exporter le modèle : code stable et détail. */
export interface ProblemeExport {
  code: string;
  detail: string;
}

/** Fichier natif produit par un adaptateur, inscrit dans `.cadre/generated.yaml` (ADR-001, D5). */
export interface FichierExporte {
  /** Relatif au projet, séparateur `/`. */
  chemin: string;
  /** Texte, écrit en UTF-8. */
  contenu: string;
  /** Origine dans le modèle : `agent:<id>`, `skill:<nom>` ou `contexts`. */
  source: string;
}

/** Port d'export (ADP-01) : le cœur appelle `valider`, puis `exporter` s'il n'y a aucun problème. */
export interface AdaptateurExport {
  /** Identifiant de l'outil, inscrit comme `adapter` dans le manifeste. */
  readonly id: string;
  /** Problèmes qui empêchent l'export ; aucun : le modèle est exportable. */
  valider(modele: ModeleAExporter): ProblemeExport[];
  /** Fichiers natifs de l'outil, sans rien écrire. */
  exporter(modele: ModeleAExporter): FichierExporte[];
}
