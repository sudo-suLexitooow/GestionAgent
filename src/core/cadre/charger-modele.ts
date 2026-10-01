// Chargement du modèle `.cadre/` à la réouverture d'un projet (US-006, ADR-001). Lecture seule :
// rien n'est jamais écrit ici, même pour un modèle invalide ou incomplet.
import { LineCounter, parseDocument, type Document } from "yaml";
import { readFailureReason, type ProjectFiles } from "../project/ports";
import schemaCadre from "../schemas/v1/cadre.json";
import type { ListedSkill } from "../skills/skill";
import { readSkillsFolder } from "../skills/skills-folder";
import { decodeUtf8 } from "../text/utf8";
import { SCHEMA_VERSION } from "./cadre-yaml";
import { etatDossierCadre } from "./detection";
import { validerAgentYaml, validerCadreYaml, type ErreurSchema } from "./schemas-v1";

export type CodeErreurModele =
  | "CADRE_MISSING"
  | "ENCODING"
  | "YAML_SYNTAX"
  | "YAML_DUPLICATE_KEY"
  | "SCHEMA"
  | "UNREADABLE"
  | "TOO_LARGE"
  | "LINK";

/** Erreur d'un fichier du modèle : chemin relatif au projet et, si connue, ligne (1 = première). */
export interface ErreurFichierModele {
  fichier: string;
  code: CodeErreurModele;
  ligne?: number;
}

export type AgentCharge =
  | {
      fichier: string;
      statut: "ok";
      donnees: Record<string, unknown>;
      /** Octets bruts de `agents/<nom>.md`, `null` s'il est absent. */
      instructions: Uint8Array | null;
    }
  | { fichier: string; statut: "erreur"; erreur: ErreurFichierModele };

export interface ContexteCharge {
  entree: Record<string, unknown>;
  /** Octets bruts de `contexte/<nom>.md`, `null` s'il est absent ou illisible. */
  contenu: Uint8Array | null;
}

export interface ModeleCadre {
  cadre: Record<string, unknown>;
  agents: AgentCharge[];
  contextes: ContexteCharge[];
  skills: ListedSkill[];
}

/**
 * `aucun` : pas de modèle (AC-006-6). `incomplet` : `cadre.yaml` absent ou invalide, rien n'est
 * chargé ni écrit (AC-006-5). `charge` : modèle lu ; `lectureSeule` si son format est plus récent
 * que celui de cette version de Cadre, qui ne doit alors rien y modifier (AC-006-2).
 */
export type ChargementModele =
  | { etat: "aucun" }
  | { etat: "incomplet"; erreur: ErreurFichierModele }
  | { etat: "charge"; lectureSeule: boolean; modele: ModeleCadre };

const CODES_LECTURE = {
  unreadable: "UNREADABLE",
  "too-large": "TOO_LARGE",
  link: "LINK",
} as const satisfies Record<ReturnType<typeof readFailureReason>, CodeErreurModele>;

const CADRE_YAML = ".cadre/cadre.yaml";
const DOSSIER_AGENTS = ".cadre/agents";
const NOM_CADRE = new RegExp(schemaCadre.$defs.cadreName.pattern, "u");

/**
 * Charge le modèle `.cadre/` du projet `root`. Un agent invalide est marqué en erreur sans empêcher
 * l'ouverture (AC-006-3). Rejette seulement si un dossier du modèle ne peut pas être listé.
 */
export async function chargerModele(files: ProjectFiles, root: string): Promise<ChargementModele> {
  const etat = await etatDossierCadre(files, root);
  if (etat === "aucun") return { etat: "aucun" };
  const lu = await lireYaml(files, root, CADRE_YAML);
  if (!lu.ok) return { etat: "incomplet", erreur: lu.erreur };

  const lectureSeule = formatPlusRecent(lu.donnees);
  if (!lectureSeule) {
    const ecart = premierEcart(lu, validerCadreYaml(lu.donnees), CADRE_YAML);
    if (ecart) return { etat: "incomplet", erreur: ecart };
  }
  const cadre = lu.donnees as Record<string, unknown>;
  const [agents, contextes, skills] = await Promise.all([
    chargerAgents(files, root),
    chargerContextes(files, root, cadre.contexts),
    readSkillsFolder(files, root, ".cadre/skills"),
  ]);
  return { etat: "charge", lectureSeule, modele: { cadre, agents, contextes, skills } };
}

/** `schema_version` entière et supérieure à la version supportée (ADR-001, D8). */
function formatPlusRecent(donnees: unknown): boolean {
  if (typeof donnees !== "object" || donnees === null) return false;
  const version = (donnees as Record<string, unknown>).schema_version;
  return Number.isInteger(version) && (version as number) > SCHEMA_VERSION;
}

