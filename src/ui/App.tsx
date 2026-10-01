import { useState } from "react";
import { openFromPicker, type OpenError, type Project } from "../core/project/open-project";
import type { DropSource, FolderAccess } from "../core/project/ports";
import { tauriFolderAccess } from "../platform/tauri-project-ports";
import { t } from "./i18n";

export interface AppProps {
  folders?: FolderAccess;
  drops?: DropSource;
}

export function App({ folders = tauriFolderAccess }: AppProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<OpenError | null>(null);

  async function handleOpen() {
    const outcome = await openFromPicker(folders);
    if (outcome.kind === "opened") setProject(outcome.project);
    setError(outcome.kind === "error" ? outcome.error : null);
  }

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
      <button type="button" onClick={() => void handleOpen()}>
        {t("home.open")}
      </button>
      {error && <p role="alert">{t(`error.${error}`)}</p>}
    </main>
  );
}
