import { createHash } from "node:crypto";
import { parse, stringify } from "yaml";
import type {
  AdaptateurExport,
  FichierExporte,
  ModeleAExporter,
  ProblemeExport,
} from "../adapters/adapter";
import { DisqueMemoire } from "../testing/disque-memoire";
import { exporterModele, type OptionsExport } from "./exporter";

const RACINE = "/home/lea/projet";
const CADRE = "schema_version: 1\ngenerator_version: 0.1.0\ntools: [factice]\n";
const ID_A = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const ID_B = "0b5d8f8e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const ID_C = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

function agentYaml(champs: Record<string, unknown>): string {
  return stringify(champs);
}

/** Modèle avec deux agents pour l'outil `factice` et un pour un autre outil. */
function modele(contenu: Record<string, string | Uint8Array> = {}): DisqueMemoire {
  return new DisqueMemoire(RACINE, {
    ".cadre/cadre.yaml": CADRE,
    ".cadre/agents/alpha.yaml": agentYaml({
      id: ID_A,
      name: "alpha",
      role: "Rôle A\nsur deux lignes\n",
      description: "Agent A",
      target: "factice",
    }),
    ".cadre/agents/beta.yaml": agentYaml({ id: ID_B, name: "beta", target: "factice" }),
    ".cadre/agents/gamma.yaml": agentYaml({
      id: ID_C,
      name: "gamma",
      role: "R",
      target: "autre-outil",
    }),
    ...contenu,
  });
}

/** Adaptateur factice : note les appels et produit `.factice/<nom>.txt` = rôle. */
class AdaptateurFactice implements AdaptateurExport {
  readonly id = "factice";
  readonly appels: { methode: "valider" | "exporter"; modele: ModeleAExporter }[] = [];
  problemes: ProblemeExport[] = [];

  valider(modele: ModeleAExporter): ProblemeExport[] {
    this.appels.push({ methode: "valider", modele });
    return this.problemes;
  }

  exporter(modele: ModeleAExporter): FichierExporte[] {
    this.appels.push({ methode: "exporter", modele });
    return modele.agents.map((agent) => ({
      chemin: `.factice/${agent.name}.txt`,
      contenu: `rôle : ${agent.role}`,
      source: `agent:${agent.id}`,
    }));
  }
}

function exporter(disque: DisqueMemoire, adaptateur: AdaptateurExport, options?: OptionsExport) {
  return exporterModele({ fichiers: disque, systeme: disque }, RACINE, adaptateur, options);
}

/** SHA-256 de référence (Node), après CRLF → LF (ADR-001, D5). */
function sha256(texte: string): string {
  return createHash("sha256").update(texte.replaceAll("\r\n", "\n")).digest("hex");
}

function texte(disque: DisqueMemoire, chemin: string): string | undefined {
  const octets = disque.octets(chemin);
  return octets === undefined ? undefined : new TextDecoder().decode(octets);
}

/** Tous les fichiers du faux disque, octets compris : rien n'a été écrit s'il est inchangé. */
function etat(disque: DisqueMemoire): Record<string, string | undefined> {
  return Object.fromEntries(disque.chemins().map((chemin) => [chemin, texte(disque, chemin)]));
}

