import {
  ProjectReadError,
  type DirEntry,
  type ProjectFiles,
  type ReadError,
} from "../project/ports";

/**
 * Faux contenu de projet en mémoire, fidèle aux commandes système : un élément absent (ou un fichier
 * à lister comme dossier) donne `null` ; lire un dossier ou un chemin marqué en échec rejette avec un
 * `ProjectReadError`.
 * Clés : chemins relatifs à la racine, séparateur `/` ; une clé finissant par `/` est un dossier vide.
 */
export class InMemoryProjectFiles implements ProjectFiles {
  private readonly files = new Map<string, Uint8Array>();
  private readonly directories = new Set<string>([""]);
  private readonly failures = new Map<string, ReadError>();

  constructor(
    private readonly root: string,
    content: Record<string, string | Uint8Array> = {},
  ) {
    for (const [path, data] of Object.entries(content)) {
      const segments = path.split("/");
      const name = segments.pop() ?? "";
      this.addDirectoryAndParents(segments);
      if (name === "") continue; // clé `dossier/` : dossier vide
      this.files.set(path, typeof data === "string" ? new TextEncoder().encode(data) : data);
    }
  }

  /** Toute lecture de `path` échouera comme pour un élément aux droits insuffisants. */
  makeUnreadable(path: string): this {
    return this.failWith(path, "unreadable");
  }

  /** Toute lecture de `path` échouera avec le motif `reason` (ex. `too-large`). */
  failWith(path: string, reason: ReadError): this {
    this.failures.set(path, reason);
    return this;
  }

  listDir(root: string, path: string): Promise<DirEntry[] | null> {
    const failure = this.failures.get(path);
    if (failure) return reject(failure);
    if (root !== this.root || !this.directories.has(path)) return Promise.resolve(null);
    const prefix = path === "" ? "" : `${path}/`;
    const entries = new Map<string, DirEntry>();
    for (const directory of this.directories) {
      const name = childName(directory, prefix);
      if (name !== null) entries.set(name, { name, kind: "directory" });
    }
    for (const file of this.files.keys()) {
      const name = childName(file, prefix);
      if (name !== null) entries.set(name, { name, kind: "file" });
    }
    return Promise.resolve([...entries.values()]);
  }

  readFile(root: string, path: string): Promise<Uint8Array | null> {
    const failure = this.failures.get(path);
    if (failure) return reject(failure);
    if (this.directories.has(path)) return reject("unreadable");
    if (root !== this.root) return Promise.resolve(null);
    return Promise.resolve(this.files.get(path) ?? null);
  }

  /** Déclare le dossier formé par `segments` et tous ses dossiers parents. */
  private addDirectoryAndParents(segments: string[]): void {
    for (let i = 1; i <= segments.length; i++) {
      this.directories.add(segments.slice(0, i).join("/"));
    }
  }
}

/** Nom de l'enfant direct de `prefix` désigné par `path`, sinon `null`. */
function childName(path: string, prefix: string): string | null {
  if (path === "" || !path.startsWith(prefix)) return null;
  const rest = path.slice(prefix.length);
  return rest.length > 0 && !rest.includes("/") ? rest : null;
}

function reject<T>(error: ReadError): Promise<T> {
  return Promise.reject(new ProjectReadError(error));
}
