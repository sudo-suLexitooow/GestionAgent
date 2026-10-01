import { readFailureReason, type ProjectFiles } from "../project/ports";
import { decodeUtf8 } from "../text/utf8";
import type { ListedSkill } from "./skill";
import { parseSkillHeader } from "./skill-header";

/**
 * Lit un dossier de skills au format Agent Skills (`<dir>/<nom>/SKILL.md`), commun à `.cadre/skills/`
 * et aux dossiers natifs des outils. Lecture seule ; skills triées par nom de dossier.
 * Dossier absent : aucune skill. Sous-dossier sans `SKILL.md` ou fichier isolé : pas une skill.
 * Une skill illisible ou invalide est listée en erreur, sans empêcher la lecture des autres.
 * Une skill liée (lien symbolique, jonction) n'est jamais suivie (US-076) : elle est en erreur.
 */
export async function readSkillsFolder(
  files: ProjectFiles,
  root: string,
  dir: string,
): Promise<ListedSkill[]> {
  const entries = (await files.listDir(root, dir)) ?? [];
  const candidates = entries
    .filter((entry) => entry.kind === "directory" || entry.kind === "link")
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const skills = await Promise.all(
    candidates.map(({ name: folder, kind }) =>
      kind === "link"
        ? Promise.resolve<ListedSkill>({ folder, status: "error", issue: { code: "link" } })
        : readSkill(files, root, `${dir}/${folder}/SKILL.md`, folder),
    ),
  );
  return skills.filter((skill) => skill !== null);
}

async function readSkill(
  files: ProjectFiles,
  root: string,
  path: string,
  folder: string,
): Promise<ListedSkill | null> {
  let bytes: Uint8Array | null;
  try {
    bytes = await files.readFile(root, path);
  } catch (error) {
    return { folder, status: "error", issue: { code: readFailureReason(error) } };
  }
  if (bytes === null) return null;
  const text = decodeUtf8(bytes);
  if (text === null) return { folder, status: "error", issue: { code: "encoding" } };
  const header = parseSkillHeader(text);
  if (header.kind === "invalid") return { folder, status: "error", issue: header.issue };
  return { folder, status: "ok", name: header.name, description: header.description };
}
