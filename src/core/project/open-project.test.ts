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
  ] as const)(
    "test_ac_001_4_dossier_%s_produit_une_erreur_sans_ouvrir",
    async (_label, status) => {
      const folders = new InMemoryFolderAccess({ "/projets/x": status }).answerPickerWith(
        "/projets/x",
      );

      const outcome = await openFromPicker(folders);

      expect(outcome).toEqual({ kind: "error", error: status });
    },
  );

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
