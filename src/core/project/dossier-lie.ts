// Dossier refusé parce qu'il est lui-même un lien, ou qu'un de ses parents l'est (US-079).
// Lecture seule, par le port `ProjectFiles` : aucun lien n'est suivi, seuls les parents sont listés.
import { ProjectReadError, readFailureReason, type DirEntry, type ProjectFiles } from "./ports";

/** Rejet `link` qui nomme le dossier lié (dossier de l'outil, dossier des skills, `.cadre`…), relatif au projet. */
export class DossierLieError extends ProjectReadError {
  constructor(readonly chemin: string) {
    super("link");
    this.name = "DossierLieError";
  }
}

/**
 * Comme `files.listDir`, mais un refus `link` devient un `DossierLieError` qui nomme le premier
 * segment lié du chemin (le dossier lui-même ou un parent) ; à défaut, le chemin demandé.
 */
export async function listerSansSuivreLesLiens(
  files: ProjectFiles,
  root: string,
  path: string,
): Promise<DirEntry[] | null> {
  try {
    return await files.listDir(root, path);
  } catch (erreur) {
    if (erreur instanceof DossierLieError || readFailureReason(erreur) !== "link") throw erreur;
    throw new DossierLieError((await premierSegmentLie(files, root, path)) ?? path);
  }
}

/** Premier préfixe de `path` listé comme lien par son dossier parent ; `null` si aucun. */
async function premierSegmentLie(
  files: ProjectFiles,
  root: string,
  path: string,
): Promise<string | null> {
  const segments = path.split("/");
  for (let i = 0; i < segments.length; i++) {
    const entrees = await files.listDir(root, segments.slice(0, i).join("/")).catch(() => null);
    const entree = entrees?.find(({ name }) => name === segments[i]);
    if (entree === undefined) return null;
    if (entree.kind === "link") return segments.slice(0, i + 1).join("/");
  }
  return null;
}
