// Enregistrement des contextes importés dans `.cadre/` (US-077) : `cadre.yaml` et sa liste
// `contexts`, le contenu brut de chaque contexte, et l'adoption des fichiers importés dans
// `generated.yaml` (ADR-001, D2 et D5). Une seule transaction, via le chemin d'écriture d'US-005.
import type { ToolAdapter } from "../adapters/adapter";
import { fichiersAgent, type AgentNouveau } from "../agents/agent";
import type { ImportedContext } from "../contexts/context";
import { GENERIC_ADAPTER_ID } from "../contexts/generic-format";
import type { FichierAEcrire, SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { ProjectFiles } from "../project/ports";
import type { ImportedSkill } from "../skills/import-skills";
import { nouveauCadre, serialiserCadre } from "./cadre-yaml";
import { etatDossierCadre } from "./detection";
import { empreinte } from "./empreinte";
import {
  enregistrerFichiers,
  versErreurEnregistrement,
  type ErreurEnregistrement,
  type ResultatEnregistrement,
} from "./enregistrer";
import { serialiserManifeste, type FichierGenere } from "./generated-yaml";

export interface OptionsEnregistrement {
  /** Adaptateur de l'outil actif (`tools`), propriétaire de ses fichiers de contexte. */
  adapter: ToolAdapter;
  /** Version de Cadre (SemVer), inscrite dans `generator_version` (ADR-001, D8). */
  generatorVersion: string;
}

/**
 * Enregistre les contextes importés dans un projet sans modèle. Refuse sans rien écrire si un
 * modèle `.cadre/` est apparu depuis l'import (`MODELE_EXISTANT`), ou si un fichier importé a
 * changé, a disparu ou n'est plus lisible (`SOURCE_MODIFIEE`) : son adoption inscrirait dans le
 * manifeste un contenu qui n'est plus le sien. Une conversion CRLF → LF n'est pas un changement.
 */
export async function enregistrerContextesImportes(
  disque: { fichiers: ProjectFiles; systeme: SystemeFichiersProjet },
  racine: string,
  contextes: readonly ImportedContext[],
  options: OptionsEnregistrement,
  /** Agents créés depuis l'ouverture (US-007), écrits dans la même transaction. */
  agents: readonly AgentNouveau[] = [],
  /** Skills importées par l'adaptateur (US-004), copiées dans `.cadre/skills/`. */
  skills: readonly ImportedSkill[] = [],
): Promise<ResultatEnregistrement> {
  // Ne rejette jamais : toute exception de la préparation (lecture, empreinte, sérialisation)
  // devient une erreur `ECHEC`, sans rien écrire.
  let fichiers: FichierAEcrire[];
  try {
    const refus =
      (await modeleApparu(disque.fichiers, racine)) ??
      (await sourceModifiee(disque.fichiers, racine, contextes)) ??
      (await skillModifiee(disque.fichiers, racine, skills, options.adapter));
    if (refus) return { ok: false, erreur: refus };
    fichiers = await preparer(contextes, agents, skills, options);
  } catch (erreur) {
    return { ok: false, erreur: versErreurEnregistrement(erreur) };
  }
  return enregistrerFichiers(disque.systeme, racine, fichiers);
}

/**
 * `cadre.yaml`, contenu brut des contextes, agents et manifeste d'adoption, dans l'ordre
 * d'écriture. `tools` : l'outil actif et les outils cibles des agents.
 */
async function preparer(
  contextes: readonly ImportedContext[],
  agents: readonly AgentNouveau[],
  skills: readonly ImportedSkill[],
  options: OptionsEnregistrement,
): Promise<FichierAEcrire[]> {
  const adoptions: FichierGenere[] = await Promise.all([
    ...contextes.map((contexte) => adoption(contexte, options.adapter)),
    ...skills.flatMap((skill) => adoptionsSkill(skill, options.adapter)),
  ]);
  const cadre = {
    ...nouveauCadre({
      generatorVersion: options.generatorVersion,
      outils: [...new Set([options.adapter.id, ...agents.map((agent) => agent.target)])],
    }),
    contexts: contextes.map(({ entry }) => entry),
  };
  return [
    { chemin: ".cadre/cadre.yaml", contenu: serialiserCadre(cadre) },
    ...contextes.map(({ path, content }) => ({ chemin: path, contenu: content })),
    ...skills.flatMap(fichiersSkill),
    ...agents.flatMap(fichiersAgent),
    { chemin: ".cadre/generated.yaml", contenu: serialiserManifeste(adoptions) },
  ];
}

async function modeleApparu(
  fichiers: ProjectFiles,
  racine: string,
): Promise<ErreurEnregistrement | null> {
  const etat = await etatDossierCadre(fichiers, racine);
  if (etat === "aucun") return null;
  return { code: "MODELE_EXISTANT", detail: etat === "modele" ? ".cadre/cadre.yaml" : ".cadre/" };
}

async function sourceModifiee(
  fichiers: ProjectFiles,
  racine: string,
  contextes: readonly ImportedContext[],
): Promise<ErreurEnregistrement | null> {
  for (const { entry, content } of contextes) {
    const actuel = await fichiers.readFile(racine, entry.source).catch(() => null);
    if (actuel === null || (await empreinte(actuel)) !== (await empreinte(content))) {
      return { code: "SOURCE_MODIFIEE", detail: entry.source };
    }
  }
  return null;
}

/**
 * Les skills importées ne sont plus celles du disque : l'adaptateur les réimporte et chaque skill
 * doit avoir les mêmes fichiers, de même empreinte ; une skill apparue entre-temps compte aussi
 * (elle ne serait plus visible une fois le modèle créé). Aucune skill importée : rien à vérifier.
 */
async function skillModifiee(
  fichiers: ProjectFiles,
  racine: string,
  skills: readonly ImportedSkill[],
  adapter: ToolAdapter,
): Promise<ErreurEnregistrement | null> {
  if (skills.length === 0 || !adapter.importer) return null;
  const actuelles = new Map(
    (await adapter.importer(fichiers, racine)).skills.map((skill) => [skill.source, skill]),
  );
  for (const importee of skills) {
    const actuelle = actuelles.get(importee.source);
    actuelles.delete(importee.source);
    const detail = await premierEcart(importee, actuelle);
    if (detail) return { code: "SOURCE_MODIFIEE", detail };
  }
  const [apparue] = actuelles.keys();
  return apparue === undefined ? null : { code: "SOURCE_MODIFIEE", detail: apparue };
}

/** Premier fichier qui diffère entre la skill importée et la skill actuelle, sinon `null`. */
async function premierEcart(
  importee: ImportedSkill,
  actuelle: ImportedSkill | undefined,
): Promise<string | null> {
  if (!actuelle) return importee.source;
  const contenus = new Map(actuelle.files.map(({ path, content }) => [path, content]));
  for (const { path, content } of importee.files) {
    const actuel = contenus.get(path);
    contenus.delete(path);
    if (!actuel || (await empreinte(actuel)) !== (await empreinte(content))) {
      return `${importee.source}/${path}`;
    }
  }
  const [ajoute] = contenus.keys();
  return ajoute === undefined ? null : `${importee.source}/${ajoute}`;
}

/** Adoption du fichier importé : l'empreinte est celle du contenu importé (ADR-001, D5). */
async function adoption(contexte: ImportedContext, adapter: ToolAdapter): Promise<FichierGenere> {
  const source = contexte.entry.source;
  const propre = adapter.contextFiles?.some((spec) => spec.file === source) ?? false;
  return {
    path: source,
    adapter: propre ? adapter.id : GENERIC_ADAPTER_ID,
    source: "contexts",
    sha256: await empreinte(contexte.content),
  };
}

/** Copie à l'octet près de la skill dans `.cadre/skills/<dossier>/` (ADR-001, D2). */
function fichiersSkill({ skill, files }: ImportedSkill): FichierAEcrire[] {
  return files.map(({ path, content }) => ({
    chemin: `.cadre/skills/${skill.folder}/${path}`,
    contenu: content,
  }));
}

/** Adoption de chaque fichier d'origine de la skill, avec l'empreinte du contenu importé (D5). */
function adoptionsSkill(
  { skill, source, files }: ImportedSkill,
  adapter: ToolAdapter,
): Promise<FichierGenere>[] {
  return files.map(async ({ path, content }) => ({
    path: `${source}/${path}`,
    adapter: adapter.id,
    source: `skill:${skill.folder}`,
    sha256: await empreinte(content),
  }));
}
