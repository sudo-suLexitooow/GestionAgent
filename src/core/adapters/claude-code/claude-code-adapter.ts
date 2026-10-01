import { readSkillsFolder } from "../../skills/skills-folder";
import type { ToolAdapter } from "../adapter";

/** Adaptateur Claude Code : contexte `CLAUDE.md`, skills dans `.claude/skills/<nom>/SKILL.md`. */
export const claudeCodeAdapter: ToolAdapter = {
  id: "claude-code",
  contextFiles: [{ file: "CLAUDE.md", name: "CLAUDE", type: "projet" }],
  detectSkills: (files, root) => readSkillsFolder(files, root, ".claude/skills"),
};
