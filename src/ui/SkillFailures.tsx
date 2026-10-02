import type { SkillImportFailure } from "../core/skills/import-skills";
import { t } from "./i18n";

/** Skills de l'outil non importées : chemin fautif, raison, nom de la skill (US-004). */
export function SkillFailures({ failures }: { failures: readonly SkillImportFailure[] }) {
  return failures.map((failure) => (
    <p key={failure.folder} role="alert">
      {failure.path} : {t(`import.skills.failure.${failure.code}`)} ;{" "}
      {failure.folder === ""
        ? t("import.skills.noneImported")
        : t("import.skills.notImported").replace("{nom}", failure.folder)}
    </p>
  ));
}
