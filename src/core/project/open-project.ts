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

export function openFromPicker(_folders: FolderAccess): Promise<OpenOutcome> {
  return Promise.resolve({ kind: "cancelled" });
}
