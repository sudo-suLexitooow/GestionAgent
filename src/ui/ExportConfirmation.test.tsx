// Revue n° 1 de la PR #16 : confirmation périmée et modifications non enregistrées.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { stringify } from "yaml";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";

const ROOT = "/home/lea/projet";
const CHEMIN = ".claude/agents/frontend.md";

function projet(contenu: Record<string, string> = {}): DisqueMemoire {
  return new DisqueMemoire(ROOT, {
    ".cadre/cadre.yaml": "schema_version: 1\ngenerator_version: 0.1.0\ntools: [claude-code]\n",
    ".cadre/agents/frontend.yaml": stringify({
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      name: "frontend",
      role: "Tu es le développeur front-end.\n",
      description: "Développe l'interface React.",
      target: "claude-code",
    }),
    ...contenu,
  });
}

async function ouvrir(disque: DisqueMemoire) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(
    <App folders={folders} drops={new InMemoryDropSource()} files={disque} systeme={disque} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

const boutonExporter = () => screen.getByRole("button", { name: "Exporter vers Claude Code" });

function texte(disque: DisqueMemoire, chemin: string): string {
  return new TextDecoder().decode(disque.octets(chemin));
}

describe("confirmation d'écrasement liée au contenu affiché (AC-008-4)", () => {
  test("test_ac_008_4_fichier_modifie_apres_l_affichage_de_la_confirmation_redemande_confirmation", async () => {
    const disque = projet({ [CHEMIN]: "écrit à la main\n" });
    await ouvrir(disque);
    await waitFor(() => {
      expect(boutonExporter()).toBeEnabled();
    });
    fireEvent.click(boutonExporter());
    const premiere = await screen.findByRole("alertdialog", { name: "Confirmer l'écrasement" });
    disque.modifierHorsCadre(CHEMIN, "retouché pendant que la confirmation était affichée\n");

    fireEvent.click(within(premiere).getByRole("button", { name: "Écraser ces fichiers" }));

    const seconde = await screen.findByRole("alertdialog", { name: "Confirmer l'écrasement" });
    expect(seconde).toHaveTextContent(CHEMIN);
    expect(disque.transactions).toEqual([]);
    expect(texte(disque, CHEMIN)).toBe("retouché pendant que la confirmation était affichée\n");
    expect(screen.queryByRole("status", { name: "Export" })).not.toBeInTheDocument();
  });
});

describe("export et modifications non enregistrées", () => {
  test("test_ac_008_4_creer_un_agent_pendant_la_confirmation_la_ferme_sans_rien_ecrire", async () => {
    const disque = projet({ [CHEMIN]: "écrit à la main\n" });
    await ouvrir(disque);
    await waitFor(() => {
      expect(boutonExporter()).toBeEnabled();
    });
    fireEvent.click(boutonExporter());
    const confirmation = await screen.findByRole("alertdialog", {
      name: "Confirmer l'écrasement",
    });
    const ecraser = within(confirmation).getByRole("button", { name: "Écraser ces fichiers" });
    const formulaire = screen.getByRole("form", { name: "Nouvel agent" });

    fireEvent.change(within(formulaire).getByLabelText("Nom"), { target: { value: "backend" } });
    fireEvent.click(within(formulaire).getByRole("button", { name: "Créer l'agent" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    // Un clic sur l'ancien bouton (déjà retiré) n'exporte rien non plus.
    fireEvent.click(ecraser);
    expect(disque.transactions).toEqual([]);
    expect(texte(disque, CHEMIN)).toBe("écrit à la main\n");
    expect(boutonExporter()).toBeDisabled();
  });

  test("test_ac_008_1_modifications_non_enregistrees_le_bouton_exporter_est_desactive", async () => {
    const disque = projet();
    await ouvrir(disque);
    await waitFor(() => {
      expect(boutonExporter()).toBeEnabled();
    });
    expect(screen.queryByText("Enregistrez d'abord vos modifications.")).not.toBeInTheDocument();
    const formulaire = await screen.findByRole("form", { name: "Nouvel agent" });

    fireEvent.change(within(formulaire).getByLabelText("Nom"), { target: { value: "backend" } });
    fireEvent.click(within(formulaire).getByRole("button", { name: "Créer l'agent" }));

    await waitFor(() => {
      expect(boutonExporter()).toBeDisabled();
    });
    expect(screen.getByText("Enregistrez d'abord vos modifications.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(boutonExporter()).toBeEnabled();
    });
    expect(screen.queryByText("Enregistrez d'abord vos modifications.")).not.toBeInTheDocument();
  });
});
