// Modèle d'une skill listée (SKL-01). Identité = nom de son dossier (ADR-001, D2).

/** Raison pour laquelle une skill est « en erreur ». */
export type SkillIssueCode =
  | "no-header"
  | "unclosed-header"
  | "yaml-syntax"
  | "duplicate-key"
  | "not-a-mapping"
  | "missing-name"
  | "missing-description";

export interface SkillIssue {
  code: SkillIssueCode;
  /** Ligne du fichier `SKILL.md` concernée, quand elle est connue (1 = première ligne). */
  line?: number;
}
