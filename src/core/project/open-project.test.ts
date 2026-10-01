import { InMemoryFolderAccess } from "../testing/in-memory-folder-access";
import { openFromPicker } from "./open-project";

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

  test("test_ac_001_5_annulation_du_selecteur_ne_produit_ni_projet_ni_erreur", async () => {
    const folders = new InMemoryFolderAccess().answerPickerWith(null);

    const outcome = await openFromPicker(folders);

    expect(outcome).toEqual({ kind: "cancelled" });
    expect(folders.inspected).toEqual([]);
  });
});
