import { fireEvent, render, screen, within } from "@testing-library/react";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { InMemoryProjectFiles } from "../core/testing/in-memory-project-files";
import { App } from "./App";

const ROOT = "/home/lea/projet";

function skillMd(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n`;
}

/** Ouvre le projet `ROOT` dont le contenu est `files`, et attend l'écran principal. */
async function openProject(files: InMemoryProjectFiles) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(<App folders={folders} drops={new InMemoryDropSource()} files={files} />);
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

async function skillsSection() {
  return screen.findByRole("region", { name: "Skills" });
}

describe("section Skills de l'écran principal", () => {
  test("test_ac_002_1_affiche_les_skills_a_et_b_avec_nom_et_description", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, {
        ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
        ".claude/skills/b/SKILL.md": skillMd("b", "Fait B."),
      }),
    );

    const items = await within(await skillsSection()).findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual(["a — Fait A.", "b — Fait B."]);
  });

  test("test_ac_002_2_sans_skills_indique_aucune_skill_detectee_sans_erreur", async () => {
    await openProject(new InMemoryProjectFiles(ROOT, { "README.md": "# Projet\n" }));

    const section = await skillsSection();

    expect(await within(section).findByText("Aucune skill détectée.")).toBeInTheDocument();
    expect(within(section).queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("test_ac_002_3_une_skill_invalide_est_marquee_en_erreur_avec_la_raison", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, {
        ".claude/skills/a/SKILL.md": skillMd("a", "Fait A."),
        ".claude/skills/casse/SKILL.md": "---\nname: casse\ndescription: b: c\n---\n",
        ".claude/skills/sans-nom/SKILL.md": "---\ndescription: d\n---\n",
      }),
    );

    const items = await within(await skillsSection()).findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual([
      "a — Fait A.",
      "casse — en erreur : YAML invalide (ligne 3)",
      "sans-nom — en erreur : le champ name est absent ou vide",
    ]);
  });

  test("test_ac_002_3_un_skill_md_trop_gros_est_en_erreur_avec_un_message_clair", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, {
        ".claude/skills/enorme/SKILL.md": "x",
      }).failWith(".claude/skills/enorme/SKILL.md", "too-large"),
    );

    const items = await within(await skillsSection()).findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual([
      "enorme — en erreur : le fichier SKILL.md dépasse la taille maximale de 8 Mio",
    ]);
  });

  test("test_ac_002_3_un_echec_de_lecture_des_skills_affiche_un_message_sans_planter", async () => {
    await openProject(new InMemoryProjectFiles(ROOT).makeUnreadable(".cadre"));

    const section = await skillsSection();

    expect(await within(section).findByRole("alert")).toHaveTextContent(
      "Les skills n'ont pas pu être lues.",
    );
    expect(screen.getByRole("heading", { name: "projet" })).toBeInTheDocument();
  });

  test("test_ac_002_5_avec_un_modele_cadre_affiche_les_skills_du_modele", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, {
        ".cadre/skills/a/SKILL.md": skillMd("a", "Version du modèle."),
        ".claude/skills/a/SKILL.md": skillMd("a", "Copie exportée."),
      }),
    );

    const items = await within(await skillsSection()).findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual(["a — Version du modèle."]);
  });
});
