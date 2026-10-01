// Import d'un projet sans modèle `.cadre/` (PRJ-02) : contextes et skills, en mémoire. Le cœur ne
// connaît que l'interface d'adaptateur (ADP-01, NF-19) ; rien n'est écrit ici.
import type { ToolAdapter } from "../adapters/adapter";
import type { ContextFileSpec } from "../contexts/context";
import {
  detectContextFiles,
  importContexts,
  type ContextImport,
} from "../contexts/import-contexts";
import type { ProjectFiles } from "../project/ports";
import type { SkillImport } from "../skills/import-skills";

/** Résultat de l'import : contextes (US-003) et skills (US-004). */
export interface ProjetImporte extends ContextImport {
  skills: SkillImport;
}

/** Ce que l'import propose : fichiers de contexte et nombre de skills de l'outil. */
export interface ImportPropose {
  specs: ContextFileSpec[];
  skills: number;
}

/**
 * Ce qu'il y a à importer, seulement si le projet n'a pas encore de modèle `.cadre/` (même
 * incomplet, AC-006-4, AC-006-5). Lecture seule.
 */
export async function detecterImport(
  files: ProjectFiles,
  root: string,
  adapter: ToolAdapter,
): Promise<ImportPropose> {
  return { specs: await detectContextFiles(files, root, adapter), skills: 0 };
}

/** Importe les fichiers de contexte `specs` et les skills de l'outil, via son adaptateur. */
export async function importerProjet(
  files: ProjectFiles,
  root: string,
  adapter: ToolAdapter,
  specs: readonly ContextFileSpec[],
): Promise<ProjetImporte> {
  const contextes = await importContexts(files, root, specs);
  const skills = adapter.importer
    ? await adapter.importer(files, root)
    : { skills: [], failures: [] };
  return { ...contextes, skills };
}
