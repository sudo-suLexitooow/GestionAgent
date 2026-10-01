// Validation des YAML de `.cadre/` contre les schémas v1 (ADR-001, D2 et D3).

/** Écart au schéma : chemin du champ fautif dans le document et règle violée. */
export interface ErreurSchema {
  chemin: (string | number)[];
  regle: string;
}

export function validerCadreYaml(_donnees: unknown): ErreurSchema[] {
  return [];
}

export function validerAgentYaml(_donnees: unknown): ErreurSchema[] {
  return [];
}