async function chargerAgents(files: ProjectFiles, root: string): Promise<AgentCharge[]> {
  const entrees = (await files.listDir(root, DOSSIER_AGENTS)) ?? [];
  const noms = entrees
    // Un lien n'est jamais suivi (US-076) : il est listé pour être signalé en erreur.
    .filter(
      (entree) =>
        (entree.kind === "file" || entree.kind === "link") && entree.name.endsWith(".yaml"),
    )
    .map((entree) => entree.name.slice(0, -".yaml".length))
    .sort();
  return Promise.all(noms.map((nom) => chargerAgent(files, root, nom)));
}

async function chargerAgent(files: ProjectFiles, root: string, nom: string): Promise<AgentCharge> {
  const fichier = `${DOSSIER_AGENTS}/${nom}.yaml`;
  const enErreur = (erreur: ErreurFichierModele): AgentCharge => ({
    fichier,
    statut: "erreur",
    erreur,
  });
  const lu = await lireYaml(files, root, fichier);
  if (!lu.ok) return enErreur(lu.erreur);
  const ecart = premierEcart(lu, validerAgentYaml(lu.donnees), fichier);
  if (ecart) return enErreur(ecart);
  const instructions = await lireOctets(files, root, `${DOSSIER_AGENTS}/${nom}.md`);
  if (!instructions.ok) return enErreur(instructions.erreur);
  return {
    fichier,
    statut: "ok",
    donnees: lu.donnees as Record<string, unknown>,
    instructions: instructions.octets,
  };
}

/** Contextes déclarés dans `cadre.yaml`, dans l'ordre, avec leur contenu brut (ADR-001, D2). */
async function chargerContextes(
  files: ProjectFiles,
  root: string,
  declares: unknown,
): Promise<ContexteCharge[]> {
  const entrees: unknown[] = Array.isArray(declares) ? declares : [];
  return Promise.all(
    entrees.filter(estEntreeNommee).map(async (entree) => {
      const lu = await lireOctets(files, root, `.cadre/contexte/${entree.name}.md`);
      return { entree, contenu: lu.ok ? lu.octets : null };
    }),
  );
}

/**
 * Entrée de contexte dont le nom suit `cadreName` : déjà garanti par le schéma, revérifié parce
 * qu'un modèle en lecture seule (format plus récent) n'est pas validé, et que le nom devient un
 * chemin de fichier.
 */
function estEntreeNommee(entree: unknown): entree is Record<string, unknown> & { name: string } {
  if (typeof entree !== "object" || entree === null) return false;
  const nom = (entree as Record<string, unknown>).name;
  return typeof nom === "string" && NOM_CADRE.test(nom);
}

type Lecture<T> = ({ ok: true } & T) | { ok: false; erreur: ErreurFichierModele };

async function lireOctets(
  files: ProjectFiles,
  root: string,
  fichier: string,
): Promise<Lecture<{ octets: Uint8Array | null }>> {
  try {
    return { ok: true, octets: await files.readFile(root, fichier) };
  } catch (erreur) {
    const code = CODES_LECTURE[readFailureReason(erreur)];
    return { ok: false, erreur: { fichier, code } };
  }
}

type YamlLu = Lecture<{ donnees: unknown; document: Document; lignes: LineCounter }>;

/** Lit un YAML de `.cadre/` : UTF-8 (BOM accepté), LF ou CRLF, YAML 1.2, clé en double = erreur. */
async function lireYaml(files: ProjectFiles, root: string, fichier: string): Promise<YamlLu> {
  const lu = await lireOctets(files, root, fichier);
  if (!lu.ok) return lu;
  if (lu.octets === null) return { ok: false, erreur: { fichier, code: "CADRE_MISSING" } };
  const texte = decodeUtf8(lu.octets);
  if (texte === null) return { ok: false, erreur: { fichier, code: "ENCODING" } };
  const lignes = new LineCounter();
  const document = parseDocument(texte, { lineCounter: lignes });
  const [erreur] = document.errors;
  if (erreur) {
    const code = erreur.code === "DUPLICATE_KEY" ? "YAML_DUPLICATE_KEY" : "YAML_SYNTAX";
    const ligne = erreur.linePos?.[0].line;
    return {
      ok: false,
      erreur: ligne === undefined ? { fichier, code } : { fichier, code, ligne },
    };
  }
  return { ok: true, donnees: document.toJS() as unknown, document, lignes };
}

/** Premier écart au schéma, situé à la ligne du champ fautif (ou de son plus proche parent). */
function premierEcart(
  lu: { document: Document; lignes: LineCounter },
  ecarts: ErreurSchema[],
  fichier: string,
): ErreurFichierModele | null {
  const [ecart] = ecarts;
  if (!ecart) return null;
  for (let n = ecart.chemin.length; n >= 0; n--) {
    const noeud: unknown =
      n === 0 ? lu.document.contents : lu.document.getIn(ecart.chemin.slice(0, n), true);
    const debut = (noeud as { range?: [number, number, number] } | null)?.range?.[0];
    if (debut !== undefined)
      return { fichier, code: "SCHEMA", ligne: lu.lignes.linePos(debut).line };
  }
  return { fichier, code: "SCHEMA" };
}
