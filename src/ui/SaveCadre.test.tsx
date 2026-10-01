import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { parse } from "yaml";
import paquet from "../../package.json";
import { CODES_ERREUR_FICHIERS } from "../core/fichiers/systeme-fichiers";
import { DisqueMemoire } from "../core/testing/disque-memoire";
import { InMemoryDropSource, InMemoryFolderAccess } from "../core/testing/in-memory-folder-access";
import { App } from "./App";
import { t } from "./i18n";

const ROOT = "/home/lea/projet";
const CLAUDE = Uint8Array.of(0xef, 0xbb, 0xbf, ...new TextEncoder().encode("# Projet\r\nRègles"));

function disqueAvecClaude(autres: Record<string, string | Uint8Array> = {}) {
  return new DisqueMemoire(ROOT, { "CLAUDE.md": CLAUDE, "AGENTS.md": "# Agents\n", ...autres });
}

/** Ouvre le projet `ROOT` sur `disque` et attend l'écran principal. */
async function ouvrir(disque: DisqueMemoire) {
  const folders = new InMemoryFolderAccess({ [ROOT]: "ok" }).answerPickerWith(ROOT);
  render(
    <App folders={folders} drops={new InMemoryDropSource()} files={disque} systeme={disque} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir un dossier" }));
  await screen.findByRole("heading", { name: "projet" });
}

/** Ouvre le projet, accepte l'import proposé et attend « Non enregistré ». */
async function ouvrirEtImporter(disque: DisqueMemoire) {
  await ouvrir(disque);
  fireEvent.click(await screen.findByRole("button", { name: "Importer" }));
  await screen.findByText(/Non enregistré/);
}

const boutonEnregistrer = () => screen.getByRole("button", { name: "Enregistrer" });

function texte(disque: DisqueMemoire, chemin: string): string {
  return new TextDecoder().decode(disque.octets(chemin));
}

describe("bouton Enregistrer de l'écran principal (US-077)", () => {
  test("test_ac_077_1_enregistrer_ecrit_le_cadrage_importe_en_une_transaction", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);

    fireEvent.click(boutonEnregistrer());

    await waitFor(() => {
      expect(disque.transactions).toHaveLength(1);
    });
    expect(disque.transactions[0]?.map((f) => f.chemin)).toEqual([
      ".cadre/cadre.yaml",
      ".cadre/contexte/CLAUDE.md",
      ".cadre/contexte/AGENTS.md",
      ".cadre/generated.yaml",
    ]);
    expect(disque.octets(".cadre/contexte/CLAUDE.md")).toEqual(CLAUDE);
    expect(parse(texte(disque, ".cadre/generated.yaml"))).toMatchObject({
      files: [{ path: "CLAUDE.md" }, { path: "AGENTS.md" }],
    });
  });

  test("test_ac_077_1_generator_version_est_la_version_de_package_json", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);

    fireEvent.click(boutonEnregistrer());

    await waitFor(() => {
      expect(disque.octets(".cadre/cadre.yaml")).toBeDefined();
    });
    expect(parse(texte(disque, ".cadre/cadre.yaml"))).toMatchObject({
      generator_version: paquet.version,
    });
  });

  test("test_ac_077_3_apres_succes_non_enregistre_disparait_et_le_modele_est_affiche", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);

    fireEvent.click(boutonEnregistrer());

    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    const section = await screen.findByRole("region", { name: "Contextes" });
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["CLAUDE.md — Projet", "AGENTS.md — Autre — lecture seule"]);
    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
    expect(boutonEnregistrer()).toBeDisabled();
  });

  test("test_ac_077_3_rouvrir_le_projet_recharge_ce_qui_a_ete_enregistre", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);
    fireEvent.click(boutonEnregistrer());
    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    cleanup();

    await ouvrir(disque);

    const section = await screen.findByRole("region", { name: "Contextes" });
    expect(
      (await within(section).findAllByRole("listitem")).map((item) => item.textContent),
    ).toEqual(["CLAUDE.md — Projet", "AGENTS.md — Autre — lecture seule"]);
    expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Importer" })).not.toBeInTheDocument();
  });

  test("test_ac_077_1_rien_a_enregistrer_avant_l_import_bouton_desactive", async () => {
    await ouvrir(disqueAvecClaude());
    await screen.findByRole("button", { name: "Importer" });

    expect(boutonEnregistrer()).toBeDisabled();
  });
});

