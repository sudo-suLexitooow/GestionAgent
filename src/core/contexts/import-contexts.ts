import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import type { ContextFileSpec } from "./context";

/**
 * Fichiers de contexte à proposer à l'import (PRJ-02) : seulement si le projet n'a pas encore de
 * modèle `.cadre/`. Lecture seule.
 */
export async function detectContextFiles(
  files: ProjectFiles,
  root: string,
  adapter: ToolAdapter,
): Promise<ContextFileSpec[]> {
  const entries = (await files.listDir(root, "")) ?? [];
  const present = new Set(
    entries.filter((entry) => entry.kind === "file").map((entry) => entry.name),
  );
  return (adapter.contextFiles ?? []).filter((spec) => present.has(spec.file));
}
