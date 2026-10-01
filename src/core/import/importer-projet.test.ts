import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import type { SkillImport } from "../skills/import-skills";
import { InMemoryProjectFiles } from "../testing/in-memory-project-files";
import { detecterImport, importerProjet } from "./importer-projet";

const ROOT = "/home/lea/projet";

/** Adaptateur factice d'un outil inventé : enregistre les appels à son opération « importer ». */
function adaptateurFactice(resultat: SkillImport) {
  const appels: { files: ProjectFiles; root: string }[] = [];
  const adapter: ToolAdapter = {
    id: "outil-factice",
    detectSkills: () => Promise.resolve([]),
    importer: (files, root) => {
      appels.push({ files, root });
      return Promise.resolve(resultat);
    },
  };
  return { adapter, appels };
}

const SKILLS_FACTICES: SkillImport = {
  skills: [
    {
      skill: { folder: "a", status: "ok", name: "a", description: "Fait A." },
      source: "outil/a",
      files: [{ path: "SKILL.md", content: Uint8Array.of(0x2d) }],
    },
  ],
  failures: [{ folder: "b", path: "outil/b", code: "link" }],
};

describe("le cœur importe par l'interface d'adaptateur (AC-004-4)", () => {
  test("test_ac_004_4_les_skills_viennent_de_l_operation_importer_de_l_adaptateur", async () => {
    const files = new InMemoryProjectFiles(ROOT, { "AGENTS.md": "# Agents\n" });
    const { adapter, appels } = adaptateurFactice(SKILLS_FACTICES);

    const resultat = await importerProjet(files, ROOT, adapter, [
      { file: "AGENTS.md", name: "AGENTS", type: "autre", readonly: true },
    ]);

    expect(appels).toEqual([{ files, root: ROOT }]);
    expect(resultat.skills).toEqual(SKILLS_FACTICES);
    expect(resultat.contexts.map(({ entry }) => entry.name)).toEqual(["AGENTS"]);
  });

  test("test_ac_004_4_un_adaptateur_sans_operation_importer_n_importe_aucune_skill", async () => {
    const files = new InMemoryProjectFiles(ROOT, {});
    const adapter: ToolAdapter = { id: "sans-import", detectSkills: () => Promise.resolve([]) };

    const resultat = await importerProjet(files, ROOT, adapter, []);

    expect(resultat.skills).toEqual({ skills: [], failures: [] });
  });

  test("test_ac_004_4_aucun_code_propre_a_claude_code_hors_de_son_adaptateur", () => {
    const core = join(__dirname, "..");
    const fautifs = fichiersSources(core)
      .filter((chemin) => !relative(core, chemin).startsWith(join("adapters", "claude-code")))
      .filter((chemin) =>
        /["'`]\.?claude[-/]|from\s+["'][^"']*claude-code/.test(sansCommentaires(chemin)),
      )
      .map((chemin) => relative(core, chemin));

    expect(fautifs).toEqual([]);
  });
});

describe("proposition d'import des skills de l'outil", () => {
  const LISTEES = [
    { folder: "a", status: "ok", name: "a", description: "A." },
    { folder: "b", status: "error", issue: { code: "link" } },
  ] as const;

  function adaptateurQuiListe() {
    const appels: string[] = [];
    const adapter: ToolAdapter = {
      id: "outil-factice",
      detectSkills: (_files, root) => {
        appels.push(root);
        return Promise.resolve([...LISTEES]);
      },
    };
    return { adapter, appels };
  }

  test("test_ac_004_1_sans_modele_les_skills_de_l_outil_sont_proposees_a_l_import", async () => {
    const { adapter } = adaptateurQuiListe();

    const propose = await detecterImport(new InMemoryProjectFiles(ROOT, {}), ROOT, adapter);

    expect(propose).toEqual({ specs: [], skills: 2 });
  });

  test("test_ac_004_1_avec_un_modele_aucune_skill_n_est_proposee", async () => {
    const { adapter, appels } = adaptateurQuiListe();
    const files = new InMemoryProjectFiles(ROOT, { ".cadre/cadre.yaml": "schema_version: 1\n" });

    expect(await detecterImport(files, ROOT, adapter)).toEqual({ specs: [], skills: 0 });
    expect(appels).toEqual([]);
  });
});

/** Fichiers TypeScript de production (hors tests) sous `dossier`. */
function fichiersSources(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return fichiersSources(chemin);
    return entree.name.endsWith(".ts") && !entree.name.endsWith(".test.ts") ? [chemin] : [];
  });
}

function sansCommentaires(chemin: string): string {
  return readFileSync(chemin, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}
