import { useEffect, useId, useState } from "react";
import type { ToolAdapter } from "../core/adapters/adapter";
import type { ContextFileSpec, ImportedContext } from "../core/contexts/context";
import {
  detectContextFiles,
  importContexts,
  type ContextImport,
} from "../core/contexts/import-contexts";
import type { ProjectFiles } from "../core/project/ports";
import { t } from "./i18n";

type State =
  | { kind: "detecting" }
  | { kind: "none" }
  | { kind: "proposed"; specs: ContextFileSpec[] }
  | { kind: "imported"; result: ContextImport };

export interface ContextsSectionProps {
  root: string;
  files: ProjectFiles;
  adapter: ToolAdapter;
}

/**
 * Proposition d'import de CLAUDE.md et AGENTS.md, puis contextes importés en mémoire (PRJ-02).
 * Lecture seule : l'enregistrement dans `.cadre/` arrive avec US-005 / US-006.
 */
export function ContextsSection({ root, files, adapter }: ContextsSectionProps) {
  const headingId = useId();
  const [state, setState] = useState<State>({ kind: "detecting" });

  useEffect(() => {
    let current = true;
    // Racine illisible : rien à proposer, sans planter.
    void detectContextFiles(files, root, adapter).then(
      (specs) => {
        if (current) setState(specs.length > 0 ? { kind: "proposed", specs } : { kind: "none" });
      },
      () => {
        if (current) setState({ kind: "none" });
      },
    );
    return () => {
      current = false;
    };
  }, [adapter, files, root]);

  function accept(specs: ContextFileSpec[]) {
    void importContexts(files, root, specs).then((result) => {
      setState({ kind: "imported", result });
    });
  }

  if (state.kind === "detecting" || state.kind === "none") return null;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("contexts.title")}</h2>
      {state.kind === "proposed" && (
        <>
          <p>{t("contexts.detected")}</p>
          <ul>
            {state.specs.map((spec) => (
              <li key={spec.file}>{spec.file}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              accept(state.specs);
            }}
          >
            {t("contexts.import")}
          </button>
          <button
            type="button"
            onClick={() => {
              setState({ kind: "none" });
            }}
          >
            {t("contexts.decline")}
          </button>
        </>
      )}
      {state.kind === "imported" && (
        <>
          <ul>
            {state.result.contexts.map((context) => (
              <li key={context.entry.name}>{describe(context)}</li>
            ))}
          </ul>
          {state.result.warnings.map((warning) => (
            <p key={warning.source} role="alert">
              {warning.source} : {t(`contexts.warning.${warning.code}`)}
            </p>
          ))}
          <p>{t("contexts.unsaved")}</p>
        </>
      )}
    </section>
  );
}

function describe({ entry }: ImportedContext): string {
  const parts = [entry.title, t(`contexts.type.${entry.type}`)];
  if (entry.readonly) parts.push(t("contexts.readonly"));
  return parts.join(" — ");
}
