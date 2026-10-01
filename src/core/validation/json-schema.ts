// Interpréteur minimal de JSON Schema (draft 2020-12), limité aux mots-clés des schémas de
// `src/core/schemas/` : il n'évalue aucun code généré, ce que la CSP de Tauri interdit (`eval`).
// Mots-clés : type, required, properties, additionalProperties, propertyNames, items, enum,
// minimum, minLength, pattern, uniqueItems, $ref (local ou vers un autre schéma du registre).
// Les autres ($schema, $id, $defs, default) sont sans effet sur la validation.

export type Chemin = (string | number)[];

export interface EcartSchema {
  chemin: Chemin;
  regle: string;
}

/** Schéma JSON tel qu'importé d'un fichier `.json` (objet, ou booléen pour `{}` / `false`). */
export type Schema = { readonly [mot: string]: unknown } | boolean;

/** Ensemble de schémas qui se référencent par leur `$id`. */
export class RegistreSchemas {
  private readonly parId = new Map<string, Schema>();

  /** Lève si un schéma utilise un mot-clé que cet interpréteur ignorerait (garde). */
  constructor(schemas: readonly Schema[]) {
    for (const schema of schemas) {
      verifierMotsCles(schema, []);
      if (typeof schema === "object" && typeof schema.$id === "string") {
        this.parId.set(schema.$id, schema);
      }
    }
  }

  /** Écarts de `donnees` au schéma d'identifiant `id`, dans l'ordre de parcours. */
  valider(id: string, donnees: unknown): EcartSchema[] {
    const ecarts: EcartSchema[] = [];
    this.verifier(this.schema(id), id, donnees, [], ecarts);
    return ecarts;
  }

  private schema(id: string): Schema {
    const schema = this.parId.get(id);
    if (schema === undefined) throw new Error(`schéma inconnu : ${id}`);
    return schema;
  }

  /** Résout `$ref` (`#/$defs/x` ou `autre.json#/$defs/x`) depuis le schéma de base `base`. */
  private resoudre(ref: string, base: string): { schema: Schema; base: string } {
    const [document = "", fragment = ""] = ref.split("#");
    const cible = document === "" ? base : new URL(document, base).href;
    let schema: unknown = this.schema(cible);
    for (const segment of fragment.split("/").filter((s) => s !== "")) {
      schema = (schema as Record<string, unknown>)[segment];
    }
    if (typeof schema !== "object" && typeof schema !== "boolean") {
      throw new Error(`référence introuvable : ${ref}`);
    }
    return { schema: schema as Schema, base: cible };
  }

  private verifier(
    schema: Schema,
    base: string,
    valeur: unknown,
    chemin: Chemin,
    ecarts: EcartSchema[],
  ): void {
    if (schema === true) return;
    if (schema === false) {
      ecarts.push({ chemin, regle: "false" });
      return;
    }
    const ecart = (regle: string) => ecarts.push({ chemin, regle });

    if (typeof schema.$ref === "string") {
      const cible = this.resoudre(schema.$ref, base);
      this.verifier(cible.schema, cible.base, valeur, chemin, ecarts);
    }
    if (schema.type !== undefined && !aLeType(valeur, schema.type)) {
      ecart("type");
      return;
    }
    if (Array.isArray(schema.enum) && !schema.enum.some((v) => egal(v, valeur))) ecart("enum");

    if (typeof valeur === "number" && typeof schema.minimum === "number") {
      if (valeur < schema.minimum) ecart("minimum");
    }
    if (typeof valeur === "string") {
      if (typeof schema.minLength === "number" && Array.from(valeur).length < schema.minLength) {
        ecart("minLength");
      }
      if (typeof schema.pattern === "string" && !new RegExp(schema.pattern, "u").test(valeur)) {
        ecart("pattern");
      }
    }
    if (Array.isArray(valeur)) {
      if (schema.uniqueItems === true && aDesDoublons(valeur)) ecart("uniqueItems");
      const items = schema.items as Schema | undefined;
      if (items !== undefined) {
        valeur.forEach((element, i) => {
          this.verifier(items, base, element, [...chemin, i], ecarts);
        });
      }
    }
    if (estObjet(valeur)) this.verifierObjet(schema, base, valeur, chemin, ecarts);
  }

