import { stringify } from "yaml";
import { InMemoryProjectFiles } from "../testing/in-memory-project-files";
import { recordingProjectFiles } from "../testing/recording-project-files";
import { SystemeFichiersMemoire } from "../testing/systeme-fichiers-memoire";
import { nouveauCadre, type CadreYaml } from "./cadre-yaml";
import { chargerModele } from "./charger-modele";
import { enregistrerCadre } from "./enregistrer";

const ROOT = "/home/lea/projet";

const octets = (texte: string) => new TextEncoder().encode(texte);

const AGENT = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  name: "frontend",
  role: "Développeur front-end React",
  description: "Implémente les écrans React.",
  target: "claude-code",
  skills: ["ui-design"],
  contexts: ["CLAUDE"],
  presets: { autonomy: "medium", language: "fr" },
  scope: [{ path: "src/ui/", level: "write" }],
  exports: { "claude-code": { frontmatter: { model: "sonnet", color: "blue" } } },
};

const AGENT_VALIDE =
  "id: 0b5d8f8e-1c2d-4e5f-8a9b-0c1d2e3f4a5b\nname: valide\ntarget: claude-code\n";

function charger(contenu: Record<string, string | Uint8Array>) {
  return chargerModele(new InMemoryProjectFiles(ROOT, contenu), ROOT);
}

/** `cadre.yaml` v1 minimal valide. */
const CADRE_V1 = "schema_version: 1\ngenerator_version: 0.1.0\ntools: [claude-code]\n";

describe("réouverture d'un projet enregistré (AC-006-1)", () => {
  test("test_ac_006_1_le_modele_relu_est_identique_a_celui_enregistre", async () => {
    const contextes = [
      { name: "CLAUDE", title: "CLAUDE.md", type: "projet", source: "CLAUDE.md" },
      { name: "AGENTS", title: "AGENTS.md", type: "autre", source: "AGENTS.md", readonly: true },
    ];
    const cadre: CadreYaml & { contexts: typeof contextes } = {
      ...nouveauCadre({ generatorVersion: "0.1.0", outils: ["claude-code"] }),
      contexts: contextes,
    };
    const disque = new SystemeFichiersMemoire();
    expect(await enregistrerCadre(disque, ROOT, cadre)).toEqual({ ok: true });
    // Octets bruts : BOM, CRLF, sans fin de ligne finale, non UTF-8.
    const claude = Uint8Array.of(0xef, 0xbb, 0xbf, ...octets("# Projet\r\n\r\nRègles  "));
    const agents = Uint8Array.of(0x23, 0x20, 0xe9, 0x0a);
    const instructions = octets("Tu es le développeur front-end.\r\n");
    const skill = "---\nname: ui-design\ndescription: Conçoit les écrans.\n---\n# UI\n";

    const resultat = await charger({
      ...disque.instantane(),
      ".cadre/agents/frontend.yaml": stringify(AGENT),
      ".cadre/agents/frontend.md": instructions,
      ".cadre/contexte/CLAUDE.md": claude,
      ".cadre/contexte/AGENTS.md": agents,
      ".cadre/skills/ui-design/SKILL.md": skill,
      ".cadre/tmp/verrou": "",
    });

    expect(resultat).toEqual({
      etat: "charge",
      lectureSeule: false,
      modele: {
        cadre,
        agents: [
          { fichier: ".cadre/agents/frontend.yaml", statut: "ok", donnees: AGENT, instructions },
        ],
        contextes: [
          { entree: contextes[0], contenu: claude },
          { entree: contextes[1], contenu: agents },
        ],
        skills: [
          {
            folder: "ui-design",
            status: "ok",
            name: "ui-design",
            description: "Conçoit les écrans.",
          },
        ],
      },
    });
  });

  test("test_ac_006_1_yaml_avec_bom_et_crlf_relu_et_agent_sans_instructions", async () => {
    const resultat = await charger({
      ".cadre/cadre.yaml": Uint8Array.of(
        0xef,
        0xbb,
        0xbf,
        ...octets(CADRE_V1.replaceAll("\n", "\r\n")),
      ),
      ".cadre/agents/valide.yaml": AGENT_VALIDE.replaceAll("\n", "\r\n"),
    });

    expect(resultat).toMatchObject({
      etat: "charge",
      modele: {
        cadre: { schema_version: 1, generator_version: "0.1.0", tools: ["claude-code"] },
        agents: [{ statut: "ok", donnees: { name: "valide" }, instructions: null }],
        contextes: [],
        skills: [],
      },
    });
  });
});

describe("version de format plus récente (AC-006-2)", () => {
  test("test_ac_006_2_schema_version_plus_recente_ouvre_le_modele_en_lecture_seule", async () => {
    const resultat = await charger({
      ".cadre/cadre.yaml": "schema_version: 2\ngenerator_version: 9.0.0\ntools: { nouveau: oui }\n",
    });

    expect(resultat).toMatchObject({ etat: "charge", lectureSeule: true });
  });
});

