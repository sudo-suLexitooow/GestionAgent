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

describe("skill impossible à copier entièrement : non importée, signalée, les autres continuent", () => {
  const AUTRE = { ".claude/skills/autre/SKILL.md": "---\nname: autre\ndescription: B.\n---\n" };

  async function importerAvec(prepare: (files: InMemoryProjectFiles) => void) {
    const files = new InMemoryProjectFiles(ROOT, {
      ...AUTRE,
      ".claude/skills/revue/SKILL.md": REVUE_MD,
      ".claude/skills/revue/references/guide.md": "# Guide\n",
    });
    prepare(files);
    const resultat = await importer(files);
    return { ...resultat, dossiers: resultat.skills.map(({ skill }) => skill.folder) };
  }

  test("test_ac_004_1_un_annexe_en_lien_rend_la_skill_en_erreur_sans_import_partiel", async () => {
    const { dossiers, failures } = await importerAvec((files) => {
      files.addLink(".claude/skills/revue/references/externe.md");
    });

    expect(dossiers).toEqual(["autre"]);
    expect(failures).toEqual([
      { folder: "revue", path: ".claude/skills/revue/references/externe.md", code: "link" },
    ]);
  });

  test("test_ac_004_1_un_sous_dossier_en_lien_rend_la_skill_en_erreur", async () => {
    const { dossiers, failures } = await importerAvec((files) => {
      files.addLink(".claude/skills/revue/partage");
    });

    expect(dossiers).toEqual(["autre"]);
    expect(failures).toEqual([
      { folder: "revue", path: ".claude/skills/revue/partage", code: "link" },
    ]);
  });

  test("test_ac_004_1_un_dossier_de_skill_en_lien_n_est_pas_suivi", async () => {
    const { dossiers, failures } = await importerAvec((files) => {
      files.addLink(".claude/skills/liee");
    });

    expect(dossiers).toEqual(["autre", "revue"]);
    expect(failures).toEqual([{ folder: "liee", path: ".claude/skills/liee", code: "link" }]);
  });

  test("test_ac_004_1_un_annexe_de_plus_de_8_mio_rend_la_skill_en_erreur", async () => {
    const { dossiers, failures } = await importerAvec((files) => {
      files.failWith(".claude/skills/revue/references/guide.md", "too-large");
    });

    expect(dossiers).toEqual(["autre"]);
    expect(failures).toEqual([
      { folder: "revue", path: ".claude/skills/revue/references/guide.md", code: "too-large" },
    ]);
  });

  test("test_ac_004_1_un_sous_dossier_illisible_rend_la_skill_en_erreur", async () => {
    const { dossiers, failures } = await importerAvec((files) => {
      files.makeUnreadable(".claude/skills/revue/references");
    });

    expect(dossiers).toEqual(["autre"]);
    expect(failures).toEqual([
      { folder: "revue", path: ".claude/skills/revue/references", code: "unreadable" },
    ]);
  });

  test("test_ac_004_1_un_skill_md_qui_est_un_dossier_rend_la_skill_en_erreur", async () => {
    const files = new InMemoryProjectFiles(ROOT, {
      ...AUTRE,
      ".claude/skills/revue/SKILL.md/note.md": "# pas un SKILL.md\n",
      ".claude/skills/revue/a.md": "# a\n",
    });

    const { skills, failures } = await importer(files);

    expect(skills.map(({ skill }) => skill.folder)).toEqual(["autre"]);
    expect(failures).toEqual([
      { folder: "revue", path: ".claude/skills/revue/SKILL.md", code: "unreadable" },
    ]);
  });

  test("test_ac_004_1_un_skill_md_illisible_rend_la_skill_en_erreur", async () => {
    const { dossiers, failures } = await importerAvec((files) => {
      files.makeUnreadable(".claude/skills/revue/SKILL.md");
    });

    expect(dossiers).toEqual(["autre"]);
    expect(failures).toEqual([
      { folder: "revue", path: ".claude/skills/revue/SKILL.md", code: "unreadable" },
    ]);
  });
});
