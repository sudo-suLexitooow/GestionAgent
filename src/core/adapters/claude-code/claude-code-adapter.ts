import { readSkillsFolder } from "../../skills/skills-folder";
import type { AdaptateurExport, ToolAdapter } from "../adapter";
import { exporterAgents, validerAgents } from "./agents";

/**
 * Adaptateur Claude Code : contexte `CLAUDE.md`, skills dans `.claude/skills/<nom>/SKILL.md`,
 * agents exportés dans `.claude/agents/<nom>.md` (ADR-003).
 */
export const claudeCodeAdapter: ToolAdapter & AdaptateurExport = {
  id: "claude-code",
  name: "Claude Code",
  contextFiles: [{ file: "CLAUDE.md", name: "CLAUDE", type: "projet" }],
  detectSkills: (files, root) => readSkillsFolder(files, root, ".claude/skills"),
  valider: validerAgents,
  exporter: exporterAgents,
};
