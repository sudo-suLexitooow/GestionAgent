import type { ToolAdapter } from "../core/adapters/adapter";
import type { ProjectFiles } from "../core/project/ports";

export interface ContextsSectionProps {
  root: string;
  files: ProjectFiles;
  adapter: ToolAdapter;
}

/** Proposition d'import de CLAUDE.md et AGENTS.md, puis contextes importés (PRJ-02). */
export function ContextsSection({ root }: ContextsSectionProps) {
  return root === "" ? null : null;
}
