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
});
