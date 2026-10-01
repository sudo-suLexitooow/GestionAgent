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

async function drop(drops: InMemoryDropSource, paths: string[]) {
  // L'abonnement au dépôt est pris au montage : on le laisse s'établir avant de déposer.
  await act(() => Promise.resolve());
  await act(async () => {
    drops.drop(paths);
    await Promise.resolve();
  });
}

describe("glisser-déposer sur l'accueil", () => {
  test("test_ac_001_2_deposer_un_dossier_ouvre_le_projet_comme_le_selecteur", async () => {
    const { drops } = renderApp({ "/home/lea/mon-projet": "ok" });

    await drop(drops, ["/home/lea/mon-projet"]);

    expect(await screen.findByRole("heading", { name: "mon-projet" })).toBeInTheDocument();
    expect(screen.getByText("/home/lea/mon-projet")).toBeInTheDocument();
  });

  test.each([
    ["un fichier", ["/home/lea/notes.txt"]],
    ["plusieurs dossiers", ["/home/lea/a", "/home/lea/b"]],
  ])("test_ac_001_3_deposer_%s_n_ouvre_rien_et_demande_un_seul_dossier", async (_label, paths) => {
    const { drops } = renderApp({
      "/home/lea/notes.txt": "not-a-directory",
      "/home/lea/a": "ok",
      "/home/lea/b": "ok",
    });

    await drop(drops, paths);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Déposez un seul dossier : pas un fichier, ni plusieurs éléments.",
    );
    expect(screen.getByRole("heading", { name: "Cadre" })).toBeInTheDocument();
  });

  test("test_ac_001_2_la_zone_de_depot_est_indiquee_sur_l_accueil", () => {
    renderApp();

    expect(
      screen.getByText("ou déposez un dossier de projet dans cette fenêtre"),
    ).toBeInTheDocument();
  });
});

describe("ouverture hors ligne, sans compte", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("test_ac_001_6_ouvrir_un_dossier_ne_fait_aucun_appel_reseau_ni_ne_demande_de_compte", async () => {
    // Réseau coupé : toute tentative d'accès est enregistrée puis échoue.
    const network = vi.fn(() => {
      throw new Error("réseau indisponible");
    });
    vi.stubGlobal("fetch", network);
    vi.stubGlobal("XMLHttpRequest", network);
    vi.stubGlobal("WebSocket", network);
    vi.stubGlobal("EventSource", network);
    const { folders, drops } = renderApp({ "/home/lea/a": "ok", "/home/lea/b": "ok" });
    expectNoAccountPrompt();

    folders.answerPickerWith(null);
    await clickOpen();
    await drop(drops, ["/home/lea/a"]);

    expect(await screen.findByRole("heading", { name: "a" })).toBeInTheDocument();
    expectNoAccountPrompt();
    expect(network).not.toHaveBeenCalled();
    expect(folders.inspected).toEqual(["/home/lea/a"]);
  });
});

function expectNoAccountPrompt() {
  expect(document.body).not.toHaveTextContent(
    /compte|connexion|se connecter|identifiant|mot de passe|s'inscrire/i,
  );
  expect(document.querySelector("input[type=password], input[type=email]")).toBeNull();
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

  test.each([
    [
      "inexistant",
      "not-found",
      "Ce dossier n'existe pas (ou plus). Vérifiez le chemin puis réessayez.",
    ],
    ["illisible", "unreadable", "Ce dossier ne peut pas être lu : droits d'accès insuffisants."],
  ] as const)(
    "test_ac_001_4_dossier_%s_affiche_un_message_clair_et_reste_sur_l_accueil",
    async (_label, status, message) => {
      const { folders } = renderApp({ "/projets/x": status });
      folders.answerPickerWith("/projets/x");

      await clickOpen();

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("button", { name: "Ouvrir un dossier" })).toBeInTheDocument();
    },
  );

  test.each([
    [
      "PROJET_OCCUPE",
      "Une autre fenêtre de Cadre enregistre ce projet : la reprise des écritures interrompues est reportée.",
    ],
    [
      "RECUPERATION_IMPOSSIBLE",
      "Une écriture interrompue n'a pas pu être reprise : des fichiers du projet peuvent être partiellement modifiés. Les copies d'origine sont dans le dossier indiqué, rien n'a été supprimé.",
    ],
    ["LECTURE_SEULE", "Une écriture interrompue n'a pas pu être reprise à l'ouverture du projet."],
  ])("test_ac_005_4_avertissement_%s_affiche_au_dessus_du_projet_ouvert", async (code, message) => {
    const { folders } = renderApp({ "/home/lea/mon-projet": "ok" });
    folders.answerPickerWith("/home/lea/mon-projet");
    folders.warnOnPrepare({ code, detail: "/home/lea/mon-projet/.cadre/tmp/de-cote-txn-1" });

    await clickOpen();

    expect(await screen.findByRole("heading", { name: "mon-projet" })).toBeInTheDocument();
    const avertissement = screen.getByRole("status");
    expect(avertissement).toHaveTextContent(message);
    expect(avertissement).toHaveTextContent("/home/lea/mon-projet/.cadre/tmp/de-cote-txn-1");
  });

  test("test_ac_001_4_echec_systeme_affiche_un_message_sans_planter", async () => {
    const { folders } = renderApp();
    folders.pickFolder = () => Promise.reject(new Error("dialogue indisponible"));

    await clickOpen();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le dossier n'a pas pu être ouvert. Réessayez.",
    );
    expect(screen.getByRole("heading", { name: "Cadre" })).toBeInTheDocument();
  });

  test("test_ac_001_5_annuler_le_selecteur_reste_sur_l_accueil_sans_message", async () => {
    const { folders } = renderApp({ "/projets/x": "not-found" });
    folders.answerPickerWith("/projets/x").answerPickerWith(null);
    await clickOpen();
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await clickOpen();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir un dossier" })).toBeInTheDocument();
  });
});
