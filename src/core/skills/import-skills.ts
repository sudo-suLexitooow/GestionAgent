// Import des skills au format Agent Skills (PRJ-02, US-004) : chaque skill est copiée telle quelle,
// `SKILL.md` et fichiers annexes, à l'octet près (ADR-001, D2). Lecture seule : rien n'est écrit ici.
import { readFailureReason, type DirEntry, type ProjectFiles } from "../project/ports";
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
  const candidates = entries
    .filter((entry) => entry.kind === "directory" || entry.kind === "link")
    .sort((a, b) => byName(a.name, b.name));
  const skills: ImportedSkill[] = [];
  const failures: SkillImportFailure[] = [];
  for (const { name: folder, kind } of candidates) {
    const source = `${dir}/${folder}`;
    try {
      // Un dossier de skill lié n'est jamais suivi (US-076).
      if (kind === "link") throw new Unavailable(source, "link");
      const top = await list(files, root, source);
      // Dossier sans `SKILL.md` : pas une skill.
      const skillMd = top.find((entry) => entry.name === SKILL_MD);
      if (!skillMd) continue;
      if (skillMd.kind === "directory")
        throw new Unavailable(`${source}/${SKILL_MD}`, "unreadable");
      const skillFiles = skillMdFirst(await readTree(files, root, source, "", top));
      const header = skillFiles[0] as SkillFile;
      skills.push({ skill: describeSkill(folder, header.content), source, files: skillFiles });
    } catch (error) {
      if (!(error instanceof Unavailable)) throw error;
      failures.push({ folder, path: error.path, code: error.code });
    }
  }
  return { skills, failures };
}

/** Fichier ou dossier d'une skill qui empêche de la copier entièrement. */
class Unavailable extends Error {
  constructor(
    readonly path: string,
    readonly code: SkillImportFailure["code"],
  ) {
    super(`${code} : ${path}`);
  }
}

/**
 * Tous les fichiers de `<base>/<prefix>` (entrées déjà listées), sous-dossiers compris, triés par
 * chemin. Aucun lien n'est suivi ; un lien, un fichier spécial, trop gros, illisible ou disparu
 * rejette avec `Unavailable` : la skill n'est jamais copiée en partie.
 */
async function readTree(
  files: ProjectFiles,
  root: string,
  base: string,
  prefix: string,
  entries: readonly DirEntry[],
): Promise<SkillFile[]> {
  const result: SkillFile[] = [];
  for (const { name, kind } of [...entries].sort((a, b) => byName(a.name, b.name))) {
    const path = prefix === "" ? name : `${prefix}/${name}`;
    const full = `${base}/${path}`;
    if (kind === "directory") {
      result.push(...(await readTree(files, root, base, path, await list(files, root, full))));
    } else if (kind === "file") {
      result.push({ path, content: await read(files, root, full) });
    } else {
      throw new Unavailable(full, kind === "link" ? "link" : "unreadable");
    }
  }
  return result;
}

async function list(files: ProjectFiles, root: string, path: string): Promise<DirEntry[]> {
  const entries = await files.listDir(root, path).catch((error: unknown) => {
    throw new Unavailable(path, readFailureReason(error));
  });
  if (entries === null) throw new Unavailable(path, "unreadable");
  return entries;
}

async function read(files: ProjectFiles, root: string, path: string): Promise<Uint8Array> {
  const content = await files.readFile(root, path).catch((error: unknown) => {
    throw new Unavailable(path, readFailureReason(error));
  });
  if (content === null) throw new Unavailable(path, "unreadable");
  return content;
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
