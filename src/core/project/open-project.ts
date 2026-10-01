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
  | "unexpected";

export type OpenOutcome =
  | { kind: "opened"; project: Project }
  | { kind: "cancelled" }
  | { kind: "error"; error: OpenError };

/** Ouvre le dossier choisi dans le sélecteur (AC-001-1, AC-001-4, AC-001-5). */
export async function openFromPicker(folders: FolderAccess): Promise<OpenOutcome> {
  try {
    const path = await folders.pickFolder();
    if (path === null) return { kind: "cancelled" };
    return await openPath(folders, path);
  } catch {
    return { kind: "error", error: "unexpected" };
  }
}

/** Ouvre le dossier déposé dans la fenêtre ; un fichier ou plusieurs éléments sont refusés (AC-001-2, AC-001-3). */
export async function openFromDrop(
  folders: FolderAccess,
  paths: readonly string[],
): Promise<OpenOutcome> {
  const decision = decideDrop(paths);
  if (decision.kind === "rejected") return { kind: "error", error: "drop-single-folder" };
  try {
    const outcome = await openPath(folders, decision.path);
    if (outcome.kind === "error" && outcome.error === "not-a-directory") {
      return { kind: "error", error: "drop-single-folder" };
    }
    return outcome;
  } catch {
    return { kind: "error", error: "unexpected" };
  }
}

async function openPath(folders: FolderAccess, path: string): Promise<OpenOutcome> {
  const status = await folders.inspectFolder(path);
  if (status !== "ok") return { kind: "error", error: status };
  return { kind: "opened", project: { name: projectName(path), path } };
}

/** Nom affiché d'un projet : dernier segment du chemin, séparateurs `/` ou `\`. Une racine garde son chemin. */
function projectName(path: string): string {
  const segments = path.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const last = segments.at(-1);
  if (last === undefined || (segments.length === 1 && last.endsWith(":"))) return path;
  return last;
}
