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

export async function openFromPicker(folders: FolderAccess): Promise<OpenOutcome> {
  try {
    const path = await folders.pickFolder();
    if (path === null) return { kind: "cancelled" };
    const status = await folders.inspectFolder(path);
    if (status !== "ok") return { kind: "error", error: status };
    return { kind: "opened", project: { name: projectName(path), path } };
  } catch {
    return { kind: "error", error: "unexpected" };
  }
}

/** Nom affiché d'un projet : dernier segment du chemin, séparateurs `/` ou `\`. Une racine garde son chemin. */
function projectName(path: string): string {
  const segments = path.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const last = segments.at(-1);
  if (last === undefined || (segments.length === 1 && last.endsWith(":"))) return path;
  return last;
}
