import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { InMemoryProjectFiles } from "../testing/in-memory-project-files";
import { detectContextFiles } from "./import-contexts";

const ROOT = "/home/lea/projet";

function detect(content: Record<string, string | Uint8Array>) {
  return detectContextFiles(new InMemoryProjectFiles(ROOT, content), ROOT, claudeCodeAdapter);
}

describe("détection des fichiers de contexte à importer", () => {
  test("test_ac_003_1_detecte_claude_md_a_la_racine_d_un_projet_sans_cadre", async () => {
    const detected = await detect({ "CLAUDE.md": "# Projet\n", "src/main.ts": "" });

    expect(detected.map((spec) => spec.file)).toEqual(["CLAUDE.md"]);
  });

  test("test_ac_003_1_detecte_claude_md_puis_agents_md_en_lecture_seule", async () => {
    const detected = await detect({ "AGENTS.md": "# Agents\n", "CLAUDE.md": "# Projet\n" });

    expect(detected).toEqual([
      { file: "CLAUDE.md", name: "CLAUDE", type: "projet" },
      { file: "AGENTS.md", name: "AGENTS", type: "autre", readonly: true },
    ]);
  });

  test("test_ac_003_1_rien_n_est_propose_si_le_projet_a_deja_un_dossier_cadre", async () => {
    const detected = await detect({
      "CLAUDE.md": "# Projet\n",
      "AGENTS.md": "# Agents\n",
      ".cadre/cadre.yaml": "schema_version: 1\n",
    });

    expect(detected).toEqual([]);
  });
});