describe("agent invalide (AC-006-3)", () => {
  test.each([
    ["yaml_casse", "id: 1\nname: x\n  target: claude-code\n", "YAML_SYNTAX", 2],
    ["cle_en_double", `${AGENT_VALIDE}name: autre\n`, "YAML_DUPLICATE_KEY", 4],
    ["non_conforme_au_schema", `${AGENT_VALIDE}presets:\n  autonomy: max\n`, "SCHEMA", 5],
    ["sans_id", "# agent\nname: x\ntarget: claude-code\n", "SCHEMA", 2],
    ["racine_liste", "- id: x\n", "SCHEMA", 1],
  ])(
    "test_ac_006_3_agent_%s_marque_en_erreur_avec_fichier_et_ligne",
    async (_cas, contenu, code, ligne) => {
      const resultat = await charger({
        ".cadre/cadre.yaml": CADRE_V1,
        ".cadre/agents/x.yaml": contenu,
        ".cadre/agents/valide.yaml": AGENT_VALIDE,
      });

      expect(resultat).toMatchObject({
        etat: "charge",
        lectureSeule: false,
        modele: {
          agents: [
            { fichier: ".cadre/agents/valide.yaml", statut: "ok" },
            {
              fichier: ".cadre/agents/x.yaml",
              statut: "erreur",
              erreur: { fichier: ".cadre/agents/x.yaml", code, ligne },
            },
          ],
        },
      });
    },
  );

  test("test_ac_006_3_agent_non_utf8_ou_illisible_marque_en_erreur", async () => {
    const files = new InMemoryProjectFiles(ROOT, {
      ".cadre/cadre.yaml": CADRE_V1,
      ".cadre/agents/a.yaml": Uint8Array.of(0x6e, 0x3a, 0xe9, 0x0a),
      ".cadre/agents/b.yaml": AGENT_VALIDE,
      ".cadre/agents/b.md": "x",
      ".cadre/agents/c.yaml": AGENT_VALIDE,
    })
      .failWith(".cadre/agents/b.md", "too-large")
      .makeUnreadable(".cadre/agents/c.yaml");

    const resultat = await chargerModele(files, ROOT);

    expect(resultat).toMatchObject({
      modele: {
        agents: [
          { statut: "erreur", erreur: { fichier: ".cadre/agents/a.yaml", code: "ENCODING" } },
          { statut: "erreur", erreur: { fichier: ".cadre/agents/b.md", code: "TOO_LARGE" } },
          { statut: "erreur", erreur: { fichier: ".cadre/agents/c.yaml", code: "UNREADABLE" } },
        ],
      },
    });
  });

  test("test_ac_006_3_le_chargement_ne_fait_que_lire", async () => {
    const { files, used } = recordingProjectFiles(
      new InMemoryProjectFiles(ROOT, {
        ".cadre/cadre.yaml": CADRE_V1,
        ".cadre/agents/x.yaml": "id: [\n",
      }),
    );

    await chargerModele(files, ROOT);

    expect([...used].sort()).toEqual(["listDir", "readFile"]);
  });
});

describe("modèle incomplet (AC-006-5) ou absent (AC-006-6)", () => {
  test("test_ac_006_5_cadre_yaml_absent_avec_un_dossier_cadre_est_un_modele_incomplet", async () => {
    const resultat = await charger({
      ".cadre/agents/x.yaml": AGENT_VALIDE,
      ".cadre/tmp/verrou": "",
    });

    expect(resultat).toEqual({
      etat: "incomplet",
      erreur: { fichier: ".cadre/cadre.yaml", code: "CADRE_MISSING" },
    });
  });

  test.each([
    [
      "schema_version_texte",
      'schema_version: "1"\ngenerator_version: 0.1.0\ntools: []\n',
      "SCHEMA",
      1,
    ],
    ["schema_version_absente", "generator_version: 0.1.0\ntools: []\n", "SCHEMA", 1],
    ["semver_invalide", "schema_version: 1\ngenerator_version: 1.0\ntools: []\n", "SCHEMA", 2],
    ["yaml_casse", "schema_version: 1\n tools: [\n", "YAML_SYNTAX", 1],
  ])(
    "test_ac_006_5_cadre_yaml_invalide_donne_un_modele_incomplet_%s",
    async (_cas, contenu, code, ligne) => {
      expect(await charger({ ".cadre/cadre.yaml": contenu })).toEqual({
        etat: "incomplet",
        erreur: { fichier: ".cadre/cadre.yaml", code, ligne },
      });
    },
  );

  test.each([
    ["sans_dossier_cadre", { "CLAUDE.md": "# P\n" }],
    ["dossier_cadre_avec_seulement_le_verrou", { ".cadre/tmp/verrou": "" }],
    ["dossier_cadre_vide", { ".cadre/": "" }],
  ])("test_ac_006_6_pas_de_modele_%s", async (_cas, contenu) => {
    expect(await charger(contenu)).toEqual({ etat: "aucun" });
  });
});
