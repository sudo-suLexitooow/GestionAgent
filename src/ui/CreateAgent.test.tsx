import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { parse } from "yaml";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";

const ROOT = "/home/lea/projet";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CADRE = "schema_version: 1\ngenerator_version: 0.1.0\ntools: [claude-code]\n";
const FRONTEND = "id: 7c9e6679-7425-40de-944b-e07fc1f90ae7\nname: frontend\ntarget: claude-code\n";

/** Ouvre le projet `ROOT` sur `disque` et attend le formulaire de création utilisable. */
async function ouvrir(disque: DisqueMemoire) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(
    <App folders={folders} drops={new InMemoryDropSource()} files={disque} systeme={disque} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
  await screen.findByRole("form", { name: "Nouvel agent" });
}

const formulaire = () => screen.getByRole("form", { name: "Nouvel agent" });
const champ = (nom: string) => within(formulaire()).getByLabelText(nom);
const boutonCreer = () => within(formulaire()).getByRole("button", { name: "Créer l'agent" });

function creer(saisie: { nom: string; role?: string; description?: string }) {
  fireEvent.change(champ("Nom"), { target: { value: saisie.nom } });
  fireEvent.change(champ("Rôle"), { target: { value: saisie.role ?? "Développeur front-end" } });
  fireEvent.change(champ("Description"), {
    target: { value: saisie.description ?? "Implémente les écrans React." },
  });
  fireEvent.click(boutonCreer());
}

function agentsListes(): string[] {
  const section = screen.getByRole("region", { name: "Agents" });
  return within(section)
    .queryAllByRole("listitem")
    .map((item) => item.textContent);
}

function texte(disque: DisqueMemoire, chemin: string): string {
  return new TextDecoder().decode(disque.octets(chemin));
}

describe("créer un agent depuis l'écran principal (US-007)", () => {
  test("test_ac_007_1_l_agent_cree_apparait_non_enregistre_puis_enregistrer_ecrit_son_yaml", async () => {
    const disque = new DisqueMemoire(ROOT, {});
    await ouvrir(disque);

    creer({ nom: "frontend" });

    expect(agentsListes()).toEqual(["frontend — Non enregistré"]);
    expect(disque.transactions).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => {
      expect(agentsListes()).toEqual(["frontend"]);
    });
    expect(disque.transactions).toHaveLength(1);
    expect(parse(texte(disque, ".cadre/agents/frontend.yaml"))).toEqual({
      id: expect.stringMatching(UUID_V4) as unknown,
      name: "frontend",
      role: "Développeur front-end",
      description: "Implémente les écrans React.",
      target: "claude-code",
    });
  });

  test("test_ac_007_1_projet_deja_enregistre_l_agent_est_ajoute_au_modele", async () => {
    const disque = new DisqueMemoire(ROOT, {
      ".cadre/cadre.yaml": CADRE,
      ".cadre/agents/frontend.yaml": FRONTEND,
    });
    await ouvrir(disque);
    await waitFor(() => {
      expect(agentsListes()).toEqual(["frontend"]);
    });

    creer({ nom: "backend" });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(agentsListes()).toEqual(["backend", "frontend"]);
    });
    expect(disque.transactions.map((lot) => lot.map((f) => f.chemin))).toEqual([
      [".cadre/agents/backend.yaml"],
    ]);
    expect(texte(disque, ".cadre/cadre.yaml")).toBe(CADRE);
  });

  test("test_ac_007_2_seuls_les_outils_avec_un_adaptateur_sont_proposes", async () => {
    await ouvrir(new DisqueMemoire(ROOT, {}));

    const options = within(champ("Outil cible")).getAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual(["Claude Code"]);
    expect(options.map((option) => (option as HTMLOptionElement).value)).toEqual(["claude-code"]);
  });

  test.each([
    ["enregistre", { ".cadre/cadre.yaml": CADRE, ".cadre/agents/frontend.yaml": FRONTEND }],
    ["non_enregistre", {}],
  ])(
    "test_ac_007_3_un_second_agent_Frontend_est_refuse_avec_un_message (%s)",
    async (_, contenu) => {
      const disque = new DisqueMemoire(ROOT, contenu);
      await ouvrir(disque);
      if (!(".cadre/cadre.yaml" in contenu)) creer({ nom: "frontend" });
      await waitFor(() => {
        expect(agentsListes()).toHaveLength(1);
      });

      creer({ nom: "Frontend" });

      expect(within(formulaire()).getByRole("alert").textContent).toMatch(
        /un agent porte déjà ce nom/,
      );
      expect(agentsListes()).toHaveLength(1);
    },
  );

  test.each([
    ["", /le nom est obligatoire/],
    ["front:end", /caractère interdit dans un nom de fichier sous Windows ou macOS/],
    ["CON", /nom est réservé par Windows/],
    ["front end", /1 à 64 caractères/],
  ])("test_ac_007_4_le_nom_%j_est_refuse_avec_la_regle_violee", async (nom, regle) => {
    await ouvrir(new DisqueMemoire(ROOT, {}));

    creer({ nom });

    expect(within(formulaire()).getByRole("alert").textContent).toMatch(regle);
    expect(agentsListes()).toEqual([]);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });

  test("test_ac_007_5_description_vide_l_agent_est_cree_avec_l_avertissement", async () => {
    await ouvrir(new DisqueMemoire(ROOT, {}));

    creer({ nom: "frontend", description: "" });

    expect(agentsListes()).toEqual(["frontend — Non enregistré"]);
    expect(within(formulaire()).getByRole("status").textContent).toMatch(/description manquante/);
  });

  test("test_ac_007_1_modele_en_lecture_seule_aucune_creation_possible", async () => {
    const disque = new DisqueMemoire(ROOT, {
      ".cadre/cadre.yaml": "schema_version: 2\ngenerator_version: 9.0.0\ntools: [claude-code]\n",
    });
    await ouvrir(disque);

    await waitFor(() => {
      expect(boutonCreer()).toBeDisabled();
    });
    expect(champ("Nom")).toBeDisabled();
  });
});
