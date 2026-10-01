import type { DropSource, FolderAccess } from "../core/project/ports";
import { t } from "./i18n";

export interface AppProps {
  folders?: FolderAccess;
  drops?: DropSource;
}

export function App(_props: AppProps) {
  return (
    <main>
      <h1>{t("app.title")}</h1>
      <button type="button">{t("home.open")}</button>
    </main>
  );
}
