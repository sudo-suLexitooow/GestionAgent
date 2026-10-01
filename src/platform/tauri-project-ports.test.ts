import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { tauriFolderAccess } from "./tauri-project-ports";

// Le pont IPC de Tauri est simulé par `mockIPC` (outil officiel) : le code testé reste l'adaptateur réel.
interface Call {
  cmd: string;
  args: unknown;
}

function recordIpc(answer: (cmd: string) => unknown): Call[] {
  const calls: Call[] = [];
  mockIPC((cmd, args) => {
    calls.push({ cmd, args });
    return answer(cmd);
  });
  return calls;
}

afterEach(() => {
  clearMocks();
});

describe("sélecteur de dossier Tauri", () => {
  test("test_ac_001_1_ouvre_le_selecteur_en_mode_dossier_unique", async () => {
    const calls = recordIpc(() => "/home/lea/mon-projet");

    const path = await tauriFolderAccess.pickFolder();

    expect(path).toBe("/home/lea/mon-projet");
    expect(calls).toEqual([
      { cmd: "plugin:dialog|open", args: { options: { directory: true, multiple: false } } },
    ]);
  });

  test("test_ac_001_5_annulation_du_selecteur_renvoie_null", async () => {
    recordIpc(() => null);

    expect(await tauriFolderAccess.pickFolder()).toBeNull();
  });
});

describe("vérification d'un dossier par la commande système", () => {
  test("test_ac_001_4_transmet_le_chemin_a_inspect_folder_et_relaie_son_verdict", async () => {
    const calls = recordIpc(() => "unreadable");

    const status = await tauriFolderAccess.inspectFolder("/home/lea/secret");

    expect(status).toBe("unreadable");
    expect(calls).toEqual([{ cmd: "inspect_folder", args: { path: "/home/lea/secret" } }]);
  });
});
