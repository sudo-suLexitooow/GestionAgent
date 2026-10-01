import type { ToolAdapter } from "../adapters/adapter";
import { etatDossierCadre } from "../cadre/detection";
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "./skill";
import { readSkillsFolder } from "./skills-folder";

/**
 * Skills du projet ouvert (SKL-01, PRJ-02). Si le projet a un modèle `.cadre/`, même incomplet
 * (AC-006-5), ce sont les skills du modèle (`.cadre/skills/`) : les copies exportées dans les
 * dossiers de l'outil ne sont pas listées une seconde fois (AC-002-5). Sans modèle (pas de
 * `.cadre/`, ou seulement `.cadre/tmp/`, AC-006-6), l'adaptateur de l'outil les découvre.
 */
export async function listProjectSkills(
  files: ProjectFiles,
  root: string,
  adapter: ToolAdapter,
): Promise<ListedSkill[]> {
  if ((await etatDossierCadre(files, root)) === "aucun") return adapter.detectSkills(files, root);
  return readSkillsFolder(files, root, ".cadre/skills");
}