  private verifierObjet(
    schema: { readonly [mot: string]: unknown },
    base: string,
    objet: Record<string, unknown>,
    chemin: Chemin,
    ecarts: EcartSchema[],
  ): void {
    const requis = Array.isArray(schema.required) ? (schema.required as string[]) : [];
    if (requis.some((cle) => !Object.hasOwn(objet, cle)))
      ecarts.push({ chemin, regle: "required" });

    const proprietes = (schema.properties ?? {}) as Record<string, Schema>;
    const autres = schema.additionalProperties as Schema | undefined;
    const noms = schema.propertyNames as Schema | undefined;
    for (const [cle, valeur] of Object.entries(objet)) {
      if (noms !== undefined) this.verifier(noms, base, cle, [...chemin, cle], ecarts);
      if (Object.hasOwn(proprietes, cle)) {
        this.verifier(proprietes[cle] as Schema, base, valeur, [...chemin, cle], ecarts);
      } else if (autres !== undefined) {
        this.verifier(autres, base, valeur, [...chemin, cle], ecarts);
      }
    }
  }
}

/** Mots-clés interprétés, ou sans effet sur la validation (`$schema`, `$id`, `$defs`, `default`). */
const MOTS_CLES_PRIS_EN_CHARGE: ReadonlySet<string> = new Set([
  "$schema",
  "$id",
  "$defs",
  "$ref",
  "default",
  "type",
  "required",
  "properties",
  "additionalProperties",
  "propertyNames",
  "items",
  "enum",
  "minimum",
  "minLength",
  "pattern",
  "uniqueItems",
]);

/** Mots-clés dont la valeur est un dictionnaire de sous-schémas. */
const DICTIONNAIRES_DE_SCHEMAS = ["properties", "$defs"] as const;
/** Mots-clés dont la valeur est un sous-schéma. */
const SOUS_SCHEMAS = ["items", "additionalProperties", "propertyNames"] as const;

/** Parcourt `schema` et ses sous-schémas ; lève au premier mot-clé non pris en charge. */
function verifierMotsCles(schema: Schema, chemin: string[]): void {
  if (typeof schema === "boolean") return;
  for (const mot of Object.keys(schema)) {
    if (!MOTS_CLES_PRIS_EN_CHARGE.has(mot)) {
      throw new Error(`mot-clé de schéma non pris en charge : ${mot} (${chemin.join("/")})`);
    }
  }
  for (const mot of DICTIONNAIRES_DE_SCHEMAS) {
    const dictionnaire = (schema[mot] ?? {}) as Record<string, Schema>;
    for (const [nom, sousSchema] of Object.entries(dictionnaire)) {
      verifierMotsCles(sousSchema, [...chemin, mot, nom]);
    }
  }
  for (const mot of SOUS_SCHEMAS) {
    const sousSchema = schema[mot] as Schema | undefined;
    if (sousSchema !== undefined) verifierMotsCles(sousSchema, [...chemin, mot]);
  }
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function aLeType(valeur: unknown, type: unknown): boolean {
  const types = Array.isArray(type) ? (type as unknown[]) : [type];
  return types.some((t) => {
    switch (t) {
      case "object":
        return estObjet(valeur);
      case "array":
        return Array.isArray(valeur);
      case "integer":
        return Number.isInteger(valeur);
      case "number":
        return typeof valeur === "number" && Number.isFinite(valeur);
      case "null":
        return valeur === null;
      default:
        return typeof valeur === t;
    }
  });
}

/** Scalaires comparés par un `Set` (linéaire) ; objets et listes deux à deux, entre eux seulement. */
function aDesDoublons(valeurs: readonly unknown[]): boolean {
  const scalaires = new Set<unknown>();
  const composes: unknown[] = [];
  for (const valeur of valeurs) {
    if (typeof valeur === "object" && valeur !== null) {
      if (composes.some((autre) => egal(autre, valeur))) return true;
      composes.push(valeur);
    } else {
      if (scalaires.has(valeur)) return true;
      scalaires.add(valeur);
    }
  }
  return false;
}

/** Égalité profonde au sens de JSON Schema (ordre des clés indifférent). */
function egal(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => egal(v, b[i]));
  }
  if (estObjet(a) && estObjet(b)) {
    const cles = Object.keys(a);
    return (
      cles.length === Object.keys(b).length &&
      cles.every((cle) => Object.hasOwn(b, cle) && egal(a[cle], b[cle]))
    );
  }
  return a === b;
}
