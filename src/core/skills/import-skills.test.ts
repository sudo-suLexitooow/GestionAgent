import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { InMemoryProjectFiles } from "../testing/in-memory-project-files";
import type { SkillImport } from "./import-skills";

const ROOT = "/home/lea/projet";
const texte = (s: string) => new TextEncoder().encode(s);

// BOM, CRLF, champ inconnu de Cadre, corps sans fin de ligne finale.
const REVUE_MD = Uint8Array.of(
  0xef,
  0xbb,
  0xbf,
  ...texte(
    "---\r\nname: revue\r\ndescription: Relit le code.\r\nx-equipe: front\r\n---\r\n# Revue\r\nCorps  ",
  ),
);
// Annexe binaire (pas de l'UTF-8).
const LOGO = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x0d, 0x0a);

function importer(files: InMemoryProjectFiles): Promise<SkillImport> {
  const operation = claudeCodeAdapter.importer;
  if (!operation) throw new Error("l'adaptateur Claude Code doit savoir importer");
  return operation(files, ROOT);
}

describe("importer les skills de Claude Code (AC-004-1)", () => {
  test("test_ac_004_1_skill_md_et_annexes_sous_dossiers_compris_copies_octet_pour_octet", async () => {
    const files = new InMemoryProjectFiles(ROOT, {
      ".claude/skills/revue/SKILL.md": REVUE_MD,
      ".claude/skills/revue/references/guide.md": "# Guide\r\n",
      ".claude/skills/revue/assets/img/logo.png": LOGO,
      ".claude/skills/revue/scripts/lancer.sh": "#!/bin/sh\necho ok\n",
    });

    const { skills, failures } = await importer(files);

    expect(failures).toEqual([]);
    expect(skills).toHaveLength(1);
    const [revue] = skills;
    expect(revue?.skill).toEqual({
      folder: "revue",
      status: "ok",
      name: "revue",
      description: "Relit le code.",
    });
    expect(revue?.source).toBe(".claude/skills/revue");
    expect(revue?.files.map((f) => f.path)).toEqual([
      "SKILL.md",
      "assets/img/logo.png",
      "references/guide.md",
      "scripts/lancer.sh",
    ]);
    expect(revue?.files.find((f) => f.path === "SKILL.md")?.content).toEqual(REVUE_MD);
    expect(revue?.files.find((f) => f.path === "assets/img/logo.png")?.content).toEqual(LOGO);
    expect(revue?.files.find((f) => f.path === "references/guide.md")?.content).toEqual(
      texte("# Guide\r\n"),
    );
  });
});
