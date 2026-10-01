import { parse } from "yaml";
import type { SkillIssue } from "./skill";

export type SkillHeader =
  { kind: "valid"; name: string; description: string } | { kind: "invalid"; issue: SkillIssue };

/** Lit l'en-tête YAML (entre deux lignes `---`, en tête de fichier) d'un `SKILL.md`. */
export function parseSkillHeader(text: string): SkillHeader {
  const lines = text.split(/\r?\n/);
  const end = lines.indexOf("---", 1);
  const fields = parse(lines.slice(1, end).join("\n")) as { name: string; description: string };
  return { kind: "valid", name: fields.name, description: fields.description };
}
