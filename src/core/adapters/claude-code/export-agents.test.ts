import { parseDocument } from "yaml";
import type { AgentAExporter, FichierExporte } from "../adapter";
import { claudeCodeAdapter } from "./claude-code-adapter";

const FRONTEND: AgentAExporter = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  name: "frontend",
  role: "Tu es le développeur front-end du projet. Tu travailles en TypeScript et React.\n",
  description: "Développe l'interface React. À utiliser pour toute tâche dans src/ui/.",
};

function exporter(...agents: AgentAExporter[]): FichierExporte[] {
  return claudeCodeAdapter.exporter({ agents });
}

/**
 * Écarts d'un fichier exporté au format de sous-agent documenté par ADR-003 (2) : UTF-8 sans BOM,
 * LF, ligne finale ; en-tête YAML entre deux lignes `---` avec `name` puis `description`, dans cet
 * ordre ; `name` = nom du fichier, sans `:` ni `-` initial ; `description` non vide, entre
 * guillemets doubles ; corps = rôle. La CLI n'est pas disponible en CI (AC-008-2).
 */
function ecartsAuFormat(fichier: FichierExporte, role: string): string[] {
  const ecarts: string[] = [];
  const { contenu, chemin } = fichier;
  if (contenu.startsWith("﻿")) ecarts.push("BOM");
  if (contenu.includes("\r")) ecarts.push("CR");
  if (!contenu.endsWith("\n")) ecarts.push("pas de ligne finale");
  const lignes = contenu.split("\n");
  if (lignes[0] !== "---") return [...ecarts, "pas d'en-tête en première ligne"];
  const fin = lignes.indexOf("---", 1);
  if (fin < 0) return [...ecarts, "en-tête non fermé"];
  const brut = lignes.slice(1, fin).join("\n");
  const document = parseDocument(brut, { uniqueKeys: true, strict: true });
  if (document.errors.length > 0) return [...ecarts, `YAML : ${document.errors[0]?.message ?? ""}`];
  const entete = document.toJS() as Record<string, unknown>;
  if (Object.keys(entete).join(",") !== "name,description") {
    ecarts.push(`champs ${Object.keys(entete).join(",")}`);
  }
  const nomFichier = /^\.claude\/agents\/([^/]+)\.md$/u.exec(chemin)?.[1];
  if (entete.name !== nomFichier) ecarts.push(`name ${String(entete.name)} ≠ fichier ${chemin}`);
  if (typeof entete.name !== "string" || /^-|:/u.test(entete.name)) ecarts.push("name interdit");
  if (typeof entete.description !== "string" || entete.description.trim() === "") {
    ecarts.push("description vide");
  }
  if (!lignes.slice(1, fin).some((ligne) => ligne.startsWith('description: "'))) {
    ecarts.push("description sans guillemets doubles");
  }
  const corps = lignes.slice(fin + 1).join("\n");
  const attendu = role === "" || role.endsWith("\n") ? role : `${role}\n`;
  if (corps !== attendu) ecarts.push("corps ≠ rôle");
  return ecarts;
}

