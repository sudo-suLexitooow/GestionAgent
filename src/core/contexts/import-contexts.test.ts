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
});
