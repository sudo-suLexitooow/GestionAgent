export type DropDecision = { kind: "candidate"; path: string } | { kind: "rejected" };

/**
 * Décide, sans toucher au disque, si un dépôt peut ouvrir un projet : il faut exactement un élément.
 * Que cet élément soit bien un dossier est vérifié ensuite par le port `FolderAccess`.
 */
export function decideDrop(paths: readonly string[]): DropDecision {
  const [path, ...others] = paths;
  if (path === undefined || others.length > 0) return { kind: "rejected" };
  return { kind: "candidate", path };
}
