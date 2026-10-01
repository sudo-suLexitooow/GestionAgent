// Modèle de `.cadre/cadre.yaml` (ADR-001, D2) et sa sérialisation.

export const SCHEMA_VERSION = 0;

export interface CadreYaml {
  schema_version: number;
  generator_version: string;
  tools: string[];
}

export function nouveauCadre(_options: { generatorVersion: string; outils: string[] }): CadreYaml {
  return { schema_version: 0, generator_version: "", tools: [] };
}

export function serialiserCadre(_cadre: CadreYaml): string {
  return "";
}
