import { readSkillsFolder } from "../../skills/skills-folder";
import type { AdaptateurExport, ToolAdapter } from "../adapter";

/** Adaptateur Claude Code : contexte `CLAUDE.md`, skills dans `.claude/skills/<nom>/SKILL.md`. */
export const claudeCodeAdapter: ToolAdapter & AdaptateurExport = {
  id: "claude-code",
  name: "Claude Code",
  contextFiles: [{ file: "CLAUDE.md", name: "CLAUDE", type: "projet" }],
  detectSkills: (files, root) => readSkillsFolder(files, root, ".claude/skills"),
  valider: () => [],
  exporter: () => [],
};
