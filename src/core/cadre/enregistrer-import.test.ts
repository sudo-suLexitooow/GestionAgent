import { createHash } from "node:crypto";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";
import { claudeCodeAdapter } from "../adapters/claude-code/claude-code-adapter";
import { importContexts } from "../contexts/import-contexts";
import { CODES_ERREUR_FICHIERS } from "../fichiers/systeme-fichiers";
import schemaCadre from "../schemas/v1/cadre.json";
import { DisqueMemoire } from "../testing/disque-memoire";
import { chargerModele } from "./charger-modele";
import { enregistrerContextesImportes } from "./enregistrer-import";

const RACINE = "/home/lea/projet";
const VERSION = "1.2.3";
const CLAUDE_SPEC = { file: "CLAUDE.md", name: "CLAUDE", type: "projet" } as const;
const AGENTS_SPEC = { file: "AGENTS.md", name: "AGENTS", type: "autre", readonly: true } as const;

const texte = (s: string) => new TextEncoder().encode(s);
// BOM, CRLF, espaces finaux, sans fin de ligne finale.
const CLAUDE = Uint8Array.of(0xef, 0xbb, 0xbf, ...texte("# Projet\r\n\r\nRègles  \r\n  "));
// Latin-1 (0xE9) : pas de l'UTF-8, importé tel quel (AC-003-4).
const AGENTS = Uint8Array.of(0x23, 0x20, 0xe9, 0x0a);

/** SHA-256 de référence (Node), après CRLF → LF (ADR-001, D5). */
function sha256SansCrlf(octets: Uint8Array): string {
  const lf = Buffer.from(Buffer.from(octets).toString("latin1").replaceAll("\r\n", "\n"), "latin1");
  return createHash("sha256").update(lf).digest("hex");
}

/** Projet Git avec CLAUDE.md et AGENTS.md, et ses contextes importés en mémoire (US-003). */
async function projetImporte(contenu: Record<string, string | Uint8Array> = {}) {
  const disque = new DisqueMemoire(RACINE, {
    ".git/HEAD": "ref: refs/heads/main\n",
    "CLAUDE.md": CLAUDE,
    "AGENTS.md": AGENTS,
    ...contenu,
  });
  const { contexts } = await importContexts(disque, RACINE, [CLAUDE_SPEC, AGENTS_SPEC]);
  const enregistrer = () =>
    enregistrerContextesImportes({ fichiers: disque, systeme: disque }, RACINE, contexts, {
      adapter: claudeCodeAdapter,
      generatorVersion: VERSION,
    });
  return { disque, contexts, enregistrer };
}

function yaml(disque: DisqueMemoire, chemin: string): unknown {
  return parse(new TextDecoder().decode(disque.octets(chemin)));
}

describe("enregistrer les contextes importés (AC-077-1)", () => {
  test("test_ac_077_1_une_seule_transaction_ecrit_cadre_yaml_contextes_manifeste_et_gitignore", async () => {
    const { disque, enregistrer } = await projetImporte();

    expect(await enregistrer()).toEqual({ ok: true });

    expect(disque.transactions).toHaveLength(1);
    expect(disque.transactions[0]?.map((fichier) => fichier.chemin)).toEqual([
      ".cadre/cadre.yaml",
      ".cadre/contexte/CLAUDE.md",
      ".cadre/contexte/AGENTS.md",
      ".cadre/generated.yaml",
      ".gitignore",
    ]);
  });

  test("test_ac_077_1_cadre_yaml_conforme_avec_la_liste_contexts", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    const cadre = yaml(disque, ".cadre/cadre.yaml");
    expect(cadre).toEqual({
      schema_version: 1,
      generator_version: VERSION,
      tools: ["claude-code"],
      contexts: [
        { name: "CLAUDE", title: "CLAUDE.md", type: "projet", source: "CLAUDE.md" },
        { name: "AGENTS", title: "AGENTS.md", type: "autre", source: "AGENTS.md", readonly: true },
      ],
    });
    expect(new Ajv2020().compile(schemaCadre)(cadre)).toBe(true);
  });

  test("test_ac_077_1_contextes_ecrits_a_l_octet_pres", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    expect(disque.octets(".cadre/contexte/CLAUDE.md")).toEqual(CLAUDE);
    expect(disque.octets(".cadre/contexte/AGENTS.md")).toEqual(AGENTS);
  });

  test("test_ac_077_1_generated_yaml_adopte_les_fichiers_importes_avec_leur_empreinte", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    expect(yaml(disque, ".cadre/generated.yaml")).toEqual({
      files: [
        {
          path: "CLAUDE.md",
          adapter: "claude-code",
          source: "contexts",
          sha256: sha256SansCrlf(CLAUDE),
        },
        {
          path: "AGENTS.md",
          adapter: "generic",
          source: "contexts",
          sha256: sha256SansCrlf(AGENTS),
        },
      ],
    });
  });

  test("test_ac_077_1_les_fichiers_d_origine_ne_sont_pas_modifies", async () => {
    const { disque, enregistrer } = await projetImporte();

    await enregistrer();

    expect(disque.octets("CLAUDE.md")).toEqual(CLAUDE);
    expect(disque.octets("AGENTS.md")).toEqual(AGENTS);
    expect(disque.transactions[0]?.map((f) => f.chemin)).not.toContain("CLAUDE.md");
  });

  test("test_ac_077_1_rouvrir_le_projet_recharge_exactement_ce_qui_a_ete_enregistre", async () => {
    const { disque, contexts, enregistrer } = await projetImporte();

    await enregistrer();
    const charge = await chargerModele(disque, RACINE);

    expect(charge.etat).toBe("charge");
    if (charge.etat !== "charge") return;
    expect(charge.lectureSeule).toBe(false);
    expect(charge.modele.contextes).toEqual(
      contexts.map(({ entry, content }) => ({ entree: entry, contenu: content })),
    );
  });
});

