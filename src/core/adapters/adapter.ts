// Interface d'adaptateur (NF-19) : tout ce qui est propre à un outil (Claude Code, Codex…) vit
// derrière elle, dans `src/core/adapters/<outil>/`. Le reste du cœur ne connaît que ce contrat.
import type { ContextFileSpec } from "../contexts/context";
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "../skills/skill";

export interface ToolAdapter {
  /** Identifiant de l'outil, tel qu'inscrit dans `cadre.yaml` (`tools`). */
  readonly id: string;
  /** Fichiers de contexte propres à l'outil, à la racine du projet (ex. `CLAUDE.md`) ; aucun si absent. */
  readonly contextFiles?: readonly ContextFileSpec[];
  /** Skills présentes dans les dossiers natifs de l'outil, triées par dossier (lecture seule). */
  detectSkills(files: ProjectFiles, root: string): Promise<ListedSkill[]>;
}
