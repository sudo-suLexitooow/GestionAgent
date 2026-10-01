import { useEffect, useId, useState } from "react";
import type { ToolAdapter } from "../core/adapters/adapter";
import type { ContextFileSpec } from "../core/contexts/context";
import { detectContextFiles } from "../core/contexts/import-contexts";
import type { ProjectFiles } from "../core/project/ports";
import { t } from "./i18n";

type State =
  { kind: "detecting" } | { kind: "none" } | { kind: "proposed"; specs: ContextFileSpec[] };

export interface ContextsSectionProps {
  root: string;
  files: ProjectFiles;
  adapter: ToolAdapter;
}

/** Proposition d'import de CLAUDE.md et AGENTS.md, puis contextes importés (PRJ-02). */
export function ContextsSection({ root, files, adapter }: ContextsSectionProps) {
  const headingId = useId();
  const [state, setState] = useState<State>({ kind: "detecting" });

  useEffect(() => {
    let current = true;
    void detectContextFiles(files, root, adapter).then((specs) => {
      if (current) setState(specs.length > 0 ? { kind: "proposed", specs } : { kind: "none" });
    });
    return () => {
      current = false;
    };
  }, [adapter, files, root]);

  if (state.kind !== "proposed") return null;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("contexts.title")}</h2>
      <p>{t("contexts.detected")}</p>
      <ul>
        {state.specs.map((spec) => (
          <li key={spec.file}>{spec.file}</li>
        ))}
      </ul>
      <button type="button">{t("contexts.import")}</button>
      <button type="button">{t("contexts.decline")}</button>
    </section>
  );
}
