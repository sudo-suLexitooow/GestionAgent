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

  if (project) {
    return (
      <main>
        <h1>{project.name}</h1>
        <p>{project.path}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{t("app.title")}</h1>
      <button type="button" onClick={() => void openFromPicker(folders).then(show)}>
        {t("home.open")}
      </button>
      <p>{t("home.dropHint")}</p>
      {error && <p role="alert">{t(`error.${error}`)}</p>}
    </main>
  );
}