describe("échecs d'enregistrement (AC-077-2, zone sensible)", () => {
  test.each(CODES_ERREUR_FICHIERS)(
    "test_ac_077_2_erreur_%s_affiche_son_libelle_et_rien_n_est_ecrit",
    async (code) => {
      const disque = disqueAvecClaude();
      await ouvrirEtImporter(disque);
      const avant = disque.chemins();
      disque.echouerProchaineEcriture(code);

      fireEvent.click(boutonEnregistrer());

      const alerte = await screen.findByRole("alert", { name: "Enregistrement" });
      expect(alerte).toHaveTextContent(t(`save.error.${code}`));
      expect(alerte).toHaveTextContent("écriture simulée");
      expect(disque.chemins()).toEqual(avant);
      // Les contextes restent en mémoire : l'utilisateur peut réessayer.
      expect(screen.getByText(/Non enregistré/)).toBeInTheDocument();
      expect(boutonEnregistrer()).toBeEnabled();
    },
  );

  test("test_ac_077_2_reessayer_apres_un_echec_enregistre", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);
    disque.echouerProchaineEcriture("DISQUE_PLEIN");
    fireEvent.click(boutonEnregistrer());
    await screen.findByRole("alert", { name: "Enregistrement" });

    fireEvent.click(boutonEnregistrer());

    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("alert", { name: "Enregistrement" })).not.toBeInTheDocument();
    expect(disque.octets(".cadre/cadre.yaml")).toBeDefined();
  });

  test("test_ac_077_2_claude_md_modifie_depuis_l_import_message_clair_et_import_repropose", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);
    disque.modifierHorsCadre("CLAUDE.md", "# Projet modifié dans l'éditeur\n");

    fireEvent.click(boutonEnregistrer());

    const alerte = await screen.findByRole("alert", { name: "Enregistrement" });
    expect(alerte).toHaveTextContent(
      "CLAUDE.md a changé depuis l'import (modifié, supprimé ou devenu illisible) : réimportez-le. Rien n'a été enregistré.",
    );
    expect(disque.transactions).toEqual([]);
    expect(await screen.findByRole("button", { name: "Importer" })).toBeInTheDocument();
    expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
  });

  test("test_ac_077_2_modele_cree_entre_temps_message_clair_et_rien_n_est_ecrase", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);
    disque.modifierHorsCadre(
      ".cadre/cadre.yaml",
      "schema_version: 1\ngenerator_version: 9.9.9\ntools: []\n",
    );

    fireEvent.click(boutonEnregistrer());

    const alerte = await screen.findByRole("alert", { name: "Enregistrement" });
    expect(alerte).toHaveTextContent(t("save.error.MODELE_EXISTANT"));
    expect(disque.transactions).toEqual([]);
    expect(texte(disque, ".cadre/cadre.yaml")).toBe(
      "schema_version: 1\ngenerator_version: 9.9.9\ntools: []\n",
    );
  });
});

describe("enregistrement impossible ou déjà en cours", () => {
  test("test_ac_077_2_modele_en_lecture_seule_bouton_desactive_avec_explication", async () => {
    const disque = new DisqueMemoire(ROOT, {
      ".cadre/cadre.yaml": "schema_version: 2\ngenerator_version: 9.0.0\ntools: [claude-code]\n",
    });
    await ouvrir(disque);

    await waitFor(() => {
      expect(boutonEnregistrer()).toHaveAccessibleDescription(t("save.readOnly"));
    });
    expect(boutonEnregistrer()).toBeDisabled();
    expect(screen.getByText(t("save.readOnly"))).toBeInTheDocument();
  });

  test("test_ac_077_1_pas_de_double_enregistrement_pendant_un_enregistrement_en_cours", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);
    let terminer: () => void = () => undefined;
    disque.avantEcriture = () =>
      new Promise<void>((resolve) => {
        terminer = resolve;
      });

    fireEvent.click(boutonEnregistrer());
    // L'écriture est commencée et suspendue.
    await waitFor(() => {
      expect(disque.transactions).toHaveLength(1);
    });
    expect(boutonEnregistrer()).toBeDisabled();
    fireEvent.click(boutonEnregistrer());
    expect(screen.getByRole("status", { name: "Enregistrement" })).toHaveTextContent(
      t("save.saving"),
    );
    await act(async () => {
      terminer();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    expect(disque.transactions).toHaveLength(1);
  });
});

describe("double clic avant le rendu suivant", () => {
  test("test_ac_077_1_deux_clics_dans_le_meme_lot_ne_lancent_qu_un_enregistrement", async () => {
    const disque = disqueAvecClaude();
    await ouvrirEtImporter(disque);
    const bouton = boutonEnregistrer();

    // Les deux clics arrivent avant que React n'ait désactivé le bouton.
    act(() => {
      bouton.click();
      bouton.click();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    expect(disque.transactions).toHaveLength(1);
  });
});

describe("dossier .cadre/ sans cadre.yaml (AC-077-4)", () => {
  test("test_ac_077_4_un_cadre_avec_seulement_tmp_verrou_n_est_pas_un_modele_import_propose_puis_enregistre", async () => {
    // Verrou laissé par un premier enregistrement raté (US-005, écarts constatés d'ADR-001).
    const disque = disqueAvecClaude({ ".cadre/tmp/verrou": "" });

    await ouvrirEtImporter(disque);
    fireEvent.click(boutonEnregistrer());

    await waitFor(() => {
      expect(screen.queryByText(/Non enregistré/)).not.toBeInTheDocument();
    });
    expect(disque.octets(".cadre/cadre.yaml")).toBeDefined();
  });
});
