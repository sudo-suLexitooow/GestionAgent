import type { DropSource, FolderAccess, FolderStatus, ProjectWarning } from "../project/ports";

/** Faux système de fichiers en mémoire : chaque chemin connu a un état, les autres n'existent pas. */
export class InMemoryFolderAccess implements FolderAccess {
  /** Chemins que le faux sélecteur renverra, dans l'ordre ; `null` simule une annulation. */
  readonly pickerAnswers: (string | null)[] = [];
  /** Chemins vérifiés, dans l'ordre des appels. */
  readonly inspected: string[] = [];

  constructor(private readonly entries: Record<string, FolderStatus> = {}) {}

  answerPickerWith(answer: string | null): this {
    this.pickerAnswers.push(answer);
    return this;
  }

  pickFolder(): Promise<string | null> {
    return Promise.resolve(this.pickerAnswers.shift() ?? null);
  }

  inspectFolder(path: string): Promise<FolderStatus> {
    this.inspected.push(path);
    return Promise.resolve(this.entries[path] ?? "not-found");
  }

  /** Projets préparés côté système, dans l'ordre des appels. */
  readonly preparedProjects: string[] = [];

  private prepareWarning: ProjectWarning | null = null;

  /** La préparation suivante réussit avec cet avertissement (reprise impossible…). */
  warnOnPrepare(warning: ProjectWarning): this {
    this.prepareWarning = warning;
    return this;
  }

  prepareProject(path: string): Promise<ProjectWarning | null> {
    this.preparedProjects.push(path);
    return Promise.resolve(this.prepareWarning);
  }
}

/** Fausse source de dépôts : `drop()` simule un glisser-déposer dans la fenêtre. */
export class InMemoryDropSource implements DropSource {
  private readonly listeners = new Set<(paths: string[]) => void>();

  onDrop(listener: (paths: string[]) => void): Promise<() => void> {
    this.listeners.add(listener);
    return Promise.resolve(() => {
      this.listeners.delete(listener);
    });
  }

  drop(paths: string[]): void {
    for (const listener of this.listeners) listener(paths);
  }
}