describe("fichiers modifiés hors de Cadre entre l'import et l'enregistrement", () => {
  test("test_ac_077_1_claude_md_modifie_depuis_l_import_refuse_sans_rien_ecrire", async () => {
    const { disque, enregistrer } = await projetImporte();
    disque.modifierHorsCadre("CLAUDE.md", "# Projet modifié dans l'éditeur\n");
    const avant = disque.chemins();

    const resultat = await enregistrer();

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "SOURCE_MODIFIEE", detail: "CLAUDE.md" },
    });
    expect(disque.transactions).toEqual([]);
    expect(disque.chemins()).toEqual(avant);
  });

  test("test_ac_077_1_agents_md_supprime_depuis_l_import_refuse", async () => {
    const { disque, enregistrer } = await projetImporte();
    disque.supprimerHorsCadre("AGENTS.md");

    expect(await enregistrer()).toEqual({
      ok: false,
      erreur: { code: "SOURCE_MODIFIEE", detail: "AGENTS.md" },
    });
    expect(disque.transactions).toEqual([]);
  });

  test("test_ac_077_1_claude_md_devenu_illisible_refuse", async () => {
    const { disque, enregistrer } = await projetImporte();
    disque.makeUnreadable("CLAUDE.md");

    expect(await enregistrer()).toMatchObject({ ok: false, erreur: { code: "SOURCE_MODIFIEE" } });
    expect(disque.transactions).toEqual([]);
  });

  test("test_ac_077_1_une_conversion_crlf_en_lf_par_git_n_est_pas_une_modification", async () => {
    const { disque, enregistrer } = await projetImporte();
    const lf = texte(new TextDecoder().decode(CLAUDE).replaceAll("\r\n", "\n"));
    disque.modifierHorsCadre("CLAUDE.md", Uint8Array.of(0xef, 0xbb, 0xbf, ...lf.slice(3)));

    expect(await enregistrer()).toEqual({ ok: true });
    // Le contenu enregistré reste celui qui a été importé.
    expect(disque.octets(".cadre/contexte/CLAUDE.md")).toEqual(CLAUDE);
  });

  test("test_ac_077_1_un_modele_cree_entre_temps_n_est_pas_ecrase", async () => {
    const { disque, enregistrer } = await projetImporte();
    // Une autre fenêtre de Cadre a enregistré ce projet entre-temps.
    disque.modifierHorsCadre(".cadre/cadre.yaml", "schema_version: 1\n");

    expect(await enregistrer()).toEqual({
      ok: false,
      erreur: { code: "MODELE_EXISTANT", detail: ".cadre/cadre.yaml" },
    });
    expect(disque.transactions).toEqual([]);
    expect(new TextDecoder().decode(disque.octets(".cadre/cadre.yaml"))).toBe(
      "schema_version: 1\n",
    );
  });
});

describe("échec de l'écriture (AC-077-2, zone sensible)", () => {
  test.each(CODES_ERREUR_FICHIERS)(
    "test_ac_077_2_echec_%s_au_milieu_de_l_ecriture_rien_n_est_ecrit",
    async (code) => {
      const { disque, enregistrer } = await projetImporte();
      const avant = disque.chemins();
      disque.echouerProchaineEcriture(code);

      const resultat = await enregistrer();

      expect(resultat).toEqual({ ok: false, erreur: { code, detail: "écriture simulée" } });
      expect(disque.chemins()).toEqual(avant);
      expect(await chargerModele(disque, RACINE)).toEqual({ etat: "aucun" });
    },
  );
});
