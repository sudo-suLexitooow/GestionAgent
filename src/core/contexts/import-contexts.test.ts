import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { InMemoryProjectFiles } from "../testing/in-memory-project-files";
import { recordingProjectFiles } from "../testing/recording-project-files";
import { buildContextImport, detectContextFiles, importContexts } from "./import-contexts";

const ROOT = "/home/lea/projet";

function detect(content: Record<string, string | Uint8Array>) {
  return detectContextFiles(new InMemoryProjectFiles(ROOT, content), ROOT, claudeCodeAdapter);
}

describe("détection des fichiers de contexte à importer", () => {
  test("test_ac_003_1_detecte_claude_md_a_la_racine_d_un_projet_sans_cadre", async () => {
    const detected = await detect({ "CLAUDE.md": "# Projet\n", "src/main.ts": "" });

    expect(detected.map((spec) => spec.file)).toEqual(["CLAUDE.md"]);
  });

  test("test_ac_003_1_detecte_claude_md_puis_agents_md_en_lecture_seule", async () => {
    const detected = await detect({ "AGENTS.md": "# Agents\n", "CLAUDE.md": "# Projet\n" });

    expect(detected).toEqual([
      { file: "CLAUDE.md", name: "CLAUDE", type: "projet" },
      { file: "AGENTS.md", name: "AGENTS", type: "autre", readonly: true },
    ]);
  });

  test("test_ac_003_1_rien_n_est_propose_si_le_projet_a_deja_un_dossier_cadre", async () => {
    const detected = await detect({
      "CLAUDE.md": "# Projet\n",
      "AGENTS.md": "# Agents\n",
      ".cadre/cadre.yaml": "schema_version: 1\n",
    });

    expect(detected).toEqual([]);
  });

  test("test_ac_006_6_un_dossier_cadre_sans_cadre_yaml_n_est_pas_un_modele_et_l_import_est_propose", async () => {
    const detected = await detect({ "CLAUDE.md": "# Projet\n", ".cadre/tmp/verrou": "" });

    expect(detected.map((spec) => spec.file)).toEqual(["CLAUDE.md"]);
  });

  test("test_ac_006_6_un_dossier_cadre_avec_seulement_runs_et_backups_l_import_est_propose", async () => {
    const detected = await detect({
      "CLAUDE.md": "# Projet\n",
      ".cadre/runs/": "",
      ".cadre/backups/CLAUDE.md": "# Ancien\n",
    });

    expect(detected.map((spec) => spec.file)).toEqual(["CLAUDE.md"]);
  });

  // US-076 : un CLAUDE.md lien est proposé, puis signalé à l'import au lieu d'être ignoré.
  test("test_ac_076_3_un_claude_md_lien_est_detecte", async () => {
    const files = new InMemoryProjectFiles(ROOT, {}).addLink("CLAUDE.md");

    const detected = await detectContextFiles(files, ROOT, claudeCodeAdapter);

    expect(detected.map((spec) => spec.file)).toEqual(["CLAUDE.md"]);
  });

  test("test_ac_003_1_un_dossier_claude_md_ou_un_fichier_hors_racine_n_est_pas_detecte", async () => {
    const detected = await detect({ "CLAUDE.md/notes.md": "x", "docs/AGENTS.md": "# Agents\n" });

    expect(detected).toEqual([]);
  });
});

const CLAUDE_SPEC = { file: "CLAUDE.md", name: "CLAUDE", type: "projet" } as const;
const AGENTS_SPEC = { file: "AGENTS.md", name: "AGENTS", type: "autre", readonly: true } as const;

/** Octets d'un texte, précédés si besoin d'un BOM UTF-8. */
function bytesOf(text: string, { bom = false } = {}): Uint8Array {
  const encoded = new TextEncoder().encode(text);
  return bom ? Uint8Array.of(0xef, 0xbb, 0xbf, ...encoded) : encoded;
}

