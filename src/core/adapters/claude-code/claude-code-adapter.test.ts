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

  test("test_ac_002_2_sans_dossier_claude_skills_la_liste_est_vide_sans_erreur", async () => {
    expect(await detect({ "CLAUDE.md": "# Projet\n", ".claude/agents/x.md": "x" })).toEqual([]);
  });

  test("test_ac_002_2_un_fichier_claude_skills_donne_une_liste_vide_sans_erreur", async () => {
    expect(await detect({ ".claude/skills": "pas un dossier\n" })).toEqual([]);
  });

  test("test_ac_002_3_une_skill_a_l_en_tete_invalide_est_en_erreur_et_les_autres_sont_listees", async () => {
    const skills = await detect({
      ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
      ".claude/skills/casse/SKILL.md": "---\nname: casse\ndescription: b: c\n---\n",
      ".claude/skills/c/SKILL.md": skillMd("c", "Fait C."),
    });

    expect(skills).toEqual([
      { folder: "a", status: "ok", name: "a", description: "Fait A." },
      { folder: "c", status: "ok", name: "c", description: "Fait C." },
      { folder: "casse", status: "error", issue: { code: "yaml-syntax", line: 3 } },
    ]);
  });

  test("test_ac_002_3_un_skill_md_non_utf8_est_en_erreur_d_encodage", async () => {
    const latin1 = new Uint8Array([...new TextEncoder().encode("---\nname: a\n"), 0xe9, 0x0a]);

    expect(await detect({ ".claude/skills/a/SKILL.md": latin1 })).toEqual([
      { folder: "a", status: "error", issue: { code: "encoding" } },
    ]);
  });

  test("test_ac_002_3_un_skill_md_illisible_est_en_erreur_et_les_autres_sont_listees", async () => {
    const files = new InMemoryProjectFiles(ROOT, {
      ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
      ".claude/skills/b/SKILL.md": skillMd("b", "Fait B."),
    }).makeUnreadable(".claude/skills/a/SKILL.md");

    expect(await claudeCodeAdapter.detectSkills(files, ROOT)).toEqual([
      { folder: "a", status: "error", issue: { code: "unreadable" } },
      { folder: "b", status: "ok", name: "b", description: "Fait B." },
    ]);
  });

  test("test_ac_002_3_un_skill_md_trop_gros_est_en_erreur_avec_cette_raison", async () => {
    const files = new InMemoryProjectFiles(ROOT, {
      ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
      ".claude/skills/b/SKILL.md": skillMd("b", "Fait B."),
    }).failWith(".claude/skills/a/SKILL.md", "too-large");

    expect(await claudeCodeAdapter.detectSkills(files, ROOT)).toEqual([
      { folder: "a", status: "error", issue: { code: "too-large" } },
      { folder: "b", status: "ok", name: "b", description: "Fait B." },
    ]);
  });

  test("test_ac_002_4_un_sous_dossier_sans_skill_md_ou_un_fichier_isole_n_est_pas_une_skill", async () => {
    const skills = await detect({
      ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
      ".claude/skills/brouillon/notes.md": "# notes\n",
      ".claude/skills/vide/": "",
      ".claude/skills/README.md": "# Skills\n",
    });

    expect(skills).toEqual([{ folder: "a", status: "ok", name: "a", description: "Fait A." }]);
  });
});
