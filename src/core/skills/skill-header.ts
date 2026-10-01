import type { SkillIssue } from "./skill";

export type SkillHeader =
  { kind: "valid"; name: string; description: string } | { kind: "invalid"; issue: SkillIssue };

/** Lit l'en-tête YAML (entre deux lignes `---`, en tête de fichier) d'un `SKILL.md`. */
export function parseSkillHeader(_text: string): SkillHeader {
  return { kind: "invalid", issue: { code: "no-header" } };
}
