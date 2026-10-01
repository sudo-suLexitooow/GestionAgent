import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { InMemoryProjectFiles } from "../core/testing/in-memory-project-files";
import { App } from "./App";

const ROOT = "/home/lea/projet";

const CADRE = [
  "schema_version: 1",
  "generator_version: 0.1.0",
  "tools: [claude-code]",
  "contexts:",
  "  - { name: CLAUDE, title: CLAUDE.md, type: projet, source: CLAUDE.md }",
  "  - { name: AGENTS, title: AGENTS.md, type: autre, source: AGENTS.md, readonly: true }",
  "",
].join("\n");

const MODELE = {
  ".cadre/cadre.yaml": CADRE,
  ".cadre/contexte/CLAUDE.md": "# Version du modèle\n",
  ".cadre/contexte/AGENTS.md": "# Agents\n",
  ".cadre/skills/ui-design/SKILL.md":
    "---\nname: ui-design\ndescription: Conçoit les écrans.\n---\n",
};

/** Ouvre le projet `ROOT` dont le contenu est `content`, et attend la fin des lectures. */
async function openProject(content: Record<string, string>) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  const files = new InMemoryProjectFiles(ROOT, content);
  render(<App folders={folders} drops={new InMemoryDropSource()} files={files} />);
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function listed(region: string): string[] {
  const section = screen.getByRole("region", { name: region });
  return within(section)
    .getAllByRole("listitem")
    .map((item) => item.textContent);
}

describe("réouverture d'un projet qui a un modèle .cadre/", () => {
  test("test_ac_006_1_l_ecran_principal_affiche_les_contextes_et_skills_du_modele", async () => {
    await openProject(MODELE);

    expect(listed("Contextes")).toEqual([
      "CLAUDE.md — Projet",
      "AGENTS.md — Autre — lecture seule",
    ]);
    expect(listed("Skills")).toEqual(["ui-design — Conçoit les écrans."]);
  });

  test("test_ac_006_4_avec_claude_md_aucun_import_n_est_repropose_et_le_modele_fait_foi", async () => {
    await openProject({ ...MODELE, "CLAUDE.md": "# Version modifiée hors de Cadre\n" });

    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("region", { name: "Contextes" })).toHaveLength(1);
    expect(listed("Contextes")).toEqual([
      "CLAUDE.md — Projet",
      "AGENTS.md — Autre — lecture seule",
    ]);
  });

  test("test_ac_006_2_format_plus_recent_bandeau_lecture_seule_et_mise_a_jour", async () => {
    await openProject({
      ...MODELE,
      ".cadre/cadre.yaml": CADRE.replace("schema_version: 1", "schema_version: 2"),
    });

    expect(screen.getByRole("status", { name: "Modèle" })).toHaveTextContent(
      "Ce projet a été enregistré par une version plus récente de Cadre. Il est ouvert en lecture seule : mettez Cadre à jour pour le modifier.",
    );
  });

  test("test_ac_006_3_agent_en_erreur_bandeau_avec_fichier_et_ligne", async () => {
    await openProject({
      ...MODELE,
      ".cadre/agents/x.yaml": "id: 1\nname: x\nname: y\n",
    });

    expect(screen.getByRole("alert", { name: "Modèle" })).toHaveTextContent(
      "Agent en erreur : .cadre/agents/x.yaml, ligne 3 : clé en double",
    );
    expect(listed("Contextes")).toHaveLength(2);
  });

  test("test_ac_006_5_modele_incomplet_bandeau_et_reparation_proposee_sans_import", async () => {
    await openProject({
      "CLAUDE.md": "# Projet\n",
      ".cadre/contexte/CLAUDE.md": "# Projet\n",
      ".cadre/tmp/verrou": "",
    });

    const bandeau = screen.getByRole("alert", { name: "Modèle" });
    expect(bandeau).toHaveTextContent("Modèle incomplet : .cadre/cadre.yaml : fichier absent.");
    expect(bandeau).toHaveTextContent(
      "Réparation proposée : recréer .cadre/cadre.yaml à partir du contenu de .cadre/. Rien n'a été écrit et rien ne le sera sans votre accord.",
    );
    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
  });

  test("test_ac_006_5_cadre_yaml_invalide_bandeau_avec_ligne", async () => {
    await openProject({
      ".cadre/cadre.yaml": 'schema_version: "1"\ngenerator_version: 0.1.0\ntools: []\n',
    });

    expect(screen.getByRole("alert", { name: "Modèle" })).toHaveTextContent(
      "Modèle incomplet : .cadre/cadre.yaml, ligne 1 : non conforme au format .cadre/ v1.",
    );
  });

  test("test_ac_006_6_dossier_cadre_avec_seulement_le_verrou_l_import_est_propose", async () => {
    await openProject({ "CLAUDE.md": "# Projet\n", ".cadre/tmp/verrou": "" });

    expect(screen.getByRole("button", { name: "Importer" })).toBeInTheDocument();
    expect(screen.queryByRole("alert", { name: "Modèle" })).not.toBeInTheDocument();
  });
});
