import { useEffect, useId, useState } from "react";
import type { ToolAdapter } from "../core/adapters/adapter";
import { DossierLieError } from "../core/project/dossier-lie";
import type { ProjectFiles } from "../core/project/ports";
import { listProjectSkills } from "../core/skills/list-project-skills";
import type { ListedSkill, SkillIssue } from "../core/skills/skill";
import { t } from "./i18n";

/** `failed` : lecture impossible ; `lien` : le dossier lié qui l'a empêchée (US-079). */
type Listing =
  | { kind: "loading" }
  | { kind: "listed"; skills: ListedSkill[] }
  | { kind: "failed"; lien?: string };

export interface SkillsSectionProps {
  root: string;
  files: ProjectFiles;
  adapter: ToolAdapter;
}

/** Skills du projet ouvert : nom et description, ou « en erreur » avec la raison (SKL-01). */
export function SkillsSection({ root, files, adapter }: SkillsSectionProps) {
  const headingId = useId();
  const [listing, setListing] = useState<Listing>({ kind: "loading" });

  useEffect(() => {
    let current = true;
    listProjectSkills(files, root, adapter).then(
      (skills) => {
        if (current) setListing({ kind: "listed", skills });
      },
      (erreur: unknown) => {
        if (!current) return;
        setListing(
          erreur instanceof DossierLieError
            ? { kind: "failed", lien: erreur.chemin }
            : { kind: "failed" },
        );
      },
    );
    return () => {
      current = false;
    };
  }, [adapter, files, root]);

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("skills.title")}</h2>
      {listing.kind === "failed" && (
        <p role="alert">
          {listing.lien === undefined
            ? t("skills.failed")
            : t("skills.linkedFolder").replace("{chemin}", listing.lien)}
        </p>
      )}
      {listing.kind === "listed" && listing.skills.length === 0 && <p>{t("skills.none")}</p>}
      {listing.kind === "listed" && listing.skills.length > 0 && (
        <ul>
          {listing.skills.map((skill) => (
            <li key={skill.folder}>{describe(skill)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function describe(skill: ListedSkill): string {
  if (skill.status === "ok") return `${skill.name} — ${skill.description}`;
  return `${skill.folder} — ${t("skills.inError")} : ${reason(skill.issue)}`;
}

function reason(issue: SkillIssue): string {
  const text = t(`skills.issue.${issue.code}`);
  return issue.line === undefined ? text : `${text} (${t("skills.line")} ${String(issue.line)})`;
}
