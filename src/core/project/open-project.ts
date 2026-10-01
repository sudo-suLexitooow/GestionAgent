import type { FolderAccess } from "./ports";

export interface Project {
  name: string;
  path: string;
}

export type OpenError = "not-found" | "unreadable" | "not-a-directory" | "drop-single-folder";

export type OpenOutcome =
  | { kind: "opened"; project: Project }
  | { kind: "cancelled" }
  | { kind: "error"; error: OpenError };

export async function openFromPicker(folders: FolderAccess): Promise<OpenOutcome> {
  const path = await folders.pickFolder();
  if (path === null) return { kind: "cancelled" };
  const status = await folders.inspectFolder(path);
  if (status !== "ok") return { kind: "error", error: status };
  return { kind: "opened", project: { name: path.split("/").pop() ?? path, path } };
}
