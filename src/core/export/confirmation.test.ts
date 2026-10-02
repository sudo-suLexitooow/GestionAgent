// Revue n° 1 de la PR #16 : une confirmation d'écrasement ne vaut que pour le contenu affiché.
import { createHash } from "node:crypto";
import { stringify } from "yaml";
import type { AdaptateurExport } from "../adapters/adapter";
import { DisqueMemoire } from "../testing/disque-memoire";
import { empreintesActuelles, exporterModele, type ConfirmationEcrasement } from "./exporter";

const RACINE = "/home/lea/projet";
const ALPHA = ".factice/alpha.txt";

/** Adaptateur factice : `.factice/<nom>.txt` = rôle. */
const factice: AdaptateurExport = {
  id: "factice",
  valider: () => [],
  exporter: ({ agents }) =>
    agents.map((agent) => ({
      chemin: `.factice/${agent.name}.txt`,
      contenu: agent.role,
      source: `agent:${agent.id}`,
    })),
};

function projet(contenu: Record<string, string>): DisqueMemoire {
  return new DisqueMemoire(RACINE, {
    ".cadre/cadre.yaml": "schema_version: 1\ngenerator_version: 0.1.0\ntools: [factice]\n",
    ".cadre/agents/alpha.yaml": stringify({
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      name: "alpha",
      role: "rôle exporté\n",
      target: "factice",
    }),
    ...contenu,
  });
}

const sha256 = (s: string) => createHash("sha256").update(s.replaceAll("\r\n", "\n")).digest("hex");

function exporter(disque: DisqueMemoire, confirmations: ConfirmationEcrasement[]) {
  return exporterModele({ fichiers: disque, systeme: disque }, RACINE, factice, {
    confirmations,
  });
}

function texte(disque: DisqueMemoire, chemin: string): string {
  return new TextDecoder().decode(disque.octets(chemin));
}

describe("confirmation d'écrasement liée au contenu affiché (AC-008-4)", () => {
  test("test_ac_008_4_fichier_modifie_apres_l_affichage_de_la_confirmation_redemande_confirmation", async () => {
    const disque = projet({ [ALPHA]: "version affichée\n" });
    const affichee = { chemin: ALPHA, sha256: sha256("version affichée\n") };
    disque.modifierHorsCadre(ALPHA, "modifiée après l'affichage\n");

    const resultat = await exporter(disque, [affichee]);

    expect(resultat).toEqual({
      ok: false,
      erreur: { code: "ECRASEMENT_A_CONFIRMER", detail: ALPHA },
      aConfirmer: [ALPHA],
    });
    expect(disque.transactions).toEqual([]);
    expect(texte(disque, ALPHA)).toBe("modifiée après l'affichage\n");
  });

  test("test_ac_008_4_confirmation_du_contenu_affiche_inchange_ecrase_le_fichier", async () => {
    const disque = projet({ [ALPHA]: "version affichée\r\n" });

    const resultat = await exporter(disque, [
      { chemin: ALPHA, sha256: sha256("version affichée\n") },
    ]);

    expect(resultat).toEqual({ ok: true, fichiers: [ALPHA] });
    expect(texte(disque, ALPHA)).toBe("rôle exporté\n");
  });

  test("test_ac_008_4_empreintes_actuelles_des_fichiers_a_confirmer", async () => {
    const disque = projet({ [ALPHA]: "a\r\nb\n", ".factice/beta.txt": "c" });

    const empreintes = await empreintesActuelles(disque, RACINE, [ALPHA, ".factice/beta.txt"]);

    expect(empreintes).toEqual([
      { chemin: ALPHA, sha256: sha256("a\nb\n") },
      { chemin: ".factice/beta.txt", sha256: sha256("c") },
    ]);
  });

  test("test_ac_008_4_un_fichier_disparu_ou_illisible_n_a_pas_d_empreinte_a_confirmer", async () => {
    const disque = projet({ [ALPHA]: "a" }).makeUnreadable(ALPHA);

    const empreintes = await empreintesActuelles(disque, RACINE, [ALPHA, ".factice/absent.txt"]);

    expect(empreintes).toEqual([]);
  });
});
