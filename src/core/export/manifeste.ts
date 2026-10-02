// Lecture et mise à jour du manifeste `.cadre/generated.yaml` pour l'export (ADR-001, D5).
import { parse } from "yaml";
import type { FichierGenere } from "../cadre/generated-yaml";
import { decodeUtf8 } from "../text/utf8";

/** Entrée du manifeste ; les clés inconnues d'une entrée conservée sont gardées. */
export type EntreeManifeste = FichierGenere & Record<string, unknown>;

/**
 * Entrées du manifeste lu (`null` : fichier absent, aucune entrée). Renvoie `null` si le contenu
 * n'est pas un manifeste valide : UTF-8, YAML, `files` liste d'entrées aux quatre champs texte.
 */
export function lireManifeste(octets: Uint8Array | null): EntreeManifeste[] | null {
  if (octets === null) return [];
  const texte = decodeUtf8(octets);
  if (texte === null) return null;
  let donnees: unknown;
  try {
    donnees = parse(texte, { uniqueKeys: true });
  } catch {
    return null;
  }
  if (donnees === null || donnees === undefined) return [];
  if (typeof donnees !== "object" || Array.isArray(donnees)) return null;
  const files = (donnees as Record<string, unknown>).files ?? [];
  if (!Array.isArray(files) || !files.every(estEntree)) return null;
  return files;
}

function estEntree(entree: unknown): entree is EntreeManifeste {
  if (typeof entree !== "object" || entree === null) return false;
  const champs = entree as Record<string, unknown>;
  return ["path", "adapter", "source", "sha256"].every((cle) => typeof champs[cle] === "string");
}

/** Remplace, à sa place, l'entrée de chaque fichier déjà inscrit ; ajoute les autres à la fin. */
export function mettreAJourManifeste(
  entrees: readonly EntreeManifeste[],
  nouvelles: readonly FichierGenere[],
): FichierGenere[] {
  const parChemin = new Map(nouvelles.map((entree) => [entree.path, entree]));
  const misesAJour = entrees.map((entree) => parChemin.get(entree.path) ?? entree);
  const dejaInscrits = new Set(entrees.map((entree) => entree.path));
  return [...misesAJour, ...nouvelles.filter((entree) => !dejaInscrits.has(entree.path))];
}
