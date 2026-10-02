import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";

const ROOT = "/home/lea/projet";
const texte = (s: string) => new TextEncoder().encode(s);
const REVUE_MD = texte(
  "---\nname: revue\ndescription: Relit le code.\nx-equipe: front\n---\n# R\n",
);
const CASSE_MD = texte("---\nname: casse\ndescription: b: c\n---\n");

function disqueAvecSkills() {
  return new DisqueMemoire(ROOT, {
    ".claude/skills/revue/SKILL.md": REVUE_MD,
    ".claude/skills/revue/references/guide.md": "# Guide\n",
    ".claude/skills/casse/SKILL.md": CASSE_MD,
    ".claude/skills/liee/SKILL.md": "---\nname: liee\ndescription: L.\n---\n",
  }).addLink(".claude/skills/liee/externe.md");
}

async function ouvrir(disque: DisqueMemoire) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(
    <App folders={folders} drops={new InMemoryDropSource()} files={disque} systeme={disque} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

function listees(region: string): (string | null)[] {
  return within(screen.getByRole("region", { name: region }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);
}

describe("créer le modèle par un agent sans importer (régression US-007)", () => {
  test("test_ac_004_1_creer_le_modele_par_un_agent_garde_les_skills_listees_et_signale_les_autres", async () => {
    const disque = disqueAvecSkills();
    await ouvrir(disque);
    fireEvent.click(await screen.findByRole("button", { name: "Ne pas importer" }));
    const formulaire = await screen.findByRole("form", { name: "Nouvel agent" });
    fireEvent.change(within(formulaire).getByLabelText("Nom"), { target: { value: "frontend" } });
    fireEvent.change(within(formulaire).getByLabelText("Rôle"), { target: { value: "Front" } });
    fireEvent.change(within(formulaire).getByLabelText("Description"), {
      target: { value: "Écrans." },
    });
    fireEvent.click(within(formulaire).getByRole("button", { name: "Créer l'agent" }));

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(disque.octets(".cadre/agents/frontend.yaml")).toBeDefined();
    });
    expect(disque.octets(".cadre/skills/revue/SKILL.md")).toEqual(REVUE_MD);
    expect(
      await screen.findByText(
        ".claude/skills/liee/externe.md : lien non pris en charge ; la skill liee n'est pas importée.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(listees("Skills")).toEqual([
        "casse — en erreur : YAML invalide (ligne 3)",
        "revue — Relit le code.",
      ]);
    });
  });
});

describe("proposition d'import : les skills seront copiées de toute façon", () => {
  test("test_ac_004_1_la_proposition_previent_que_les_skills_seront_copiees_a_la_creation_du_modele", async () => {
    await ouvrir(disqueAvecSkills());

    const section = await screen.findByRole("region", { name: "Contextes" });
    expect(
      within(section).getByText(
        "Les skills seront copiées dans Cadre à la création du modèle, même sans import.",
      ),
    ).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "Ne pas importer" })).toBeInTheDocument();
  });

  test("test_ac_004_1_sans_skill_aucune_mention_de_copie", async () => {
    await ouvrir(new DisqueMemoire(ROOT, { "CLAUDE.md": "# Projet\n" }));

    await screen.findByRole("region", { name: "Contextes" });
    expect(screen.queryByText(/Les skills seront copiées/)).not.toBeInTheDocument();
  });
});

describe("dossier .claude/skills en lien (écran)", () => {
  test("test_ac_004_3_dossier_skills_en_lien_les_contextes_restent_proposes_a_l_ecran", async () => {
    await ouvrir(new DisqueMemoire(ROOT, { "CLAUDE.md": "# Projet\n" }).addLink(".claude/skills"));

    const section = await screen.findByRole("region", { name: "Contextes" });
    expect(within(section).getByRole("button", { name: "Importer" })).toBeInTheDocument();
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["CLAUDE.md"]);
  });
});

describe("dossier .claude/skills en lien, création du modèle par un agent (écran)", () => {
  test("test_ac_004_3_dossier_skills_en_lien_signale_qu_aucune_skill_n_est_importee", async () => {
    const disque = new DisqueMemoire(ROOT, {}).addLink(".claude/skills");
    await ouvrir(disque);
    const formulaire = await screen.findByRole("form", { name: "Nouvel agent" });
    fireEvent.change(within(formulaire).getByLabelText("Nom"), { target: { value: "frontend" } });
    fireEvent.change(within(formulaire).getByLabelText("Rôle"), { target: { value: "Front" } });
    fireEvent.change(within(formulaire).getByLabelText("Description"), {
      target: { value: "Écrans." },
    });
    fireEvent.click(within(formulaire).getByRole("button", { name: "Créer l'agent" }));

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(
        ".claude/skills : lien non pris en charge ; aucune skill n'est importée.",
      ),
    ).toBeInTheDocument();
    expect(disque.octets(".cadre/agents/frontend.yaml")).toBeDefined();
  });
});

describe("import des skills depuis l'écran principal (US-004)", () => {
  test("test_ac_004_1_sans_fichier_de_contexte_les_skills_sont_proposees_a_l_import", async () => {
    await ouvrir(disqueAvecSkills());

    expect(await screen.findByText("Skills à importer : 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importer" })).toBeInTheDocument();
  });

  test("test_ac_004_3_import_signale_les_skills_en_erreur_et_non_importees", async () => {
    await ouvrir(disqueAvecSkills());
    fireEvent.click(await screen.findByRole("button", { name: "Importer" }));

    expect(await screen.findByText("Skills importées : 2")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      ".claude/skills/liee/externe.md : lien non pris en charge ; la skill liee n'est pas importée.",
    );
    expect(screen.getByText(/Non enregistré/)).toBeInTheDocument();
  });

  test("test_ac_004_1_enregistrer_copie_les_skills_et_le_projet_les_liste_depuis_le_modele", async () => {
    const disque = disqueAvecSkills();
    await ouvrir(disque);
    fireEvent.click(await screen.findByRole("button", { name: "Importer" }));
    await screen.findByText(/Non enregistré/);

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(disque.transactions).toHaveLength(1);
    });
    expect(disque.octets(".cadre/skills/revue/SKILL.md")).toEqual(REVUE_MD);
    expect(disque.octets(".cadre/skills/casse/SKILL.md")).toEqual(CASSE_MD);
    expect(disque.octets(".cadre/skills/liee/SKILL.md")).toBeUndefined();
    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(listees("Skills")).toEqual([
        "casse — en erreur : YAML invalide (ligne 3)",
        "revue — Relit le code.",
      ]);
    });
  });
});
