import { fireEvent, render, screen, within } from "@testing-library/react";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { InMemoryProjectFiles } from "../core/testing/in-memory-project-files";
import { App } from "./App";

const ROOT = "/home/lea/projet";

/** Ouvre le projet `ROOT` dont le contenu est `files`, et attend l'écran principal. */
async function openProject(files: InMemoryProjectFiles) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(<App folders={folders} drops={new InMemoryDropSource()} files={files} />);
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

describe("dossier .claude ou .claude/skills en lien, section Skills (US-079)", () => {
  test("test_ac_079_1_claude_skills_en_lien_message_dedie_dans_la_section_skills", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# Projet\n" }).addLink(".claude/skills"),
    );

    const section = await screen.findByRole("region", { name: "Skills" });

    expect(await within(section).findByRole("alert")).toHaveTextContent(
      ".claude/skills : lien symbolique ou jonction non pris en charge ; Cadre ne le suit pas et n'y lit aucune skill.",
    );
  });

  test("test_ac_079_1_claude_en_lien_le_message_nomme_claude", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# Projet\n" }).addLink(".claude"),
    );

    const section = await screen.findByRole("region", { name: "Skills" });

    expect(await within(section).findByRole("alert")).toHaveTextContent(
      ".claude : lien symbolique ou jonction non pris en charge ; Cadre ne le suit pas et n'y lit aucune skill.",
    );
  });
});
