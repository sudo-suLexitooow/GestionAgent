import { useEffect, useState } from "react";
import {
  openFromDrop,
  openFromPicker,
  type OpenError,
  type OpenOutcome,
  type Project,
} from "../core/project/open-project";
import type { DropSource, FolderAccess } from "../core/project/ports";
import { tauriDropSource, tauriFolderAccess } from "../platform/tauri-project-ports";
import { t } from "./i18n";

export interface AppProps {
  /** Ports injectés : les vrais (Tauri) par défaut, des faux en mémoire dans les tests. */
  folders?: FolderAccess;
  drops?: DropSource;
}

export function App({ folders = tauriFolderAccess, drops = tauriDropSource }: AppProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<OpenError | null>(null);

  function show(outcome: OpenOutcome) {
    if (outcome.kind === "opened") setProject(outcome.project);
    setError(outcome.kind === "error" ? outcome.error : null);
  }

  // Le dépôt d'un dossier n'est écouté que sur l'accueil.
  useEffect(() => {
    if (project) return;
    const subscription = drops.onDrop((paths) => {
      void openFromDrop(folders, paths).then(show);
    });
    return () => {
      void subscription.then((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [drops, folders, project]);

  if (project) return <ProjectScreen project={project} />;
  return <HomeScreen error={error} onOpen={() => void openFromPicker(folders).then(show)} />;
}

function HomeScreen({ error, onOpen }: { error: OpenError | null; onOpen: () => void }) {
  return (
    <main>
      <h1>{t("app.title")}</h1>
      <button type="button" onClick={onOpen}>
        {t("home.open")}
      </button>
      <p>{t("home.dropHint")}</p>
      {error && <p role="alert">{t(`error.${error}`)}</p>}
    </main>
  );
}

function ProjectScreen({ project }: { project: Project }) {
  return (
    <main>
      <h1>{project.name}</h1>
      <p>
        {t("project.path")} : <code>{project.path}</code>
      </p>
    </main>
  );
}