describe("le cœur exporte par le port d'adaptateur (AC-008-5)", () => {
  test("test_ac_008_5_le_coeur_appelle_valider_puis_exporter_avec_les_agents_de_l_outil", async () => {
    const adaptateur = new AdaptateurFactice();

    const resultat = await exporter(modele(), adaptateur);

    expect(resultat).toEqual({ ok: true, fichiers: [".factice/alpha.txt", ".factice/beta.txt"] });
    const agents = [
      { id: ID_A, name: "alpha", role: "Rôle A\nsur deux lignes\n", description: "Agent A" },
      { id: ID_B, name: "beta", role: "", description: "" },
    ];
    expect(adaptateur.appels).toEqual([
      { methode: "valider", modele: { agents } },
      { methode: "exporter", modele: { agents } },
    ]);
  });

  test("test_ac_008_5_un_modele_refuse_par_valider_n_est_pas_exporte", async () => {
    const disque = modele();
    const avant = etat(disque);
    const adaptateur = new AdaptateurFactice();
    adaptateur.problemes = [
      { code: "NOM_INCOMPATIBLE", detail: "alpha" },
      { code: "AUTRE", detail: "beta" },
    ];

    const resultat = await exporter(disque, adaptateur);

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "MODELE_INVALIDE", detail: "NOM_INCOMPATIBLE : alpha ; AUTRE : beta" },
    });
    expect(adaptateur.appels.map((appel) => appel.methode)).toEqual(["valider"]);
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_5_un_agent_en_erreur_dans_le_modele_n_est_pas_exporte", async () => {
    const disque = modele({ ".cadre/agents/casse.yaml": "id: 1\nname: casse\n  target: x\n" });
    const adaptateur = new AdaptateurFactice();

    const resultat = await exporter(disque, adaptateur);

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "MODELE_INVALIDE", detail: ".cadre/agents/casse.yaml" },
    });
    expect(adaptateur.appels).toEqual([]);
    expect(disque.transactions).toEqual([]);
  });

  test.each([
    ["sans_modele", { "README.md": "# P\n" }],
    ["modele_incomplet", { ".cadre/agents/a.yaml": "id: x\n" }],
    [
      "modele_en_lecture_seule",
      { ".cadre/cadre.yaml": "schema_version: 2\ngenerator_version: 9.0.0\ntools: [factice]\n" },
    ],
  ])("test_ac_008_5_%s_rien_n_est_exporte", async (_cas, contenu) => {
    const disque = new DisqueMemoire(RACINE, contenu);
    const adaptateur = new AdaptateurFactice();

    const resultat = await exporter(disque, adaptateur);

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "MODELE_NON_MODIFIABLE", detail: ".cadre/cadre.yaml" },
    });
    expect(adaptateur.appels).toEqual([]);
    expect(disque.transactions).toEqual([]);
  });
});

describe("écriture des fichiers exportés et du manifeste (AC-008-1, ADR-001 D5)", () => {
  test("test_ac_008_1_les_fichiers_exportes_et_generated_yaml_sont_ecrits_en_une_transaction", async () => {
    const disque = modele();

    await exporter(disque, new AdaptateurFactice());

    expect(disque.transactions.map((lot) => lot.map((fichier) => fichier.chemin))).toEqual([
      [".factice/alpha.txt", ".factice/beta.txt", ".cadre/generated.yaml"],
    ]);
    expect(texte(disque, ".factice/alpha.txt")).toBe("rôle : Rôle A\nsur deux lignes\n");
    expect(parse(texte(disque, ".cadre/generated.yaml") ?? "")).toEqual({
      files: [
        {
          path: ".factice/alpha.txt",
          adapter: "factice",
          source: `agent:${ID_A}`,
          sha256: sha256("rôle : Rôle A\nsur deux lignes\n"),
        },
        {
          path: ".factice/beta.txt",
          adapter: "factice",
          source: `agent:${ID_B}`,
          sha256: sha256("rôle : "),
        },
      ],
    });
  });

  test("test_ac_008_1_generated_yaml_existant_garde_ses_entrees_et_met_a_jour_celles_exportees", async () => {
    const claude = { path: "CLAUDE.md", adapter: "autre", source: "contexts", sha256: "ab" };
    const ancien = "rôle : ancien";
    const disque = modele({
      ".factice/alpha.txt": ancien,
      ".cadre/generated.yaml": stringify({
        files: [
          claude,
          { path: ".factice/alpha.txt", adapter: "factice", source: "x", sha256: sha256(ancien) },
        ],
      }),
    });

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat.ok).toBe(true);
    expect(parse(texte(disque, ".cadre/generated.yaml") ?? "")).toEqual({
      files: [
        claude,
        {
          path: ".factice/alpha.txt",
          adapter: "factice",
          source: `agent:${ID_A}`,
          sha256: sha256("rôle : Rôle A\nsur deux lignes\n"),
        },
        {
          path: ".factice/beta.txt",
          adapter: "factice",
          source: `agent:${ID_B}`,
          sha256: sha256("rôle : "),
        },
      ],
    });
  });

  test.each([
    ["yaml_casse", "files: [\n"],
    ["files_pas_une_liste", "files: 3\n"],
    ["entree_sans_chemin", "files:\n  - adapter: x\n"],
    ["pas_un_objet", "- a\n"],
  ])(
    "test_ac_008_1_generated_yaml_invalide_refuse_sans_rien_ecrire_%s",
    async (_cas, manifeste) => {
      const disque = modele({ ".cadre/generated.yaml": manifeste });
      const avant = etat(disque);

      const resultat = await exporter(disque, new AdaptateurFactice());

      expect(resultat).toEqual({
        ok: false,
        erreur: { code: "MANIFESTE_INVALIDE", detail: ".cadre/generated.yaml" },
      });
      expect(disque.transactions).toEqual([]);
      expect(etat(disque)).toEqual(avant);
    },
  );
});

