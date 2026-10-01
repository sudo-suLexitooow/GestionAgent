import { Ajv2020 } from "ajv/dist/2020.js";
import schemaAgent from "../schemas/v1/agent.json";
import schemaCadre from "../schemas/v1/cadre.json";
import { validerAgentYaml, validerCadreYaml } from "./schemas-v1";

// Référence : ajv (dépendance de développement) ; le validateur de l'app n'évalue aucun code
// (la CSP de Tauri interdit `eval`), il doit donner le même verdict sur chaque cas.
const ajv = new Ajv2020({ allErrors: true });
ajv.addSchema(schemaCadre);
const ajvAgent = ajv.compile(schemaAgent);
const ajvCadre = ajv.getSchema(schemaCadre.$id);

const AGENT_D10 = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  name: "frontend",
  role: "Développeur front-end React",
  description: "Implémente les écrans React.",
  target: "claude-code",
  skills: ["ui-design"],
  contexts: ["CONVENTIONS"],
  parameters: { framework: "react", seuil: 3, actif: true },
  presets: { autonomy: "medium", max_changed_files: 20, language: "fr", commit_style: "free" },
  tools: { terminal: true, browser: false, gpu: true },
  scope: [
    { path: "./", level: "read" },
    { path: "src/ui/", level: "write" },
    { path: "infra/", level: "deny" },
  ],
  exports: { "claude-code": { frontmatter: { model: "sonnet", color: "blue" } } },
};

const CADRE_D10 = {
  schema_version: 1,
  generator_version: "0.1.0",
  tools: ["claude-code"],
  couleur: "bleu",
  contexts: [
    { name: "CLAUDE", title: "CLAUDE.md", type: "projet", source: "CLAUDE.md" },
    { name: "AGENTS", type: "autre", scope: "agents", readonly: true },
  ],
};

const sans = (objet: Record<string, unknown>, cle: string) =>
  Object.fromEntries(Object.entries(objet).filter(([k]) => k !== cle));

/** Cas D11 (ADR-001) relevant du schéma, plus des cas limites des mots-clés utilisés. */
const CAS_AGENT: [string, unknown][] = [
  ["valide_d10", AGENT_D10],
  ["valide_minimal", { id: AGENT_D10.id, name: "a", target: "claude-code" }],
  ["racine_liste", [AGENT_D10]],
  ["racine_nulle", null],
  ["sans_id", sans(AGENT_D10, "id")],
  ["id_nombre", { ...AGENT_D10, id: 42 }],
  ["id_non_uuid_v4", { ...AGENT_D10, id: "7c9e6679-7425-30de-944b-e07fc1f90ae7" }],
  ["sans_target", sans(AGENT_D10, "target")],
  ["target_majuscule", { ...AGENT_D10, target: "Claude" }],
  ["nom_deux_points", { ...AGENT_D10, name: "a:b" }],
  ["nom_tiret_initial", { ...AGENT_D10, name: "-x" }],
  ["nom_vide", { ...AGENT_D10, name: "" }],
  ["nom_65_caracteres", { ...AGENT_D10, name: "a".repeat(65) }],
  ["nom_64_caracteres", { ...AGENT_D10, name: "a".repeat(64) }],
  ["role_nombre", { ...AGENT_D10, role: 3 }],
  ["skills_en_double", { ...AGENT_D10, skills: ["a", "a"] }],
  ["skill_vide", { ...AGENT_D10, skills: [""] }],
  ["skills_pas_une_liste", { ...AGENT_D10, skills: "a" }],
  ["contexte_invalide", { ...AGENT_D10, contexts: ["a b"] }],
  ["scope_parent", { ...AGENT_D10, scope: [{ path: "../autre", level: "read" }] }],
  ["scope_absolu", { ...AGENT_D10, scope: [{ path: "/etc/", level: "read" }] }],
  ["scope_antislash", { ...AGENT_D10, scope: [{ path: "src\\api", level: "read" }] }],
  ["scope_double_barre", { ...AGENT_D10, scope: [{ path: "src//api", level: "read" }] }],
  ["scope_cle_inconnue", { ...AGENT_D10, scope: [{ path: "src/", level: "read", x: 1 }] }],
  ["scope_sans_niveau", { ...AGENT_D10, scope: [{ path: "src/" }] }],
  ["scope_niveau_inconnu", { ...AGENT_D10, scope: [{ path: "src/", level: "all" }] }],
  ["outil_texte", { ...AGENT_D10, tools: { terminal: "oui" } }],
  ["preset_enum", { ...AGENT_D10, presets: { autonomy: "max" } }],
  ["preset_minimum", { ...AGENT_D10, presets: { max_changed_files: 0 } }],
  ["preset_entier", { ...AGENT_D10, presets: { max_changed_files: 1.5 } }],
  ["parametre_cle_vide", { ...AGENT_D10, parameters: { "": "x" } }],
  ["parametre_liste", { ...AGENT_D10, parameters: { a: ["x"] } }],
  ["parametre_objet", { ...AGENT_D10, parameters: { a: { b: 1 } } }],
  ["parametre_nul", { ...AGENT_D10, parameters: { a: null } }],
  ["export_pas_un_objet", { ...AGENT_D10, exports: { "claude-code": "x" } }],
  ["frontmatter_liste", { ...AGENT_D10, exports: { "claude-code": { frontmatter: [] } } }],
];

