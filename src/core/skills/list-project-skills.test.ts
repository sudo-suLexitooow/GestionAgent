import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import { InMemoryProjectFiles } from "../testing/in-memory-project-files";
import { listProjectSkills } from "./list-project-skills";
import type { ListedSkill } from "./skill";

const ROOT = "/home/lea/projet";

/** Faux adaptateur : renvoie une liste fixe et note chaque découverte demandée. */
class FakeAdapter implements ToolAdapter {
  readonly id = "faux";
  readonly calls: string[] = [];

  constructor(private readonly found: ListedSkill[]) {}

  detectSkills(_files: ProjectFiles, root: string): Promise<ListedSkill[]> {
    this.calls.push(root);
    return Promise.resolve(this.found);
  }
}

const NATIVE: ListedSkill = { folder: "native", status: "ok", name: "native", description: "N." };

function skillMd(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n`;
}

describe("skills du projet ouvert", () => {
  test("test_ac_002_1_sans_modele_cadre_les_skills_viennent_de_l_adaptateur", async () => {
    const adapter = new FakeAdapter([NATIVE]);
    const files = new InMemoryProjectFiles(ROOT, { ".claude/skills/native/SKILL.md": "x" });

    expect(await listProjectSkills(files, ROOT, adapter)).toEqual([NATIVE]);
    expect(adapter.calls).toEqual([ROOT]);
  });

  test("test_ac_002_5_avec_un_modele_cadre_la_liste_affiche_les_skills_du_modele_seulement", async () => {
    const adapter = new FakeAdapter([NATIVE]);
    const files = new InMemoryProjectFiles(ROOT, {
      ".cadre/cadre.yaml": "schema_version: 1\n",
      ".cadre/skills/a/SKILL.md": skillMd("a", "Version du modèle."),
      ".claude/skills/a/SKILL.md": skillMd("a", "Copie exportée."),
      ".claude/skills/native/SKILL.md": skillMd("native", "N."),
    });

    expect(await listProjectSkills(files, ROOT, adapter)).toEqual([
      { folder: "a", status: "ok", name: "a", description: "Version du modèle." },
    ]);
    expect(adapter.calls).toEqual([]);
  });

  test("test_ac_002_5_un_fichier_cadre_n_est_pas_un_modele_et_l_adaptateur_est_utilise", async () => {
    const adapter = new FakeAdapter([NATIVE]);
    const files = new InMemoryProjectFiles(ROOT, { ".cadre": "pas un modèle\n" });

    expect(await listProjectSkills(files, ROOT, adapter)).toEqual([NATIVE]);
    expect(adapter.calls).toEqual([ROOT]);
  });

  test("test_ac_002_5_modele_cadre_sans_skills_donne_une_liste_vide", async () => {
    const adapter = new FakeAdapter([NATIVE]);
    const files = new InMemoryProjectFiles(ROOT, {
      ".cadre/cadre.yaml": "schema_version: 1\n",
      ".claude/skills/native/SKILL.md": skillMd("native", "N."),
    });

    expect(await listProjectSkills(files, ROOT, adapter)).toEqual([]);
  });
});
