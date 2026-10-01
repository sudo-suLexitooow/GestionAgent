import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import type { ContextFileSpec, ImportedContext } from "./context";
import { GENERIC_CONTEXT_FILES } from "./generic-format";

/** Fichier de contexte détecté et ses octets lus sur le disque. */
export interface ReadContextFile {
  spec: ContextFileSpec;
  bytes: Uint8Array;
}

/** Résultat d'un import de contextes, en mémoire : rien n'est écrit ici. */
export interface ContextImport {
  contexts: ImportedContext[];
}

/** Construit les contextes à partir des octets lus (fonction pure). */
export function buildContextImport(_read: readonly ReadContextFile[]): ContextImport {
  return { contexts: [] };
}

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
