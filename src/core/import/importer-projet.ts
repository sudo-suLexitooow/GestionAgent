// Import d'un projet sans modèle `.cadre/` (PRJ-02) : contextes et skills, en mémoire. Le cœur ne
// connaît que l'interface d'adaptateur (ADP-01, NF-19) ; rien n'est écrit ici.
import type { ToolAdapter } from "../adapters/adapter";
import type { ContextFileSpec } from "../contexts/context";
import { importContexts, type ContextImport } from "../contexts/import-contexts";
import type { ProjectFiles } from "../project/ports";
import type { SkillImport } from "../skills/import-skills";

/** Résultat de l'import : contextes (US-003) et skills (US-004). */
export interface ProjetImporte extends ContextImport {
  skills: SkillImport;
}

/** Importe les fichiers de contexte `specs` et les skills de l'outil, via son adaptateur. */
export async function importerProjet(
  files: ProjectFiles,
  root: string,
  adapter: ToolAdapter,
  specs: readonly ContextFileSpec[],
): Promise<ProjetImporte> {
  const contextes = await importContexts(files, root, specs);
  return { ...contextes, skills: { skills: [], failures: [] } };
}
