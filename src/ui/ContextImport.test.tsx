import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ProjectFiles } from "../core/project/ports";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { InMemoryProjectFiles } from "../core/testing/in-memory-project-files";
import { App } from "./App";

const ROOT = "/home/lea/projet";

/** Ouvre le projet `ROOT` dont le contenu est `files`, et attend l'écran principal. */
async function openProject(files: ProjectFiles) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(<App folders={folders} drops={new InMemoryDropSource()} files={files} />);
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

async function contextsSection() {
  return screen.findByRole("region", { name: "Contextes" });
}

describe("import de CLAUDE.md et AGENTS.md depuis l'écran principal", () => {
  test("test_ac_003_1_propose_l_import_en_listant_les_fichiers_detectes", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# Projet\n", "AGENTS.md": "# Agents\n" }),
    );

    const section = await contextsSection();

    const detected = within(section).getAllByRole("listitem");
    expect(detected.map((item) => item.textContent)).toEqual(["CLAUDE.md", "AGENTS.md"]);
    expect(within(section).getByRole("button", { name: "Importer" })).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "Ne pas importer" })).toBeInTheDocument();
  });
});
