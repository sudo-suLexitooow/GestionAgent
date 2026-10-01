import { fireEvent, render, screen } from "@testing-library/react";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";
import { t } from "./i18n";

// Dépendance de l'enregistrement (pas le code testé) : la sérialisation de cadre.yaml lève.
vi.mock("../core/cadre/cadre-yaml", async (original) => ({
  ...(await original<typeof import("../core/cadre/cadre-yaml")>()),
  serialiserCadre: () => {
    throw new Error("sérialisation impossible");
  },
}));

const ROOT = "/home/lea/projet";

describe("exception pendant la préparation de l'enregistrement", () => {
  test("test_ac_077_2_exception_pendant_la_preparation_affiche_echec_et_le_bouton_redevient_actif", async () => {
    const disque = new DisqueMemoire(ROOT, { "CLAUDE.md": "# Projet\n" });
    const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
    render(
      <App folders={folders} drops={new InMemoryDropSource()} files={disque} systeme={disque} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
    fireEvent.click(await screen.findByRole("button", { name: "Importer" }));
    await screen.findByText(/Non enregistré/);

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const alerte = await screen.findByRole("alert", { name: "Enregistrement" });
    expect(alerte).toHaveTextContent(t("save.error.ECHEC"));
    expect(alerte).toHaveTextContent("sérialisation impossible");
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
    expect(screen.queryByRole("status", { name: "Enregistrement" })).not.toBeInTheDocument();
    expect(disque.transactions).toEqual([]);
  });
});
