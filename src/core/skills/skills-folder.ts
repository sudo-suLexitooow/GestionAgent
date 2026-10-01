import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "./skill";
import { parseSkillHeader } from "./skill-header";

/**
 * Lit un dossier de skills au format Agent Skills (`<dir>/<nom>/SKILL.md`), commun à `.cadre/skills/`
 * et aux dossiers natifs des outils. Lecture seule ; skills triées par nom de dossier.
 */
export async function readSkillsFolder(
  files: ProjectFiles,
  root: string,
  dir: string,
): Promise<ListedSkill[]> {
  const entries = (await files.listDir(root, dir)) as { name: string }[];
  const folders = entries.map((entry) => entry.name).sort();
  return Promise.all(
    folders.map(async (folder): Promise<ListedSkill> => {
      const bytes = (await files.readFile(root, `${dir}/${folder}/SKILL.md`)) as Uint8Array;
      const header = parseSkillHeader(new TextDecoder().decode(bytes)) as {
        name: string;
        description: string;
      };
      return { folder, status: "ok", name: header.name, description: header.description };
    }),
  );
}