describe("export des agents vers Claude Code (ADR-003, format (2))", () => {
  test("test_ac_008_1_l_agent_frontend_donne_claude_agents_frontend_md_avec_en_tete_et_corps", () => {
    expect(exporter(FRONTEND)).toEqual([
      {
        chemin: ".claude/agents/frontend.md",
        source: "agent:7c9e6679-7425-40de-944b-e07fc1f90ae7",
        contenu:
          "---\n" +
          "name: frontend\n" +
          `description: "Développe l'interface React. À utiliser pour toute tâche dans src/ui/."\n` +
          "---\n" +
          "Tu es le développeur front-end du projet. Tu travailles en TypeScript et React.\n",
      },
    ]);
  });

  test("test_ac_008_1_un_fichier_par_agent", () => {
    const backend = { ...FRONTEND, id: "0b5d8f8e-1c2d-4e5f-8a9b-0c1d2e3f4a5b", name: "backend" };

    expect(exporter(FRONTEND, backend).map((fichier) => fichier.chemin)).toEqual([
      ".claude/agents/frontend.md",
      ".claude/agents/backend.md",
    ]);
  });

  test("test_ac_008_1_description_vide_donne_le_texte_de_repli", () => {
    const [fichier] = exporter({ ...FRONTEND, description: "  " });

    expect(fichier?.contenu).toContain('\ndescription: "Agent frontend géré par Cadre."\n');
  });

  test("test_ac_008_1_role_sans_fin_de_ligne_le_fichier_se_termine_par_une_fin_de_ligne", () => {
    const [fichier] = exporter({ ...FRONTEND, role: "Rôle sur une ligne" });

    expect(fichier?.contenu.endsWith("---\nRôle sur une ligne\n")).toBe(true);
  });

  test.each([
    ["exemple_adr_003", FRONTEND],
    [
      "description_piegeuse",
      {
        ...FRONTEND,
        description: 'Dit "bonjour" : #pas un commentaire\n- pas une liste\\ \ttab',
      },
    ],
    ["description_en_tete_yaml", { ...FRONTEND, description: "---\nname: autre" }],
    ["role_vide_et_description_vide", { ...FRONTEND, role: "", description: "" }],
    ["role_multiligne_avec_tirets", { ...FRONTEND, role: "---\n# Titre\n\n- point\n---" }],
    ["nom_avec_tiret_et_souligne", { ...FRONTEND, name: "Front_end-2" }],
  ])(
    "test_ac_008_2_le_fichier_genere_est_conforme_au_format_documente_%s",
    (_cas, agent: AgentAExporter) => {
      const [fichier] = exporter(agent);

      expect(fichier).toBeDefined();
      expect(ecartsAuFormat(fichier as FichierExporte, agent.role)).toEqual([]);
    },
  );

  test("test_ac_008_2_la_description_relue_est_celle_du_modele", () => {
    const description = 'Dit "bonjour" : #x\nligne 2\\ fin';
    const [fichier] = exporter({ ...FRONTEND, description });
    const entete = (fichier?.contenu ?? "").split("\n---\n")[0]?.slice("---\n".length) ?? "";

    expect(parseDocument(entete).toJS()).toEqual({ name: "frontend", description });
  });

  test("test_ac_008_5_valider_accepte_un_modele_conforme", () => {
    expect(claudeCodeAdapter.valider({ agents: [FRONTEND] })).toEqual([]);
  });

  test.each([
    ["deux_points", "a:b"],
    ["tiret_initial", "-a"],
    ["vide", ""],
    ["barre_oblique", "a/b"],
    ["barre_oblique_inverse", "a\\b"],
  ])("test_ac_008_5_valider_refuse_un_nom_incompatible_avec_claude_code_%s", (_cas, name) => {
    expect(claudeCodeAdapter.valider({ agents: [{ ...FRONTEND, name }] })).toEqual([
      { code: "NOM_INCOMPATIBLE", detail: name },
    ]);
  });
});

describe("instructions de l'agent (ADR-001, D3 et D9.1)", () => {
  // CRLF, BOM, accents, sans fin de ligne finale : les octets sont copiés tels quels.
  const INSTRUCTIONS = Uint8Array.of(
    0xef,
    0xbb,
    0xbf,
    ...new TextEncoder().encode("# Rôle\r\n\r\nTu écris le front-end.  "),
  );

  test("test_ac_008_1_les_instructions_de_l_agent_forment_le_corps_exporte", () => {
    const [fichier] = exporter({ ...FRONTEND, instructions: INSTRUCTIONS });
    const octets = new TextEncoder().encode(fichier?.contenu ?? "");
    const entete = new TextEncoder().encode(
      `---\nname: frontend\ndescription: ${JSON.stringify(FRONTEND.description)}\n---\n`,
    );

    // Listes d'octets : sous jsdom, `TextEncoder` renvoie un `Uint8Array` d'un autre domaine.
    expect(Array.from(octets)).toEqual([...entete, ...INSTRUCTIONS]);
  });

  test("test_ac_008_1_des_instructions_vides_forment_un_corps_vide", () => {
    const [fichier] = exporter({ ...FRONTEND, instructions: new Uint8Array(0) });

    expect(fichier?.contenu.endsWith(`À utiliser pour toute tâche dans src/ui/."\n---\n`)).toBe(
      true,
    );
  });

  test("test_ac_008_5_valider_refuse_des_instructions_qui_ne_sont_pas_en_utf8", () => {
    const latin1 = Uint8Array.of(0x52, 0xf4, 0x6c, 0x65, 0x0a);

    expect(claudeCodeAdapter.valider({ agents: [{ ...FRONTEND, instructions: latin1 }] })).toEqual([
      { code: "INSTRUCTIONS_NON_UTF8", detail: "frontend" },
    ]);
  });
});