describe("tout ou rien (AC-008-3)", () => {
  test("test_ac_008_3_une_erreur_d_ecriture_ne_modifie_aucun_fichier_et_renvoie_l_erreur", async () => {
    const ancien = "rôle : ancien";
    const disque = modele({
      ".factice/alpha.txt": ancien,
      ".cadre/generated.yaml": stringify({
        files: [
          { path: ".factice/alpha.txt", adapter: "factice", source: "x", sha256: sha256(ancien) },
        ],
      }),
    }).echouerProchaineEcriture("DISQUE_PLEIN");
    const avant = etat(disque);

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "DISQUE_PLEIN", detail: "écriture simulée" },
    });
    expect(disque.transactions).toHaveLength(1);
    expect(disque.transactions[0]?.map((fichier) => fichier.chemin)).toEqual([
      ".factice/alpha.txt",
      ".factice/beta.txt",
      ".cadre/generated.yaml",
    ]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_3_une_exception_de_l_adaptateur_devient_une_erreur_sans_rien_ecrire", async () => {
    const disque = modele();
    const adaptateur = new AdaptateurFactice();
    adaptateur.exporter = () => {
      throw new Error("panne de l'adaptateur");
    };

    const resultat = await exporter(disque, adaptateur);

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "ECHEC", detail: "panne de l'adaptateur" },
    });
    expect(disque.transactions).toEqual([]);
  });
});

