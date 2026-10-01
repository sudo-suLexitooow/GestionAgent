// Import des skills au format Agent Skills (PRJ-02, US-004) : chaque skill est copiée telle quelle,
// `SKILL.md` et fichiers annexes, à l'octet près (ADR-001, D2). Lecture seule : rien n'est écrit ici.
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "./skill";

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

/** Importe les skills de `<dir>/<nom>/` (format Agent Skills). */
export function importSkillsFolder(
  files: ProjectFiles,
  root: string,
  dir: string,
): Promise<SkillImport> {
  void [files, root, dir];
  return Promise.resolve({ skills: [], failures: [] });
}