const CAS_CADRE: [string, unknown][] = [
  ["valide_d10", CADRE_D10],
  ["sans_schema_version", sans(CADRE_D10, "schema_version")],
  ["schema_version_texte", { ...CADRE_D10, schema_version: "1" }],
  ["schema_version_zero", { ...CADRE_D10, schema_version: 0 }],
  ["generator_version_non_semver", { ...CADRE_D10, generator_version: "1.0" }],
  ["generator_version_prerelease", { ...CADRE_D10, generator_version: "1.2.3-beta.1+b5" }],
  ["outils_en_double", { ...CADRE_D10, tools: ["claude-code", "claude-code"] }],
  ["nom_vide", { ...CADRE_D10, name: "" }],
  ["contexte_sans_nom", { ...CADRE_D10, contexts: [{ title: "x" }] }],
  ["contexte_type_inconnu", { ...CADRE_D10, contexts: [{ name: "A", type: "x" }] }],
  ["contexte_readonly_texte", { ...CADRE_D10, contexts: [{ name: "A", readonly: "oui" }] }],
  ["racine_texte", "x"],
];

describe("validation des YAML de .cadre/ contre le schéma v1 (AC-006-3)", () => {
  test.each(CAS_AGENT)("test_ac_006_3_agent_meme_verdict_que_la_reference_%s", (_cas, donnees) => {
    expect(validerAgentYaml(donnees).length === 0).toBe(ajvAgent(donnees));
  });

  test.each(CAS_CADRE)("test_ac_006_3_cadre_meme_verdict_que_la_reference_%s", (_cas, donnees) => {
    expect(validerCadreYaml(donnees).length === 0).toBe(ajvCadre?.(donnees));
  });

  test("test_ac_006_3_l_erreur_designe_le_champ_fautif", () => {
    expect(validerAgentYaml({ ...AGENT_D10, presets: { autonomy: "max" } })).toEqual([
      { chemin: ["presets", "autonomy"], regle: "enum" },
    ]);
    expect(validerAgentYaml({ ...AGENT_D10, scope: [AGENT_D10.scope[0], { path: "/" }] })).toEqual([
      { chemin: ["scope", 1], regle: "required" },
      { chemin: ["scope", 1, "path"], regle: "pattern" },
    ]);
    expect(validerCadreYaml(sans(CADRE_D10, "tools"))).toEqual([{ chemin: [], regle: "required" }]);
  });
});
