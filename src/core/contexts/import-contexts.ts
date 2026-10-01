import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import type { ContextFileSpec } from "./context";
import { GENERIC_CONTEXT_FILES } from "./generic-format";

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
  if (entries.some((entry) => entry.name === ".cadre" && entry.kind === "directory")) return [];
  const present = new Set(
    entries.filter((entry) => entry.kind === "file").map((entry) => entry.name),
  );
  const candidates = [...(adapter.contextFiles ?? []), ...GENERIC_CONTEXT_FILES];
  return candidates.filter((spec) => present.has(spec.file));
}
