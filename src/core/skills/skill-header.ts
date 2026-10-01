import { isMap, parseDocument } from "yaml";
import type { SkillIssue } from "./skill";

export type SkillHeader =
  { kind: "valid"; name: string; description: string } | { kind: "invalid"; issue: SkillIssue };

const DELIMITER = "---";

/**
 * Lit l'en-tête YAML d'un `SKILL.md` : une ligne `---` en tête de fichier, le YAML, puis une ligne
 * `---` (format Agent Skills, ADR-001). Fins de ligne LF ou CRLF. Les champs autres que `name` et
 * `description` sont ignorés ici.
 */
export function parseSkillHeader(text: string): SkillHeader {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== DELIMITER) return invalid({ code: "no-header" });
  const end = lines.indexOf(DELIMITER, 1);
  if (end === -1) return invalid({ code: "unclosed-header" });

  // YAML 1.2, schéma core ; clé en double = erreur (ADR-001, D1).
  const document = parseDocument(lines.slice(1, end).join("\n"));
  const [error] = document.errors;
  if (error) {
    // L'en-tête commence à la 2e ligne du fichier.
    const line = error.linePos ? error.linePos[0].line + 1 : undefined;
    const code = error.code === "DUPLICATE_KEY" ? "duplicate-key" : "yaml-syntax";
    return invalid(line === undefined ? { code } : { code, line });
  }
  if (!isMap(document.contents)) return invalid({ code: "not-a-mapping" });

  const name = document.get("name");
  if (!isFilledText(name)) return invalid({ code: "missing-name" });
  const description = document.get("description");
  if (!isFilledText(description)) return invalid({ code: "missing-description" });
  return { kind: "valid", name, description };
}

function invalid(issue: SkillIssue): SkillHeader {
  return { kind: "invalid", issue };
}

function isFilledText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
