import { act, fireEvent, render, screen } from "@testing-library/react";
import type { FolderStatus } from "../core/project/ports";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";

function renderApp(entries: Record<string, FolderStatus> = {}) {
  const folders = new InMemoryFolderAccess(entries);
  const drops = new InMemoryDropSource();
  render(<App folders={folders} drops={drops} />);
  return { folders, drops };
}

async function clickOpen() {
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  // Laisse se terminer le sélecteur et la vérification (promesses du faux système de fichiers).
  await act(() => Promise.resolve());
}

describe("écran d'accueil → écran principal", () => {
  test("test_ac_001_1_le_dossier_choisi_ouvre_l_ecran_principal_avec_nom_et_chemin", async () => {
    const { folders } = renderApp({ "/home/lea/mon-projet": "ok" });
    folders.answerPickerWith("/home/lea/mon-projet");

    await clickOpen();

    expect(await screen.findByRole("heading", { name: "mon-projet" })).toBeInTheDocument();
    expect(screen.getByText("/home/lea/mon-projet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ouvrir un dossier" })).not.toBeInTheDocument();
  });
});
