import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";
import schemaCadre from "../schemas/v1/cadre.json";
import { nouveauCadre, serialiserCadre, SCHEMA_VERSION } from "./cadre-yaml";

function validerContreSchema(donnees: unknown) {
  const ajv = new Ajv2020({ allErrors: true });
  const valider = ajv.compile(schemaCadre);
  const valide = valider(donnees);
  return { valide, erreurs: valider.errors };
}

describe("cadre.yaml (AC-005-1)", () => {
  it("test_ac_005_1_nouveau_cadre_contient_versions_et_outils_actifs", () => {
    const cadre = nouveauCadre({ generatorVersion: "0.1.0", outils: ["claude-code"] });

    expect(cadre).toEqual({
      schema_version: SCHEMA_VERSION,
      generator_version: "0.1.0",
      tools: ["claude-code"],
    });
    expect(SCHEMA_VERSION).toBe(1);
  });

  it("test_ac_005_1_cadre_yaml_serialise_est_conforme_au_schema_v1", () => {
    const texte = serialiserCadre(
      nouveauCadre({ generatorVersion: "0.1.0", outils: ["claude-code"] }),
    );

    const relu: unknown = parse(texte);
    expect(relu).toEqual({ schema_version: 1, generator_version: "0.1.0", tools: ["claude-code"] });
    expect(validerContreSchema(relu)).toEqual({ valide: true, erreurs: null });
  });

  it("test_ac_005_1_cadre_yaml_utf8_sans_bom_lf_indentation_2_ligne_finale", () => {
    const texte = serialiserCadre(
      nouveauCadre({ generatorVersion: "1.2.3-beta.1", outils: ["claude-code", "generic"] }),
    );

    expect(texte).toBe(
      "schema_version: 1\ngenerator_version: 1.2.3-beta.1\ntools:\n  - claude-code\n  - generic\n",
    );
    expect(texte.charCodeAt(0)).not.toBe(0xfeff);
  });
});
