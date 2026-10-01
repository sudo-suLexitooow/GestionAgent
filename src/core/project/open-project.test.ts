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
});
