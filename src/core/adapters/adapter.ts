// Interface d'adaptateur (NF-19) : tout ce qui est propre à un outil (Claude Code, Codex…) vit
// derrière elle, dans `src/core/adapters/<outil>/`. Le reste du cœur ne connaît que ce contrat.
import type { ContextFileSpec } from "../contexts/context";
import type { ProjectFiles } from "../project/ports";
import type { SkillImport } from "../skills/import-skills";
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
  /**
   * Opération « importer » (ADP-01) : copie en mémoire, à l'octet près, les skills des dossiers
   * natifs de l'outil (lecture seule ; l'écriture relève de l'enregistrement). Absente : l'outil
   * n'a rien à importer.
   */
  readonly importer?: (files: ProjectFiles, root: string) => Promise<SkillImport>;
}
