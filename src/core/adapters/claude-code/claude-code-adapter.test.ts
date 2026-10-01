import { InMemoryProjectFiles } from "../../testing/in-memory-project-files";
import { claudeCodeAdapter } from "./claude-code-adapter";

const ROOT = "/home/lea/projet";

function skillMd(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n`;
}

function detect(content: Record<string, string | Uint8Array>) {
  return claudeCodeAdapter.detectSkills(new InMemoryProjectFiles(ROOT, content), ROOT);
}

describe("découverte des skills de Claude Code (.claude/skills/)", () => {
  test("test_ac_002_1_liste_les_skills_a_et_b_avec_nom_et_description", async () => {
    const skills = await detect({
      ".claude/skills/b/SKILL.md": skillMd("b", "Fait B."),
      ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
    });

    expect(skills).toEqual([
      { folder: "a", status: "ok", name: "a", description: "Fait A." },
      { folder: "b", status: "ok", name: "b", description: "Fait B." },
    ]);
  });
});
