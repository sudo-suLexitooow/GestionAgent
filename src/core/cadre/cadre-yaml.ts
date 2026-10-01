// Modèle de `.cadre/cadre.yaml` (ADR-001, D2) et sa sérialisation.
import { stringify } from "yaml";

/** Version du format `.cadre/` écrite par cette version de Cadre (ADR-001, D8). */
export const SCHEMA_VERSION = 1;

export interface CadreYaml {
  schema_version: number;
  generator_version: string;
  tools: string[];
}

export function nouveauCadre(options: { generatorVersion: string; outils: string[] }): CadreYaml {
  return {
    schema_version: SCHEMA_VERSION,
    generator_version: options.generatorVersion,
    tools: [...options.outils],
  };
}

/** UTF-8 sans BOM, LF, indentation 2, ligne finale (ADR-001, D1). */
export function serialiserCadre(cadre: CadreYaml): string {
  return stringify(cadre, { indent: 2, indentSeq: true, lineWidth: 0 });
}
