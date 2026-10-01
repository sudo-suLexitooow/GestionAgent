import { decideDrop } from "./drop";
import type { FolderAccess } from "./ports";

export interface Project {
  name: string;
  path: string;
}

export type OpenError =
  | "not-found"
  | "unreadable"
  | "not-a-directory"
  | "drop-single-folder"
  | "project-preparation-failed"
  | "unexpected";

export type OpenOutcome =
  | { kind: "opened"; project: Project }
  | { kind: "cancelled" }
  | { kind: "error"; error: OpenError };

/** Ouvre le dossier choisi dans le sélecteur (AC-001-1, AC-001-4, AC-001-5). */
export function openFromPicker(folders: FolderAccess): Promise<OpenOutcome> {
  return withoutCrash(async () => {
    const path = await folders.pickFolder();
    if (path === null) return { kind: "cancelled" };
    return openPath(folders, path);
  });
}

/** Ouvre le dossier déposé dans la fenêtre ; un fichier ou plusieurs éléments sont refusés (AC-001-2, AC-001-3). */
export function openFromDrop(
  folders: FolderAccess,
  paths: readonly string[],
): Promise<OpenOutcome> {
  return withoutCrash(async () => {
    const decision = decideDrop(paths);
    if (decision.kind === "rejected") return DROP_SINGLE_FOLDER;
    const outcome = await openPath(folders, decision.path);
    const isNotAFolder = outcome.kind === "error" && outcome.error === "not-a-directory";
    return isNotAFolder ? DROP_SINGLE_FOLDER : outcome;
  });
}

const DROP_SINGLE_FOLDER: OpenOutcome = { kind: "error", error: "drop-single-folder" };

/** Un échec système (dialogue, commande) devient une erreur affichable : l'app ne plante pas (AC-001-4). */
async function withoutCrash(open: () => Promise<OpenOutcome>): Promise<OpenOutcome> {
  try {
    return await open();
  } catch {
    return { kind: "error", error: "unexpected" };
  }
}

async function openPath(folders: FolderAccess, path: string): Promise<OpenOutcome> {
  const status = await folders.inspectFolder(path);
  if (status !== "ok") return { kind: "error", error: status };
  try {
    await folders.prepareProject(path);
  } catch {
    return { kind: "error", error: "project-preparation-failed" };
  }
  return { kind: "opened", project: { name: projectName(path), path } };
}

/** Nom affiché d'un projet : dernier segment du chemin, séparateurs `/` ou `\`. Une racine garde son chemin. */
function projectName(path: string): string {
  const segments = path.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const last = segments.at(-1);
  if (last === undefined || (segments.length === 1 && last.endsWith(":"))) return path;
  return last;
}
