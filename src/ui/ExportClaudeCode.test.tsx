import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { stringify } from "yaml";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";

const ROOT = "/home/lea/projet";
const CHEMIN = ".claude/agents/frontend.md";
const RIEN_ECRIT = "Rien n'a été écrit.";
const ATTENDU =
  '---\nname: frontend\ndescription: "Développe l\'interface React."\n---\nTu es le développeur front-end.\n';

function projet(contenu: Record<string, string | Uint8Array> = {}): DisqueMemoire {
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

/** Ouvre le projet `ROOT` sur `disque` et attend que le modèle soit chargé. */
async function ouvrir(disque: DisqueMemoire) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(
    <App folders={folders} drops={new InMemoryDropSource()} files={disque} systeme={disque} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

const boutonExporter = () => screen.getByRole("button", { name: "Exporter vers Claude Code" });

async function exporterQuandDisponible() {
  await waitFor(() => {
    expect(boutonExporter()).toBeEnabled();
  });
  fireEvent.click(boutonExporter());
}

function texte(disque: DisqueMemoire, chemin: string): string | undefined {
  const octets = disque.octets(chemin);
  return octets === undefined ? undefined : new TextDecoder().decode(octets);
}

function etat(disque: DisqueMemoire): Record<string, string | undefined> {
  return Object.fromEntries(disque.chemins().map((chemin) => [chemin, texte(disque, chemin)]));
}

describe("bouton Exporter vers Claude Code (US-008)", () => {
  test("test_ac_008_1_le_bouton_exporte_l_agent_et_nomme_le_fichier_ecrit", async () => {
    const disque = projet();
    await ouvrir(disque);

    await exporterQuandDisponible();

    const fait = await screen.findByRole("status", { name: "Export" });
    expect(fait).toHaveTextContent("Export terminé");
    expect(fait).toHaveTextContent(CHEMIN);
    expect(texte(disque, CHEMIN)).toBe(ATTENDU);
  });

  test.each([
    ["sans_modele", {}],
    [
      "modele_en_lecture_seule",
      {
        ".cadre/cadre.yaml": "schema_version: 2\ngenerator_version: 9.0.0\ntools: [claude-code]\n",
      },
    ],
  ])("test_ac_008_1_%s_le_bouton_est_desactive", async (_cas, contenu) => {
    const disque = new DisqueMemoire(ROOT, contenu);
    await ouvrir(disque);
    await screen.findByRole("form", { name: "Nouvel agent" });

    expect(boutonExporter()).toBeDisabled();
  });

  test("test_ac_008_4_fichier_ecrit_a_la_main_confirmation_qui_le_nomme_puis_ecrasement", async () => {
    const disque = projet({ [CHEMIN]: "écrit à la main\n" });
    await ouvrir(disque);

    await exporterQuandDisponible();

    const confirmation = await screen.findByRole("alertdialog", {
      name: "Confirmer l'écrasement",
    });
    expect(confirmation).toHaveTextContent(CHEMIN);
    expect(confirmation).toHaveTextContent(RIEN_ECRIT);
    expect(disque.transactions).toEqual([]);
    expect(texte(disque, CHEMIN)).toBe("écrit à la main\n");

    fireEvent.click(within(confirmation).getByRole("button", { name: "Écraser ces fichiers" }));

    await waitFor(() => {
      expect(texte(disque, CHEMIN)).toBe(ATTENDU);
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("status", { name: "Export" })).toHaveTextContent(CHEMIN);
  });

  test("test_ac_008_4_annuler_la_confirmation_n_ecrit_rien", async () => {
    const disque = projet({ [CHEMIN]: "écrit à la main\n" });
    await ouvrir(disque);
    await exporterQuandDisponible();
    const confirmation = await screen.findByRole("alertdialog", {
      name: "Confirmer l'écrasement",
    });
    const avant = etat(disque);

    fireEvent.click(within(confirmation).getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Export" })).toHaveTextContent(
      "Export annulé : rien n'a été écrit.",
    );
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_3_erreur_d_ecriture_affichee_et_aucun_fichier_modifie", async () => {
    const disque = projet().echouerProchaineEcriture("DISQUE_PLEIN");
    await ouvrir(disque);
    const avant = etat(disque);

    await exporterQuandDisponible();

    const alerte = await screen.findByRole("alert", { name: "Export" });
    expect(alerte).toHaveTextContent("le disque est plein");
    expect(alerte).toHaveTextContent(RIEN_ECRIT);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_dossier_claude_en_lien_refus_affiche_rien_n_est_ecrit", async () => {
    const disque = projet();
    disque.addLink(".claude");
    await ouvrir(disque);
    const avant = etat(disque);

    await exporterQuandDisponible();

    const alerte = await screen.findByRole("alert", { name: "Export" });
    expect(alerte).toHaveTextContent("lien symbolique");
    expect(alerte).toHaveTextContent(RIEN_ECRIT);
    expect(alerte).toHaveTextContent(CHEMIN);
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });
});
