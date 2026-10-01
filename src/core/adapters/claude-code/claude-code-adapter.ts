import type { ToolAdapter } from "../adapter";

/** Adaptateur Claude Code : skills dans `.claude/skills/<nom>/SKILL.md`. */
export const claudeCodeAdapter: ToolAdapter = {
  id: "claude-code",
  detectSkills: () => Promise.resolve([]),
};
