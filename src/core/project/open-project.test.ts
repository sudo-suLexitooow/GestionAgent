import { InMemoryFolderAccess } from "../testing/in-memory-folder-access";
import { openFromDrop, openFromPicker } from "./open-project";

describe("ouverture par glisser-déposer", () => {
  test("test_ac_001_2_ouvre_le_dossier_depose_comme_avec_le_selecteur", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/mon-projet": "ok" });

    const outcome = await openFromDrop(folders, ["/home/lea/mon-projet"]);

    expect(outcome).toEqual({
      kind: "opened",
      project: { name: "mon-projet", path: "/home/lea/mon-projet" },
    });
  });

  test("test_ac_001_3_fichier_depose_est_refuse_avec_un_seul_dossier_attendu", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/notes.txt": "not-a-directory" });

    const outcome = await openFromDrop(folders, ["/home/lea/notes.txt"]);

    expect(outcome).toEqual({ kind: "error", error: "drop-single-folder" });
  });

  test("test_ac_001_3_plusieurs_dossiers_deposes_sont_refuses_sans_rien_ouvrir", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/a": "ok", "/home/lea/b": "ok" });

    const outcome = await openFromDrop(folders, ["/home/lea/a", "/home/lea/b"]);

    expect(outcome).toEqual({ kind: "error", error: "drop-single-folder" });
    expect(folders.inspected).toEqual([]);
  });

  test("test_ac_001_4_dossier_depose_illisible_produit_une_erreur", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/secret": "unreadable" });

    const outcome = await openFromDrop(folders, ["/home/lea/secret"]);

    expect(outcome).toEqual({ kind: "error", error: "unreadable" });
  });

  test("test_ac_001_4_echec_systeme_pendant_un_depot_produit_une_erreur", async () => {
    const folders = new InMemoryFolderAccess();
    folders.inspectFolder = () => Promise.reject(new Error("IPC indisponible"));

    const outcome = await openFromDrop(folders, ["/home/lea/x"]);

    expect(outcome).toEqual({ kind: "error", error: "unexpected" });
  });
});

describe("ouverture depuis le sélecteur", () => {
  test("test_ac_001_1_ouvre_le_dossier_choisi_dans_le_selecteur", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/mon-projet": "ok" }).answerPickerWith(
      "/home/lea/mon-projet",
    );

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({
      kind: "opened",
      project: { name: "mon-projet", path: "/home/lea/mon-projet" },
    });
  });

  test.each([
    ["C:\\Users\\lea\\mon-projet", "mon-projet"],
    ["/home/lea/mon-projet/", "mon-projet"],
    ["C:\\Users\\lea\\mon-projet\\", "mon-projet"],
    ["C:\\", "C:\\"],
    ["/", "/"],
  ])("test_ac_001_1_nom_du_projet_pour_%s_est_%s", async (path, name) => {
    const folders = new InMemoryFolderAccess({ [path]: "ok" }).answerPickerWith(path);

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({ kind: "opened", project: { name, path } });
  });

  test("test_ac_001_5_annulation_du_selecteur_ne_produit_ni_projet_ni_erreur", async () => {
    const folders = new InMemoryFolderAccess().answerPickerWith(null);

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({ kind: "cancelled" });
    expect(folders.inspected).toEqual([]);
  });

  test.each([
    ["inexistant", "not-found"],
    ["illisible", "unreadable"],
  ] as const)("test_ac_001_4_dossier_%s_produit_une_erreur_sans_ouvrir", async (_label, status) => {
    const folders = new InMemoryFolderAccess({ "/projets/x": status }).answerPickerWith(
      "/projets/x",
    );

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({ kind: "error", error: status });
  });

  test("test_ac_001_4_echec_systeme_pendant_la_verification_produit_une_erreur", async () => {
    const folders = new InMemoryFolderAccess().answerPickerWith("/projets/x");
    folders.inspectFolder = () => Promise.reject(new Error("IPC indisponible"));

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({ kind: "error", error: "unexpected" });
  });

  test("test_ac_001_4_echec_systeme_du_selecteur_produit_une_erreur", async () => {
    const folders = new InMemoryFolderAccess();
    folders.pickFolder = () => Promise.reject(new Error("dialogue indisponible"));

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({ kind: "error", error: "unexpected" });
  });
});

describe("préparation du projet côté système (US-005, revue B points 8 et 9)", () => {
  test("test_ac_005_4_ouvrir_un_projet_le_prepare_cote_systeme", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/mon-projet": "ok" });

    const outcome = await openFromDrop(folders, ["/home/lea/mon-projet"]);

    expect(outcome.kind).toBe("opened");
    expect(folders.preparedProjects).toEqual(["/home/lea/mon-projet"]);
  });

  test("test_ac_005_4_dossier_invalide_n_est_pas_prepare", async () => {
    const folders = new InMemoryFolderAccess({ "/home/lea/notes.txt": "not-a-directory" });

    await openFromDrop(folders, ["/home/lea/notes.txt"]);

    expect(folders.preparedProjects).toEqual([]);
  });

  test("test_ac_005_4_echec_de_preparation_produit_une_erreur_dediee", async () => {
    const folders = new InMemoryFolderAccess({ "/projets/x": "ok" }).answerPickerWith("/projets/x");
    folders.prepareProject = () =>
      Promise.reject(new Error("RECUPERATION_IMPOSSIBLE : .cadre/tmp/txn-1"));

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({
      kind: "error",
      error: "project-preparation-failed",
      detail: "RECUPERATION_IMPOSSIBLE : .cadre/tmp/txn-1",
    });
  });

  test("test_ac_005_4_echec_de_ouvrir_projet_transmet_code_et_detail", async () => {
    const folders = new InMemoryFolderAccess({ "/projets/x": "ok" }).answerPickerWith("/projets/x");
    // Forme réelle du rejet Tauri : l'`ErreurDto` sérialisée.
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    folders.prepareProject = () =>
      Promise.reject({ code: "CHEMIN_INVALIDE", detail: "pas un dossier" });

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({
      kind: "error",
      error: "project-preparation-failed",
      detail: "CHEMIN_INVALIDE : pas un dossier",
    });
  });

  test("test_ac_005_4_reprise_impossible_le_projet_s_ouvre_avec_un_avertissement", async () => {
    const folders = new InMemoryFolderAccess({ "/projets/x": "ok" }).answerPickerWith("/projets/x");
    const warning = {
      code: "RECUPERATION_IMPOSSIBLE",
      detail: "/projets/x/.cadre/tmp/de-cote-txn-1",
    };
    folders.warnOnPrepare(warning);

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({
      kind: "opened",
      project: { name: "x", path: "/projets/x" },
      warning,
    });
  });
});
