// Enregistrement des contextes importés dans `.cadre/` (US-077) : `cadre.yaml` et sa liste
// `contexts`, le contenu brut de chaque contexte, et l'adoption des fichiers importés dans
// `generated.yaml` (ADR-001, D2 et D5). Une seule transaction, via le chemin d'écriture d'US-005.
import type { ToolAdapter } from "../adapters/adapter";
import type { ImportedContext } from "../contexts/context";
import { GENERIC_ADAPTER_ID } from "../contexts/generic-format";
import type { FichierAEcrire, SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { ProjectFiles } from "../project/ports";
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
): Promise<ResultatEnregistrement> {
  // Ne rejette jamais : toute exception de la préparation (lecture, empreinte, sérialisation)
  // devient une erreur `ECHEC`, sans rien écrire.
  let fichiers: FichierAEcrire[];
  try {
    const refus =
      (await modeleApparu(disque.fichiers, racine)) ??
      (await sourceModifiee(disque.fichiers, racine, contextes));
    if (refus) return { ok: false, erreur: refus };
    fichiers = await preparer(contextes, options);
  } catch (erreur) {
    return { ok: false, erreur: versErreurEnregistrement(erreur) };
  }
  return enregistrerFichiers(disque.systeme, racine, fichiers);
}

/** `cadre.yaml`, contenu brut des contextes et manifeste d'adoption, dans l'ordre d'écriture. */
async function preparer(
  contextes: readonly ImportedContext[],
  options: OptionsEnregistrement,
): Promise<FichierAEcrire[]> {
  const adoptions: FichierGenere[] = await Promise.all(
    contextes.map((contexte) => adoption(contexte, options.adapter)),
  );
  const cadre = {
    ...nouveauCadre({ generatorVersion: options.generatorVersion, outils: [options.adapter.id] }),
    contexts: contextes.map(({ entry }) => entry),
  };
  return [
    { chemin: ".cadre/cadre.yaml", contenu: serialiserCadre(cadre) },
    ...contextes.map(({ path, content }) => ({ chemin: path, contenu: content })),
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
