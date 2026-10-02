import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ProjectWarning } from "../core/project/ports";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { InMemoryProjectFiles } from "../core/testing/in-memory-project-files";
import { App } from "./App";

const ROOT = "/home/lea/projet";

/**
 * Ouvre le projet `ROOT` dont le contenu est `files` (aussi port d'écriture si c'est un
 * `DisqueMemoire`), avec l'avertissement de préparation `warning`, et attend l'écran principal.
 */
async function openProject(files: InMemoryProjectFiles, warning?: ProjectWarning) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  if (warning) folders.warnOnPrepare(warning);
  const systeme = files instanceof DisqueMemoire ? files : undefined;
  render(
    <App
      folders={folders}
      drops={new InMemoryDropSource()}
      files={files}
      {...(systeme && { systeme })}
    />,
  );
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

describe("dossier .cadre en lien (US-079)", () => {
  test("test_ac_079_2_cadre_en_lien_message_dedie_dans_le_bandeau_du_modele", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# Projet\n" }).addLink(".cadre"),
    );

    expect(await screen.findByRole("alert", { name: "Modèle" })).toHaveTextContent(
      "Le dossier .cadre est un lien symbolique ou une jonction, non pris en charge : Cadre ne le suit pas et n'y écrit rien.",
    );
  });

  test("test_ac_079_2_cadre_en_lien_avertissement_d_ouverture_dedie", async () => {
    await openProject(new InMemoryProjectFiles(ROOT, {}).addLink(".cadre"), {
      code: "CHEMIN_INVALIDE",
      detail:
        ".cadre n'est pas un vrai dossier (lien symbolique, jonction ou fichier) : Cadre refuse d'y écrire",
    });

    const avertissement = screen.getByRole("status");
    expect(avertissement).toHaveTextContent(
      "Un chemin du dossier .cadre/ est un lien symbolique, une jonction ou n'est pas un vrai dossier : Cadre ne le suit pas, n'y écrit rien et n'y reprend aucune écriture interrompue.",
    );
    expect(avertissement).not.toHaveTextContent("Une écriture interrompue n'a pas pu être reprise");
  });

  test("test_ac_079_2_cadre_en_lien_rien_a_enregistrer_ni_import_ni_agent", async () => {
    const disque = new DisqueMemoire(ROOT, { "CLAUDE.md": "# Projet\n" }).addLink(".cadre");
    await openProject(disque);
    await screen.findByRole("alert", { name: "Modèle" });

    const formulaire = screen.getByRole("form", { name: "Nouvel agent" });
    expect(within(formulaire).getByRole("button", { name: "Créer l'agent" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    expect(disque.transactions).toEqual([]);
  });
});
