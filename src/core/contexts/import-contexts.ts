import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import type { ContextFileSpec } from "./context";

/**
 * Fichiers de contexte à proposer à l'import (PRJ-02) : seulement si le projet n'a pas encore de
 * modèle `.cadre/`. Lecture seule.
 */
export function detectContextFiles(
  _files: ProjectFiles,
  _root: string,
  _adapter: ToolAdapter,
): Promise<ContextFileSpec[]> {
  return Promise.resolve([]);
}
