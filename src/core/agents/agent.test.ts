import { parse } from "yaml";
import { validerAgentYaml } from "../cadre/schemas-v1";
import { creerAgent, fichiersAgent, type SaisieAgent } from "./agent";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const SAISIE: SaisieAgent = {
  nom: "frontend",
  role: "Développeur front-end React",
  description: "Implémente les écrans React.",
  cible: "claude-code",
};

const CONTEXTE = { nomsExistants: [], cibles: ["claude-code"], genererId: () => ID };

describe("création d'un agent (US-007)", () => {
  test("test_ac_007_1_cree_un_agent_avec_son_nom_son_role_sa_description_et_sa_cible", () => {
    expect(creerAgent(SAISIE, CONTEXTE)).toEqual({
      ok: true,
      agent: {
        id: ID,
        name: "frontend",
        role: "Développeur front-end React",
        description: "Implémente les écrans React.",
        target: "claude-code",
      },
      avertissements: [],
    });
  });

  test("test_ac_007_1_l_identifiant_par_defaut_est_un_uuid_v4_different_a_chaque_agent", () => {
    const contexte = { nomsExistants: [], cibles: ["claude-code"] };
    const a = creerAgent(SAISIE, contexte);
    const b = creerAgent({ ...SAISIE, nom: "backend" }, contexte);
    if (!a.ok || !b.ok) throw new Error("création refusée");
    expect(a.agent.id).toMatch(UUID_V4);
    expect(b.agent.id).toMatch(UUID_V4);
    expect(a.agent.id).not.toBe(b.agent.id);
  });

  test("test_ac_007_1_serialise_agents_nom_yaml_conforme_au_schema_v1", () => {
    const creation = creerAgent(SAISIE, CONTEXTE);
    if (!creation.ok) throw new Error("création refusée");
    const fichiers = fichiersAgent(creation.agent);
    expect(fichiers.map((f) => f.chemin)).toEqual([".cadre/agents/frontend.yaml"]);
    const texte = String(fichiers[0]?.contenu);
    const donnees: unknown = parse(texte);
    expect(donnees).toEqual(creation.agent);
    expect(validerAgentYaml(donnees)).toEqual([]);
    expect(texte).toMatch(/\n$/);
    expect(texte).not.toMatch(/\r/);
  });

  test("test_ac_007_2_refuse_une_cible_sans_adaptateur_disponible", () => {
    expect(creerAgent({ ...SAISIE, cible: "codex" }, CONTEXTE)).toEqual({
      ok: false,
      refus: "CIBLE_INDISPONIBLE",
    });
  });

  test.each(["frontend", "Frontend", "FRONTEND"])(
    "test_ac_007_3_refuse_un_nom_deja_pris_quelle_que_soit_la_casse (%s)",
    (nom) => {
      const contexte = { ...CONTEXTE, nomsExistants: ["backend", "frontend"] };
      expect(creerAgent({ ...SAISIE, nom }, contexte)).toEqual({
        ok: false,
        refus: "NOM_EXISTANT",
      });
    },
  );

  test.each([
    ["", "NOM_VIDE"],
    ["front<end", "NOM_CARACTERES_INTERDITS"],
    ["a:b", "NOM_CARACTERES_INTERDITS"],
    ['a"b', "NOM_CARACTERES_INTERDITS"],
    ["a/b", "NOM_CARACTERES_INTERDITS"],
    ["a\\b", "NOM_CARACTERES_INTERDITS"],
    ["a|b", "NOM_CARACTERES_INTERDITS"],
    ["a?b", "NOM_CARACTERES_INTERDITS"],
    ["a*b", "NOM_CARACTERES_INTERDITS"],
    ["a>b", "NOM_CARACTERES_INTERDITS"],
    ["a\u0001b", "NOM_CARACTERES_INTERDITS"],
    ["CON", "NOM_RESERVE"],
    ["con", "NOM_RESERVE"],
    ["Prn", "NOM_RESERVE"],
    ["AUX", "NOM_RESERVE"],
    ["nul", "NOM_RESERVE"],
    ["com1", "NOM_RESERVE"],
    ["COM0", "NOM_RESERVE"],
    ["lpt9", "NOM_RESERVE"],
    ["-x", "NOM_FORMAT"],
    ["x_", "NOM_FORMAT"],
    ["front end", "NOM_FORMAT"],
    ["frontend.", "NOM_FORMAT"],
    ["..", "NOM_FORMAT"],
    ["éditeur", "NOM_FORMAT"],
    ["a".repeat(65), "NOM_FORMAT"],
  ])("test_ac_007_4_refuse_le_nom_%j_avec_la_regle_violee_%s", (nom, regle) => {
    expect(creerAgent({ ...SAISIE, nom }, CONTEXTE)).toEqual({ ok: false, refus: regle });
  });

  test.each(["a", "a".repeat(64), "front_end-2", "COM10", "CONSOLE"])(
    "test_ac_007_4_accepte_le_nom_conforme_%s",
    (nom) => {
      expect(creerAgent({ ...SAISIE, nom }, CONTEXTE)).toMatchObject({ ok: true });
    },
  );

  test.each([
    ["role", { role: "" }],
    ["description", { description: "" }],
    ["les_deux", { role: "", description: "" }],
    ["blancs", { description: "  \n" }],
  ])("test_ac_007_5_cree_l_agent_avec_l_avertissement_description_manquante (%s)", (_, vide) => {
    const creation = creerAgent({ ...SAISIE, ...vide }, CONTEXTE);
    expect(creation).toMatchObject({ ok: true, avertissements: ["DESCRIPTION_MANQUANTE"] });
  });
});
