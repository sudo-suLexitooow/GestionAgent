import type { ProjectFiles } from "../project/ports";

/**
 * Enveloppe un accès au projet et note le nom de chaque membre utilisé, y compris un membre qui
 * n'existe pas (ex. une méthode d'écriture) : prouve qu'une opération n'a fait que lire.
 */
export function recordingProjectFiles(files: ProjectFiles): {
  files: ProjectFiles;
  used: Set<string>;
} {
  const used = new Set<string>();
  const recorded = new Proxy(files, {
    get(target, property, receiver) {
      used.add(String(property));
      const value: unknown = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return (value as (...args: unknown[]) => unknown).bind(target);
    },
  });
  return { files: recorded, used };
}
