import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ProjectFiles } from "../core/project/ports";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { InMemoryProjectFiles } from "../core/testing/in-memory-project-files";
import { recordingProjectFiles } from "../core/testing/recording-project-files";
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

  test.each([
    ["le_projet_a_deja_un_dossier_cadre", { "CLAUDE.md": "# P\n", ".cadre/cadre.yaml": "x" }],
    ["aucun_fichier_de_contexte_n_est_present", { "README.md": "# Projet\n" }],
  ])("test_ac_003_1_aucune_proposition_quand_%s", async (_cas, content) => {
    await openProject(new InMemoryProjectFiles(ROOT, content));
    await screen.findByText("Aucune skill détectée.");
    await settle();

    expect(screen.queryByRole("region", { name: "Contextes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
  });

  test("test_ac_003_2_accepter_affiche_un_contexte_par_fichier_non_enregistre", async () => {
    await openProject(
      new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# Projet\r\n", "AGENTS.md": "# Agents\n" }),
    );
    const section = await contextsSection();

    fireEvent.click(within(section).getByRole("button", { name: "Importer" }));

    expect(await within(section).findByText(/Non enregistré/)).toBeInTheDocument();
    const contexts = within(section).getAllByRole("listitem");
    expect(contexts.map((item) => item.textContent)).toEqual([
      "CLAUDE.md — Projet",
      "AGENTS.md — Autre — lecture seule",
    ]);
    expect(within(section).queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
  });

  test("test_ac_003_3_refuser_ne_fait_que_lire_et_ne_repropose_pas_l_import", async () => {
    const disk = new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# Projet\n" });
    const recorded = recordingProjectFiles(disk);
    await openProject(recorded.files);
    const section = await contextsSection();

    fireEvent.click(within(section).getByRole("button", { name: "Ne pas importer" }));
    await settle();

    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    expect(await disk.listDir(ROOT, "")).toEqual([{ name: "CLAUDE.md", kind: "file" }]);
    expect(await disk.readFile(ROOT, "CLAUDE.md")).toEqual(new TextEncoder().encode("# Projet\n"));
    expect([...recorded.used].every((member) => READ_ONLY.has(member))).toBe(true);
  });
});

describe("avertissements d'import des contextes", () => {
  test("test_ac_003_4_un_claude_md_non_utf8_affiche_encodage_non_supporte_sans_planter", async () => {
    const latin1 = Uint8Array.of(0x52, 0xe8, 0x67, 0x6c, 0x65, 0x73, 0x0a);
    await openProject(new InMemoryProjectFiles(ROOT, { "CLAUDE.md": latin1 }));
    const section = await contextsSection();

    fireEvent.click(within(section).getByRole("button", { name: "Importer" }));

    const warning = await within(section).findByRole("alert");
    expect(warning).toHaveTextContent("CLAUDE.md : encodage non supporté");
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["CLAUDE.md — Projet"]);
  });
});

describe("échec de lecture pendant la détection des contextes", () => {
  test("test_ac_003_1_une_racine_illisible_ne_propose_rien_et_ne_plante_pas", async () => {
    const unhandled: unknown[] = [];
    const record = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", record);
    try {
      await openProject(
        new InMemoryProjectFiles(ROOT, { "CLAUDE.md": "# P\n" }).makeUnreadable(""),
      );
      await screen.findByText("Aucune skill détectée.");
      await settle();

      expect(screen.queryByRole("region", { name: "Contextes" })).not.toBeInTheDocument();
      expect(unhandled).toEqual([]);
    } finally {
      process.off("unhandledRejection", record);
    }
  });
});

/** Seuls membres du port de lecture : tout autre accès serait une tentative d'écriture. */
const READ_ONLY = new Set(["listDir", "readFile"]);

/** Laisse se terminer les lectures en cours du faux projet. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