describe("aucun écrasement sans confirmation (AC-008-4, ADR-001 D5)", () => {
  const ALPHA = ".factice/alpha.txt";
  const NOUVEAU_ALPHA = "rôle : Rôle A\nsur deux lignes\n";

  function manifeste(contenuAlpha: string): string {
    return stringify({
      files: [{ path: ALPHA, adapter: "factice", source: "x", sha256: sha256(contenuAlpha) }],
    });
  }

  test("test_ac_008_4_fichier_existant_hors_manifeste_refuse_sans_rien_ecrire", async () => {
    const disque = modele({ [ALPHA]: "écrit à la main" });
    const avant = etat(disque);

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "ECRASEMENT_A_CONFIRMER", detail: ALPHA },
      aConfirmer: [ALPHA],
    });
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_fichier_genere_puis_modifie_par_l_utilisateur_refuse_sans_rien_ecrire", async () => {
    const disque = modele({
      [ALPHA]: "rôle : retouché par l'utilisateur",
      ".cadre/generated.yaml": manifeste("rôle : ancien"),
    });
    const avant = etat(disque);

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat).toMatchObject({ ok: false, aConfirmer: [ALPHA] });
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_plusieurs_fichiers_a_confirmer_sont_tous_nommes", async () => {
    const disque = modele({ [ALPHA]: "a", ".factice/beta.txt": "b" });

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "ECRASEMENT_A_CONFIRMER", detail: `${ALPHA}, .factice/beta.txt` },
      aConfirmer: [ALPHA, ".factice/beta.txt"],
    });
  });

  test("test_ac_008_4_fichier_genere_intact_reecrit_sans_confirmation", async () => {
    const disque = modele({
      [ALPHA]: "rôle : ancien",
      ".cadre/generated.yaml": manifeste("rôle : ancien"),
    });

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat.ok).toBe(true);
    expect(texte(disque, ALPHA)).toBe(NOUVEAU_ALPHA);
  });

  test("test_ac_008_4_fin_de_ligne_crlf_n_est_pas_une_modification_de_l_utilisateur", async () => {
    const disque = modele({
      [ALPHA]: "rôle : ancien\r\nligne 2\r\n",
      ".cadre/generated.yaml": manifeste("rôle : ancien\nligne 2\n"),
    });

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat.ok).toBe(true);
    expect(texte(disque, ALPHA)).toBe(NOUVEAU_ALPHA);
  });

  test("test_ac_008_4_confirmation_explicite_ecrase_le_fichier_et_l_inscrit_au_manifeste", async () => {
    const disque = modele({ [ALPHA]: "écrit à la main" });

    const resultat = await exporter(disque, new AdaptateurFactice(), { confirmes: [ALPHA] });

    expect(resultat).toEqual({ ok: true, fichiers: [ALPHA, ".factice/beta.txt"] });
    expect(texte(disque, ALPHA)).toBe(NOUVEAU_ALPHA);
    expect(parse(texte(disque, ".cadre/generated.yaml") ?? "")).toMatchObject({
      files: [{ path: ALPHA, sha256: sha256(NOUVEAU_ALPHA) }, { path: ".factice/beta.txt" }],
    });
  });

  test("test_ac_008_4_la_confirmation_d_un_autre_fichier_ne_vaut_pas_pour_celui_ci", async () => {
    const disque = modele({ [ALPHA]: "a", ".factice/beta.txt": "b" });
    const avant = etat(disque);

    const resultat = await exporter(disque, new AdaptateurFactice(), {
      confirmes: [".factice/beta.txt"],
    });

    expect(resultat).toMatchObject({ ok: false, aConfirmer: [ALPHA] });
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test.each([
    ["dossier_parent_en_lien", ".factice", "FICHIER_LIEN"],
    ["fichier_en_lien", ALPHA, "FICHIER_LIEN"],
  ])("test_ac_008_4_%s_refuse_sans_rien_ecrire", async (_cas, lien, code) => {
    const disque = modele();
    disque.addLink(lien);
    const avant = etat(disque);

    const resultat = await exporter(disque, new AdaptateurFactice(), { confirmes: [ALPHA] });

    expect(resultat).toEqual({ ok: false, erreur: { code, detail: ALPHA } });
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_fichier_existant_illisible_refuse_sans_rien_ecrire", async () => {
    const disque = modele({ [ALPHA]: "secret" }).makeUnreadable(ALPHA);

    const resultat = await exporter(disque, new AdaptateurFactice(), { confirmes: [ALPHA] });

    expect(resultat).toEqual({ ok: false, erreur: { code: "FICHIER_ILLISIBLE", detail: ALPHA } });
    expect(disque.transactions).toEqual([]);
  });

  test("test_ac_008_4_manifeste_en_lien_refuse_sans_rien_ecrire", async () => {
    const disque = modele();
    disque.addLink(".cadre/generated.yaml");

    const resultat = await exporter(disque, new AdaptateurFactice());

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "FICHIER_LIEN", detail: ".cadre/generated.yaml" },
    });
    expect(disque.transactions).toEqual([]);
  });
});
