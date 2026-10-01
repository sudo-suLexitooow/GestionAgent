import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";
import schemaCadre from "../schemas/v1/cadre.json";
import { ErreurSystemeFichiers } from "../fichiers/systeme-fichiers";
import { SystemeFichiersMemoire } from "../testing/systeme-fichiers-memoire";
import { nouveauCadre } from "./cadre-yaml";
import { enregistrerCadre } from "./enregistrer";

const RACINE = "/projets/demo";
const cadre = () => nouveauCadre({ generatorVersion: "0.1.0", outils: ["claude-code"] });

describe("enregistrer le modèle .cadre/ (US-005)", () => {
  it("test_ac_005_1_projet_sans_cadre_enregistrer_cree_cadre_yaml_conforme", async () => {
    const fs = new SystemeFichiersMemoire({ "src/index.ts": "x" });

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toEqual({ ok: true });
    const relu: unknown = parse(fs.contenu(".cadre/cadre.yaml") ?? "");
    expect(relu).toEqual({ schema_version: 1, generator_version: "0.1.0", tools: ["claude-code"] });
    const valider = new Ajv2020().compile(schemaCadre);
    expect(valider(relu)).toBe(true);
  });

  it("test_ac_005_2_projet_git_gitignore_cree_dans_la_meme_transaction", async () => {
    const fs = new SystemeFichiersMemoire({ ".git/HEAD": "ref: refs/heads/main\n" });

    await enregistrerCadre(fs, RACINE, cadre());

    expect(fs.contenu(".gitignore")).toBe(".cadre/runs/\n.cadre/backups/\n.cadre/tmp/\n");
    expect(fs.transactions).toHaveLength(1);
    expect(fs.transactions[0]?.map((f) => f.chemin)).toEqual([".cadre/cadre.yaml", ".gitignore"]);
  });

  it("test_ac_005_2_gitignore_existant_complete_sans_toucher_aux_autres_lignes", async () => {
    const fs = new SystemeFichiersMemoire({
      ".git/HEAD": "ref: refs/heads/main\n",
      ".gitignore": "node_modules\r\n.cadre/runs/\r\n",
    });

    await enregistrerCadre(fs, RACINE, cadre());

    expect(fs.contenu(".gitignore")).toBe(
      "node_modules\r\n.cadre/runs/\r\n.cadre/backups/\r\n.cadre/tmp/\r\n",
    );
  });

  it("test_ac_005_2_gitignore_deja_complet_n_est_pas_reecrit", async () => {
    const fs = new SystemeFichiersMemoire({
      ".git": "gitdir: ../.git/worktrees/demo\n",
      ".gitignore": ".cadre/runs/\n.cadre/backups/\n.cadre/tmp/\n",
    });

    await enregistrerCadre(fs, RACINE, cadre());

    expect(fs.transactions[0]?.map((f) => f.chemin)).toEqual([".cadre/cadre.yaml"]);
  });

  it("test_ac_005_2_projet_sans_git_aucun_gitignore_cree", async () => {
    const fs = new SystemeFichiersMemoire();

    await enregistrerCadre(fs, RACINE, cadre());

    expect(fs.contenu(".gitignore")).toBeUndefined();
    expect(fs.transactions[0]?.map((f) => f.chemin)).toEqual([".cadre/cadre.yaml"]);
  });

  it("test_ac_005_2_projet_dans_un_sous_dossier_d_un_depot_git_gitignore_a_la_racine_du_projet", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.depotGitDansUnAncetre = true;

    await enregistrerCadre(fs, RACINE, cadre());

    expect(fs.contenu(".gitignore")).toBe(".cadre/runs/\n.cadre/backups/\n.cadre/tmp/\n");
  });

  it("test_ac_005_6_lecture_seule_message_clair_et_fichiers_inchanges", async () => {
    const avant = {
      ".git/HEAD": "ref: refs/heads/main\n",
      ".gitignore": "dist\n",
      ".cadre/cadre.yaml": "schema_version: 1\ngenerator_version: 0.0.1\ntools: []\n",
    };
    const fs = new SystemeFichiersMemoire(avant);
    fs.echouerProchaineEcriture("LECTURE_SEULE");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toEqual({
      ok: false,
      erreur: {
        code: "LECTURE_SEULE",
        detail: "écriture simulée",
      },
    });
    expect(fs.instantane()).toEqual(avant);
  });

  it("test_ac_077_2_le_coeur_renvoie_un_code_et_un_detail_sans_libelle", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.echouerProchaineEcriture("DISQUE_PLEIN");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "DISQUE_PLEIN", detail: "écriture simulée" },
    });
  });

  it("test_ac_005_6_disque_plein_message_clair", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.echouerProchaineEcriture("DISQUE_PLEIN");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toMatchObject({
      ok: false,
      erreur: {
        code: "DISQUE_PLEIN",
        detail: "écriture simulée",
      },
    });
    expect(fs.instantane()).toEqual({});
  });

  it("test_ac_005_6_chaque_code_d_erreur_a_un_message_utilisateur", async () => {
    for (const code of ["LECTURE_SEULE", "DISQUE_PLEIN", "CHEMIN_INVALIDE", "ECHEC"] as const) {
      const fs = new SystemeFichiersMemoire();
      fs.echouerProchaineEcriture(code);

      const resultat = await enregistrerCadre(fs, RACINE, cadre());

      expect(resultat.ok).toBe(false);
      if (!resultat.ok) {
        expect(resultat.erreur.code).toBe(code);
        // Libellés : `src/ui/i18n/erreurs-enregistrement.test.ts` (US-077).
        expect(resultat.erreur.detail).toBe("écriture simulée");
      }
    }
  });

  it("test_securite_gitignore_en_lien_n_est_ni_lu_ni_recopie", async () => {
    const fs = new SystemeFichiersMemoire({ ".git/HEAD": "x" });
    // Le système refuse de lire un `.gitignore` qui est un lien (ou une jonction).
    fs.echouerProchaineLecture("CHEMIN_INVALIDE");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toMatchObject({ ok: false, erreur: { code: "CHEMIN_INVALIDE" } });
    if (!resultat.ok) expect(resultat.erreur.detail).toBe("lecture simulée de .gitignore");
    expect(fs.transactions).toEqual([]);
  });

  it("test_ac_005_6_echec_de_lecture_du_gitignore_message_clair_rien_ecrit", async () => {
    const fs = new SystemeFichiersMemoire({ ".git/HEAD": "x" });
    fs.echouerProchaineLecture("LECTURE_SEULE");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toMatchObject({ ok: false, erreur: { code: "LECTURE_SEULE" } });
    expect(fs.transactions).toEqual([]);
  });

  it("test_ac_005_6_erreur_inattendue_message_generique", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.ecrireTransaction = () => Promise.reject(new Error("panne IPC"));

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toEqual({
      ok: false,
      erreur: {
        code: "ECHEC",
        detail: "panne IPC",
      },
    });
  });

  it("test_ac_005_6_projet_occupe_par_une_autre_fenetre_message_clair", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.echouerProchaineEcriture("PROJET_OCCUPE");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toMatchObject({
      ok: false,
      erreur: {
        code: "PROJET_OCCUPE",
        detail: "écriture simulée",
      },
    });
  });

  it("test_ac_005_6_annulation_incomplete_message_honnete", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.echouerProchaineEcriture("ANNULATION_INCOMPLETE");

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toMatchObject({
      ok: false,
      erreur: {
        code: "ANNULATION_INCOMPLETE",
        detail: "écriture simulée",
      },
    });
  });

  it("test_ac_005_6_recuperation_impossible_indique_le_dossier_a_examiner", async () => {
    const fs = new SystemeFichiersMemoire();
    fs.ecrireTransaction = () =>
      Promise.reject(
        new ErreurSystemeFichiers(
          "RECUPERATION_IMPOSSIBLE",
          "dossier à examiner : /p/.cadre/tmp/de-cote-txn-1",
        ),
      );

    const resultat = await enregistrerCadre(fs, RACINE, cadre());

    expect(resultat).toEqual({
      ok: false,
      erreur: {
        code: "RECUPERATION_IMPOSSIBLE",
        detail: "dossier à examiner : /p/.cadre/tmp/de-cote-txn-1",
      },
    });
  });
});
