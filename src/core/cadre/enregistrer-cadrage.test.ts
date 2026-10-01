import { parse } from "yaml";
import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { creerAgent, type AgentNouveau, type SaisieAgent } from "../agents/agent";
import { importContexts } from "../contexts/import-contexts";
import { DisqueMemoire } from "../testing/disque-memoire";
import { chargerModele } from "./charger-modele";
import { enregistrerCadrage } from "./enregistrer-cadrage";
import { validerCadreYaml } from "./schemas-v1";

const RACINE = "/home/lea/projet";
const OPTIONS = { adapter: claudeCodeAdapter, generatorVersion: "1.2.3" };

const CADRE =
  "# réglé à la main\nschema_version: 1\ngenerator_version: 0.1.0\ntools: [claude-code]\n";
const AUTRE = {
  id: "0f8fad5b-d9cb-469f-a165-70867728950e",
  name: "backend",
  target: "claude-code",
};

function agent(saisie: Partial<SaisieAgent> = {}, cible = "claude-code"): AgentNouveau {
  const creation = creerAgent(
    { nom: "frontend", role: "Front", description: "Écrans React.", cible, ...saisie },
    { nomsExistants: [], cibles: [cible] },
  );
  if (!creation.ok) throw new Error(creation.refus);
  return creation.agent;
}

function texte(disque: DisqueMemoire, chemin: string): string {
  return new TextDecoder().decode(disque.octets(chemin));
}

function enregistrer(disque: DisqueMemoire, agents: AgentNouveau[], contextes = []) {
  return enregistrerCadrage(
    { fichiers: disque, systeme: disque },
    RACINE,
    { contextes, agents },
    OPTIONS,
  );
}

describe("enregistrement d'un agent créé (US-007)", () => {
  test("test_ac_007_1_projet_sans_modele_ecrit_cadre_yaml_et_l_agent_en_une_transaction", async () => {
    const disque = new DisqueMemoire(RACINE, {});
    const frontend = agent();

    expect(await enregistrer(disque, [frontend])).toEqual({ ok: true });

    expect(disque.transactions).toHaveLength(1);
    expect(disque.transactions[0]?.map((f) => f.chemin)).toEqual([
      ".cadre/cadre.yaml",
      ".cadre/agents/frontend.yaml",
      ".cadre/generated.yaml",
    ]);
    const cadre: unknown = parse(texte(disque, ".cadre/cadre.yaml"));
    expect(validerCadreYaml(cadre)).toEqual([]);
    expect(cadre).toMatchObject({ tools: ["claude-code"] });
    expect(parse(texte(disque, ".cadre/agents/frontend.yaml"))).toEqual(frontend);
  });

  test("test_ac_007_1_contextes_importes_et_agent_dans_la_meme_transaction", async () => {
    const disque = new DisqueMemoire(RACINE, { "CLAUDE.md": "# Projet\n" });
    const { contexts } = await importContexts(disque, RACINE, [
      { file: "CLAUDE.md", name: "CLAUDE", type: "projet" },
    ]);

    const resultat = await enregistrerCadrage(
      { fichiers: disque, systeme: disque },
      RACINE,
      { contextes: contexts, agents: [agent()] },
      OPTIONS,
    );

    expect(resultat).toEqual({ ok: true });
    expect(disque.transactions[0]?.map((f) => f.chemin)).toEqual([
      ".cadre/cadre.yaml",
      ".cadre/contexte/CLAUDE.md",
      ".cadre/agents/frontend.yaml",
      ".cadre/generated.yaml",
    ]);
  });

  test("test_ac_007_1_modele_existant_ecrit_seulement_l_agent_sans_reecrire_cadre_yaml", async () => {
    const disque = new DisqueMemoire(RACINE, { ".cadre/cadre.yaml": CADRE });

    expect(await enregistrer(disque, [agent()])).toEqual({ ok: true });

    expect(disque.transactions[0]?.map((f) => f.chemin)).toEqual([".cadre/agents/frontend.yaml"]);
    expect(texte(disque, ".cadre/cadre.yaml")).toBe(CADRE);
  });

  test("test_ac_007_1_modele_existant_sans_l_outil_cible_l_ajoute_a_cadre_yaml", async () => {
    const disque = new DisqueMemoire(RACINE, {
      ".cadre/cadre.yaml": "schema_version: 1\ngenerator_version: 0.1.0\nname: Projet\ntools: []\n",
    });

    expect(await enregistrer(disque, [agent()])).toEqual({ ok: true });

    expect(disque.transactions[0]?.map((f) => f.chemin)).toEqual([
      ".cadre/cadre.yaml",
      ".cadre/agents/frontend.yaml",
    ]);
    expect(parse(texte(disque, ".cadre/cadre.yaml"))).toEqual({
      schema_version: 1,
      generator_version: "0.1.0",
      name: "Projet",
      tools: ["claude-code"],
    });
  });

  test.each([
    ["lecture_seule", "schema_version: 2\ngenerator_version: 9.0.0\ntools: [claude-code]\n"],
    ["incomplet", "schema_version: 1\ntools: [claude-code]\n"],
  ])("test_ac_007_1_modele_%s_refuse_sans_rien_ecrire", async (_, cadre) => {
    const disque = new DisqueMemoire(RACINE, { ".cadre/cadre.yaml": cadre });

    expect(await enregistrer(disque, [agent()])).toEqual({
      ok: false,
      erreur: { code: "MODELE_NON_MODIFIABLE", detail: ".cadre/cadre.yaml" },
    });
    expect(disque.transactions).toEqual([]);
  });

  test("test_ac_007_3_agent_du_meme_nom_apparu_depuis_la_creation_refuse_sans_rien_ecrire", async () => {
    const disque = new DisqueMemoire(RACINE, { ".cadre/cadre.yaml": CADRE });
    const frontend = agent();
    disque.modifierHorsCadre(".cadre/agents/Frontend.yaml", "name: Frontend\n");

    expect(await enregistrer(disque, [frontend])).toEqual({
      ok: false,
      erreur: { code: "AGENT_EXISTANT", detail: "frontend" },
    });
    expect(disque.transactions).toEqual([]);
  });

  test("test_ac_007_1_aller_retour_creer_enregistrer_rouvrir_l_agent_est_identique", async () => {
    const disque = new DisqueMemoire(RACINE, {});
    const frontend = agent({ role: "", description: "Rôle « spécial » : #1\nsur deux lignes" });

    await enregistrer(disque, [frontend]);
    await enregistrer(disque, [agent({ nom: "backend" })]);
    const rouvert = await chargerModele(disque, RACINE);

    expect(rouvert.etat).toBe("charge");
    if (rouvert.etat !== "charge") return;
    expect(rouvert.modele.agents.map((a) => a.fichier)).toEqual([
      ".cadre/agents/backend.yaml",
      ".cadre/agents/frontend.yaml",
    ]);
    expect(rouvert.modele.agents[1]).toEqual({
      fichier: ".cadre/agents/frontend.yaml",
      statut: "ok",
      donnees: frontend,
      instructions: null,
    });
  });

  test("test_ac_007_1_un_agent_existant_d_un_autre_nom_ne_bloque_pas", async () => {
    const disque = new DisqueMemoire(RACINE, {
      ".cadre/cadre.yaml": CADRE,
      ".cadre/agents/backend.yaml": `id: ${AUTRE.id}\nname: backend\ntarget: claude-code\n`,
    });

    expect(await enregistrer(disque, [agent()])).toEqual({ ok: true });
  });
});
