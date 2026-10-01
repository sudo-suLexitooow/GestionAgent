import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import { decodeUtf8 } from "../text/utf8";
import type { ContextEntry, ContextFileSpec, ImportedContext } from "./context";
import { GENERIC_CONTEXT_FILES } from "./generic-format";

/** Fichier de contexte détecté et ses octets lus sur le disque. */
export interface ReadContextFile {
  spec: ContextFileSpec;
  bytes: Uint8Array;
}

/** Avertissement d'import : fichier d'origine et raison. */
export interface ContextImportWarning {
  source: string;
  code: "encoding";
}

/** Résultat d'un import de contextes, en mémoire : rien n'est écrit ici. */
export interface ContextImport {
  contexts: ImportedContext[];
  warnings: ContextImportWarning[];
}

/**
 * Construit les contextes à partir des octets lus (fonction pure). Un fichier non UTF-8 est importé
 * tel quel, octets compris, avec un avertissement d'encodage : son contenu n'est pas perdu.
 */
export function buildContextImport(read: readonly ReadContextFile[]): ContextImport {
  return {
    contexts: read.map(({ spec, bytes }) => importedContext(spec, bytes)),
    warnings: read
      .filter(({ bytes }) => decodeUtf8(bytes) === null)
      .map(({ spec }) => ({ source: spec.file, code: "encoding" })),
  };
}

/**
 * Importe en mémoire les fichiers de contexte détectés : lecture seule des octets, puis
 * construction des contextes. L'écriture de `.cadre/` relève de l'enregistrement (US-005).
 */
export async function importContexts(
  files: ProjectFiles,
  root: string,
  specs: readonly ContextFileSpec[],
): Promise<ContextImport> {
  const read: ReadContextFile[] = [];
  for (const spec of specs) {
    const bytes = await files.readFile(root, spec.file);
    if (bytes !== null) read.push({ spec, bytes });
  }
  return buildContextImport(read);
}

/** Contexte importé depuis `spec` : métadonnées pour `cadre.yaml`, contenu brut (ADR-001, D2). */
function importedContext(spec: ContextFileSpec, bytes: Uint8Array): ImportedContext {
  const entry: ContextEntry = {
    name: spec.name,
    title: spec.file,
    type: spec.type,
    source: spec.file,
  };
  if (spec.readonly) entry.readonly = true;
  return { entry, path: `.cadre/contexte/${spec.name}.md`, content: bytes };
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
