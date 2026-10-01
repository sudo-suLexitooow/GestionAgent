import { emit } from "@tauri-apps/api/event";
import { clearMocks, mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { tauriDropSource, tauriFolderAccess, tauriProjectFiles } from "./tauri-project-ports";

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

describe("lecture du projet par les commandes système", () => {
  test("test_ac_002_1_liste_un_dossier_par_list_project_dir", async () => {
    const calls = recordIpc(() => [{ name: "a", kind: "directory" }]);

    const entries = await tauriProjectFiles.listDir("/home/lea/p", ".claude/skills");

    expect(entries).toEqual([{ name: "a", kind: "directory" }]);
    expect(calls).toEqual([
      { cmd: "list_project_dir", args: { root: "/home/lea/p", path: ".claude/skills" } },
    ]);
  });

  test("test_ac_002_2_dossier_absent_relaye_null", async () => {
    recordIpc(() => null);

    expect(await tauriProjectFiles.listDir("/home/lea/p", ".claude/skills")).toBeNull();
  });

  test("test_ac_002_1_lit_un_fichier_en_octets_par_read_project_file", async () => {
    const calls = recordIpc(() => [97, 13, 10, 255]);

    const bytes = await tauriProjectFiles.readFile("/home/lea/p", ".claude/skills/a/SKILL.md");

    expect(bytes).toEqual(new Uint8Array([97, 13, 10, 255]));
    expect(calls).toEqual([
      {
        cmd: "read_project_file",
        args: { root: "/home/lea/p", path: ".claude/skills/a/SKILL.md" },
      },
    ]);
  });

  test("test_ac_002_4_fichier_absent_relaye_null", async () => {
    recordIpc(() => null);

    expect(await tauriProjectFiles.readFile("/home/lea/p", "SKILL.md")).toBeNull();
  });
});

describe("glisser-déposer hors d'une fenêtre Tauri (navigateur de développement)", () => {
  test("test_ac_001_2_hors_de_tauri_le_depot_est_inactif_sans_erreur", async () => {
    const unsubscribe = await tauriDropSource.onDrop(() => undefined);

    expect(() => {
      unsubscribe();
    }).not.toThrow();
  });
});

describe("glisser-déposer natif de la webview", () => {
  beforeEach(() => {
    mockWindows("main");
    mockIPC(() => null, { shouldMockEvents: true });
    // Indicateur posé par Tauri dans une vraie fenêtre ; `mockIPC` ne le pose pas.
    Object.assign(globalThis, { isTauri: true });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "isTauri");
  });

  test("test_ac_001_2_relaie_les_chemins_deposes_et_ignore_le_survol", async () => {
    const received: string[][] = [];
    await tauriDropSource.onDrop((paths) => received.push(paths));

    await emit("tauri://drag-over", { position: { x: 1, y: 1 } });
    await emit("tauri://drag-drop", {
      paths: ["/home/lea/a", "/home/lea/b"],
      position: { x: 1, y: 1 },
    });

    expect(received).toEqual([["/home/lea/a", "/home/lea/b"]]);
  });

  test("test_ac_001_2_le_desabonnement_arrete_la_reception", async () => {
    const received: string[][] = [];
    const unsubscribe = await tauriDropSource.onDrop((paths) => received.push(paths));

    unsubscribe();
    await emit("tauri://drag-drop", { paths: ["/home/lea/a"], position: { x: 1, y: 1 } });

    expect(received).toEqual([]);
  });
});
