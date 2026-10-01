import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RegistreSchemas, type Schema } from "./json-schema";

const DOSSIER_SCHEMAS = join(__dirname, "..", "schemas");

/** Tous les schémas `.json` de `src/core/schemas/`, sous-dossiers compris. */
function schemasDuProjet(): Schema[] {
  return readdirSync(DOSSIER_SCHEMAS, { recursive: true, encoding: "utf8" })
    .filter((chemin) => chemin.endsWith(".json"))
    .map((chemin) => JSON.parse(readFileSync(join(DOSSIER_SCHEMAS, chemin), "utf8")) as Schema);
}

describe("garde : mots-clés pris en charge par l'interpréteur (AC-006-3)", () => {
  test("test_ac_006_3_un_mot_cle_non_pris_en_charge_est_refuse_au_chargement", () => {
    const schema = {
      $id: "https://cadre.app/schemas/test/x.json",
      type: "object",
      properties: { nom: { type: "string", maxLength: 3 } },
    };

    expect(() => new RegistreSchemas([schema])).toThrow(
      "mot-clé de schéma non pris en charge : maxLength (properties/nom)",
    );
  });

  test("test_ac_006_3_les_schemas_du_projet_n_utilisent_que_des_mots_cles_pris_en_charge", () => {
    const schemas = schemasDuProjet();

    expect(schemas.length).toBeGreaterThanOrEqual(2);
    expect(() => new RegistreSchemas(schemas)).not.toThrow();
  });
});
