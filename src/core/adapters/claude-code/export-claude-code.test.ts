// Intégration : export réel vers Claude Code (adaptateur + cœur + faux disque fidèle au port).
import { createHash } from "node:crypto";
import { parse, stringify } from "yaml";
import { exporterModele } from "../../export/exporter";
import { DisqueMemoire } from "../../testing/disque-memoire";
import { claudeCodeAdapter } from "./claude-code-adapter";

const RACINE = "/home/lea/projet";
const ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const CHEMIN = ".claude/agents/frontend.md";
const ATTENDU =
  "---\n" +
  "name: frontend\n" +
  'description: "Développe l\'interface React."\n' +
  "---\n" +
  "Tu es le développeur front-end du projet.\n";

function projet(contenu: Record<string, string | Uint8Array> = {}): DisqueMemoire {
  return new DisqueMemoire(RACINE, {
    ".cadre/cadre.yaml": "schema_version: 1\ngenerator_version: 0.1.0\ntools: [claude-code]\n",
    ".cadre/agents/frontend.yaml": stringify({
      id: ID,
      name: "frontend",
      role: "Tu es le développeur front-end du projet.\n",
      description: "Développe l'interface React.",
      target: "claude-code",
    }),
    ...contenu,
  });
}

function exporter(disque: DisqueMemoire, confirmes: string[] = []) {
  return exporterModele({ fichiers: disque, systeme: disque }, RACINE, claudeCodeAdapter, {
    confirmes,
  });
}

function texte(disque: DisqueMemoire, chemin: string): string | undefined {
  const octets = disque.octets(chemin);
  return octets === undefined ? undefined : new TextDecoder().decode(octets);
}

function etat(disque: DisqueMemoire): Record<string, string | undefined> {
  return Object.fromEntries(disque.chemins().map((chemin) => [chemin, texte(disque, chemin)]));
}

const sha256 = (s: string) => createHash("sha256").update(s.replaceAll("\r\n", "\n")).digest("hex");

/** Manifeste qui déclare `.claude/agents/frontend.md` généré avec `contenu`. */
const manifeste = (contenu: string) =>
  stringify({
    files: [
      { path: CHEMIN, adapter: "claude-code", source: `agent:${ID}`, sha256: sha256(contenu) },
    ],
  });

describe("exporter un agent vers Claude Code (US-008)", () => {
  test("test_ac_008_1_cree_claude_agents_frontend_md_et_l_inscrit_dans_generated_yaml", async () => {
    const disque = projet();

    const resultat = await exporter(disque);

    expect(resultat).toEqual({ ok: true, fichiers: [CHEMIN] });
    expect(texte(disque, CHEMIN)).toBe(ATTENDU);
    expect(parse(texte(disque, ".cadre/generated.yaml") ?? "")).toEqual({
      files: [
        { path: CHEMIN, adapter: "claude-code", source: `agent:${ID}`, sha256: sha256(ATTENDU) },
      ],
    });
  });

  test("test_ac_008_1_reexporter_sans_modification_ne_demande_aucune_confirmation", async () => {
    const disque = projet();
    await exporter(disque);

    const resultat = await exporter(disque);

    expect(resultat).toEqual({ ok: true, fichiers: [CHEMIN] });
    expect(texte(disque, CHEMIN)).toBe(ATTENDU);
  });

  test("test_ac_008_3_erreur_au_milieu_de_l_ecriture_aucun_fichier_modifie", async () => {
    const disque = projet({ [CHEMIN]: "ancien", ".cadre/generated.yaml": manifeste("ancien") });
    disque.echouerProchaineEcriture("ANNULATION_INCOMPLETE");
    const avant = etat(disque);

    const resultat = await exporter(disque);

    expect(resultat).toMatchObject({ ok: false, erreur: { code: "ANNULATION_INCOMPLETE" } });
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_frontend_md_ecrit_a_la_main_n_est_pas_ecrase_sans_confirmation", async () => {
    const disque = projet({ [CHEMIN]: "---\nname: frontend\ndescription: à moi\n---\nMon rôle\n" });
    const avant = etat(disque);

    const resultat = await exporter(disque);

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "ECRASEMENT_A_CONFIRMER", detail: CHEMIN },
      aConfirmer: [CHEMIN],
    });
    expect(disque.transactions).toEqual([]);
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_frontend_md_genere_puis_modifie_par_l_utilisateur_n_est_pas_ecrase", async () => {
    const disque = projet();
    await exporter(disque);
    disque.modifierHorsCadre(CHEMIN, `${ATTENDU}Ajout de l'utilisateur.\n`);
    const avant = etat(disque);

    const resultat = await exporter(disque);

    expect(resultat).toMatchObject({ ok: false, aConfirmer: [CHEMIN] });
    expect(etat(disque)).toEqual(avant);
  });

  test("test_ac_008_4_apres_confirmation_explicite_le_fichier_est_ecrase", async () => {
    const disque = projet({ [CHEMIN]: "écrit à la main\n" });

    const resultat = await exporter(disque, [CHEMIN]);

    expect(resultat.ok).toBe(true);
    expect(texte(disque, CHEMIN)).toBe(ATTENDU);
  });

  test("test_ac_008_4_frontend_md_converti_en_crlf_par_git_reste_un_fichier_genere", async () => {
    const disque = projet();
    await exporter(disque);
    disque.modifierHorsCadre(CHEMIN, ATTENDU.replaceAll("\n", "\r\n"));

    const resultat = await exporter(disque);

    expect(resultat.ok).toBe(true);
    expect(texte(disque, CHEMIN)).toBe(ATTENDU);
  });

  test.each([".claude", ".claude/agents", CHEMIN])(
    "test_ac_008_4_%s_en_lien_refuse_rien_n_est_ecrit",
    async (lien) => {
      const disque = projet();
      disque.addLink(lien);
      const avant = etat(disque);

      const resultat = await exporter(disque, [CHEMIN]);

      expect(resultat).toEqual({ ok: false, erreur: { code: "FICHIER_LIEN", detail: CHEMIN } });
      expect(disque.transactions).toEqual([]);
      expect(etat(disque)).toEqual(avant);
    },
  );
});

describe("instructions de l'agent exportées octet pour octet (ADR-001, D9.1)", () => {
  test("test_ac_008_1_les_instructions_de_l_agent_forment_le_corps_exporte", async () => {
    const instructions = new TextEncoder().encode("# Rôle\r\nTu écris le front-end.\r\n");
    const disque = projet({ ".cadre/agents/frontend.md": instructions });

    const resultat = await exporter(disque);

    expect(resultat.ok).toBe(true);
    const entete = 'name: frontend\ndescription: "Développe l\'interface React."';
    // Listes d'octets : sous jsdom, `TextEncoder` renvoie un `Uint8Array` d'un autre domaine.
    expect(Array.from(disque.octets(CHEMIN) ?? [])).toEqual([
      ...new TextEncoder().encode(`---\n${entete}\n---\n`),
      ...instructions,
    ]);
  });
});
