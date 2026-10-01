// Import des skills au format Agent Skills (PRJ-02, US-004) : chaque skill est copiée telle quelle,
// `SKILL.md` et fichiers annexes, à l'octet près (ADR-001, D2). Lecture seule : rien n'est écrit ici.
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "./skill";
import { describeSkill } from "./skills-folder";

/** Fichier d'une skill : chemin relatif au dossier de la skill (séparateur `/`) et octets bruts. */
export interface SkillFile {
  path: string;
  content: Uint8Array;
}

/** Skill importée en mémoire : en-tête lu (valide ou en erreur) et tous ses fichiers. */
export interface ImportedSkill {
  /** Lecture de l'en-tête de `SKILL.md` ; une skill en erreur est importée telle quelle (AC-004-3). */
  skill: ListedSkill;
  /** Dossier d'origine, relatif au projet (ex. `.claude/skills/revue`). */
  source: string;
  /** `SKILL.md` puis les fichiers annexes, sous-dossiers compris, triés par chemin. */
  files: SkillFile[];
}

/** Skill non importée (rien n'en est copié) : fichier fautif, relatif au projet, et raison. */
export interface SkillImportFailure {
  folder: string;
  path: string;
  code: "link" | "too-large" | "unreadable";
}

/** Résultat de l'opération « importer » d'un adaptateur (ADP-01). */
export interface SkillImport {
  skills: ImportedSkill[];
  failures: SkillImportFailure[];
}

const SKILL_MD = "SKILL.md";

/** Importe les skills de `<dir>/<nom>/` (format Agent Skills), triées par nom de dossier. */
export async function importSkillsFolder(
  files: ProjectFiles,
  root: string,
  dir: string,
): Promise<SkillImport> {
  const entries = (await files.listDir(root, dir)) ?? [];
  const folders = entries
    .filter((entry) => entry.kind === "directory")
    .map((entry) => entry.name)
    .sort(byName);
  const skills: ImportedSkill[] = [];
  for (const folder of folders) {
    const source = `${dir}/${folder}`;
    const skillFiles = await readTree(files, root, source, "");
    const header = skillFiles.find((file) => file.path === SKILL_MD);
    if (!header) continue;
    skills.push({ skill: describeSkill(folder, header.content), source, files: skillFiles });
  }
  return { skills, failures: [] };
}

/** Fichiers de `<base>/<prefix>`, sous-dossiers compris, `SKILL.md` en tête puis triés par chemin. */
async function readTree(
  files: ProjectFiles,
  root: string,
  base: string,
  prefix: string,
): Promise<SkillFile[]> {
  const entries = (await files.listDir(root, prefix === "" ? base : `${base}/${prefix}`)) ?? [];
  const result: SkillFile[] = [];
  for (const { name, kind } of [...entries].sort((a, b) => byName(a.name, b.name))) {
    const path = prefix === "" ? name : `${prefix}/${name}`;
    if (kind === "directory") result.push(...(await readTree(files, root, base, path)));
    if (kind !== "file") continue;
    const content = await files.readFile(root, `${base}/${path}`);
    if (content !== null) result.push({ path, content });
  }
  return prefix === "" ? skillMdFirst(result) : result;
}

function skillMdFirst(skillFiles: SkillFile[]): SkillFile[] {
  return [
    ...skillFiles.filter((file) => file.path === SKILL_MD),
    ...skillFiles.filter((file) => file.path !== SKILL_MD),
  ];
}

function byName(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