describe("construction des contextes importés (en mémoire)", () => {
  test("test_ac_003_2_un_contexte_par_fichier_au_contenu_identique_octet_pour_octet", () => {
    // BOM, fins de ligne CRLF, espaces et lignes vides finales, sans fin de ligne finale.
    const claude = bytesOf("# Projet\r\n\r\nRègles  \r\n\r\n\r\n  ", { bom: true });
    // LF, caractères hors ASCII, lignes vides finales.
    const agents = bytesOf("# Agents\n\n- é, ✓, 漢字\n\n\n");

    const result = buildContextImport([
      { spec: CLAUDE_SPEC, bytes: claude },
      { spec: AGENTS_SPEC, bytes: agents },
    ]);

    expect(result.contexts).toHaveLength(2);
    expect(result.contexts[0]?.content).toEqual(claude);
    expect(result.contexts[1]?.content).toEqual(agents);
  });

  test("test_ac_003_2_metadonnees_et_chemins_des_contextes_suivent_adr_001", () => {
    const result = buildContextImport([
      { spec: CLAUDE_SPEC, bytes: bytesOf("# Projet\n") },
      { spec: AGENTS_SPEC, bytes: bytesOf("# Agents\n") },
    ]);

    expect(result.contexts.map(({ entry, path }) => ({ entry, path }))).toEqual([
      {
        entry: { name: "CLAUDE", title: "CLAUDE.md", type: "projet", source: "CLAUDE.md" },
        path: ".cadre/contexte/CLAUDE.md",
      },
      {
        entry: {
          name: "AGENTS",
          title: "AGENTS.md",
          type: "autre",
          source: "AGENTS.md",
          readonly: true,
        },
        path: ".cadre/contexte/AGENTS.md",
      },
    ]);
  });

  test("test_ac_003_4_un_claude_md_non_utf8_donne_un_avertissement_d_encodage_et_garde_ses_octets", () => {
    // « Règles » en Latin-1 (0xE8) : pas de l'UTF-8 valide.
    const latin1 = Uint8Array.of(0x52, 0xe8, 0x67, 0x6c, 0x65, 0x73, 0x0d, 0x0a);

    const result = buildContextImport([
      { spec: CLAUDE_SPEC, bytes: latin1 },
      { spec: AGENTS_SPEC, bytes: bytesOf("# Agents\n") },
    ]);

    expect(result.warnings).toEqual([{ source: "CLAUDE.md", code: "encoding" }]);
    expect(result.contexts.map((context) => context.entry.name)).toEqual(["CLAUDE", "AGENTS"]);
    expect(result.contexts[0]?.content).toEqual(latin1);
  });

  test("test_ac_003_4_un_claude_md_vide_donne_un_contexte_vide_sans_avertissement", () => {
    const result = buildContextImport([{ spec: CLAUDE_SPEC, bytes: new Uint8Array(0) }]);

    expect(result.contexts).toHaveLength(1);
    expect(result.contexts[0]?.entry.name).toBe("CLAUDE");
    expect(result.contexts[0]?.content).toEqual(new Uint8Array(0));
    expect(result.warnings).toEqual([]);
  });
});

describe("import des contextes détectés depuis le projet", () => {
  test("test_ac_003_2_importe_les_octets_lus_dans_le_projet_sans_conversion", async () => {
    const claude = bytesOf("# Projet\r\nRègles\r\n", { bom: true });
    const agents = bytesOf("# Agents\n\n\n");
    const files = new InMemoryProjectFiles(ROOT, { "CLAUDE.md": claude, "AGENTS.md": agents });

    const result = await importContexts(files, ROOT, [CLAUDE_SPEC, AGENTS_SPEC]);

    expect(result.contexts.map((context) => context.entry.source)).toEqual([
      "CLAUDE.md",
      "AGENTS.md",
    ]);
    expect(result.contexts[0]?.content).toEqual(claude);
    expect(result.contexts[1]?.content).toEqual(agents);
    expect(result.warnings).toEqual([]);
  });

  test("test_ac_003_5_les_fichiers_d_origine_restent_inchanges_et_ne_sont_que_lus", async () => {
    const claude = bytesOf("# Projet\r\n", { bom: true });
    const agents = bytesOf("# Agents\n");
    const disk = new InMemoryProjectFiles(ROOT, { "CLAUDE.md": claude, "AGENTS.md": agents });
    const before = { claude: claude.slice(), agents: agents.slice() };
    const recorded = recordingProjectFiles(disk);

    const specs = await detectContextFiles(recorded.files, ROOT, claudeCodeAdapter);
    const result = await importContexts(recorded.files, ROOT, specs);
    // Le modèle en mémoire évolue ensuite (édition future) : le disque ne doit pas suivre.
    for (const context of result.contexts) context.content.fill(0x78);

    expect(await disk.readFile(ROOT, "CLAUDE.md")).toEqual(before.claude);
    expect(await disk.readFile(ROOT, "AGENTS.md")).toEqual(before.agents);
    expect([...recorded.used].sort()).toEqual(["listDir", "readFile"]);
  });

  test("test_ac_003_4_un_fichier_illisible_ou_trop_gros_donne_un_avertissement_sans_planter", async () => {
    const files = new InMemoryProjectFiles(ROOT, {
      "CLAUDE.md": "# Projet\n",
      "AGENTS.md": "# Agents\n",
    })
      .failWith("CLAUDE.md", "too-large")
      .makeUnreadable("AGENTS.md");

    const result = await importContexts(files, ROOT, [CLAUDE_SPEC, AGENTS_SPEC]);

    expect(result).toEqual({
      contexts: [],
      warnings: [
        { source: "CLAUDE.md", code: "too-large" },
        { source: "AGENTS.md", code: "unreadable" },
      ],
    });
  });

  test("test_ac_076_3_un_claude_md_lien_donne_un_avertissement_lien_sans_etre_lu", async () => {
    const files = new InMemoryProjectFiles(ROOT, { "AGENTS.md": "# Agents\n" }).addLink(
      "CLAUDE.md",
    );

    const result = await importContexts(files, ROOT, [CLAUDE_SPEC, AGENTS_SPEC]);

    expect(result.warnings).toEqual([{ source: "CLAUDE.md", code: "link" }]);
    expect(result.contexts.map((context) => context.entry.source)).toEqual(["AGENTS.md"]);
  });
});
