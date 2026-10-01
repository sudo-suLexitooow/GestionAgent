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
  const path = (await folders.pickFolder()) ?? "";
  return { kind: "opened", project: { name: path.split("/").pop() ?? path, path } };
}
