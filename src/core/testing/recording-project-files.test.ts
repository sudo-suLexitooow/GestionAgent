import { InMemoryProjectFiles } from "./in-memory-project-files";
import { recordingProjectFiles } from "./recording-project-files";

const ROOT = "/home/lea/projet";

describe("enregistreur des accès au port de lecture (outil des tests AC-003-3 et AC-003-5)", () => {
  test("test_ac_003_5_note_les_lectures_et_tout_acces_a_un_membre_d_ecriture_absent", async () => {
    const recorded = recordingProjectFiles(new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "x" }));

    const bytes = await recorded.files.readFile(ROOT, "CLAUDE.md");
    const write = (recorded.files as unknown as Record<string, unknown>).writeFile;

    expect(bytes).toEqual(new TextEncoder().encode("x"));
    expect(write).toBeUndefined();
    expect([...recorded.used]).toEqual(["readFile", "writeFile"]);
  });
});
