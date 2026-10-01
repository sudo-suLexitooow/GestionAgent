// Validation des YAML de `.cadre/` contre les schémas v1 (ADR-001, D2 et D3).
import schemaAgent from "../schemas/v1/agent.json";
import schemaCadre from "../schemas/v1/cadre.json";
import { RegistreSchemas, type EcartSchema } from "../validation/json-schema";

/** Écart au schéma : chemin du champ fautif dans le document et règle violée. */
export type ErreurSchema = EcartSchema;

const registre = new RegistreSchemas([schemaCadre, schemaAgent]);

/** `.cadre/cadre.yaml` (D2) ; liste vide = conforme. */
export function validerCadreYaml(donnees: unknown): ErreurSchema[] {
  return registre.valider(schemaCadre.$id, donnees);
}

/** `.cadre/agents/<nom>.yaml` (D3) ; liste vide = conforme. */
export function validerAgentYaml(donnees: unknown): ErreurSchema[] {
  return registre.valider(schemaAgent.$id, donnees);
}
