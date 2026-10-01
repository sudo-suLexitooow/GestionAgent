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

/** `hidden` : rien à proposer, racine illisible, ou import refusé (plus reproposé dans la session). */
type State =
  | { kind: "detecting" }
  | { kind: "hidden" }
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
        if (current) setState(specs.length > 0 ? { kind: "proposed", specs } : { kind: "hidden" });
      },
      () => {
        if (current) setState({ kind: "hidden" });
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

  if (state.kind === "detecting" || state.kind === "hidden") return null;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("contexts.title")}</h2>
      {state.kind === "proposed" && (
        <Proposal
          specs={state.specs}
          onAccept={() => {
            accept(state.specs);
          }}
          onDecline={() => {
            setState({ kind: "hidden" });
          }}
        />
      )}
      {state.kind === "imported" && <Imported result={state.result} />}
    </section>
  );
}

interface ProposalProps {
  specs: ContextFileSpec[];
  onAccept: () => void;
  onDecline: () => void;
}

/** Fichiers détectés et choix d'importer ou non. */
function Proposal({ specs, onAccept, onDecline }: ProposalProps) {
  return (
    <>
      <p>{t("contexts.detected")}</p>
      <ul>
        {specs.map((spec) => (
          <li key={spec.file}>{spec.file}</li>
        ))}
      </ul>
      <button type="button" onClick={onAccept}>
        {t("contexts.import")}
      </button>
      <button type="button" onClick={onDecline}>
        {t("contexts.decline")}
      </button>
    </>
  );
}

/** Contextes importés en mémoire, avertissements, et rappel qu'ils ne sont pas enregistrés. */
function Imported({ result }: { result: ContextImport }) {
  return (
    <>
      <ul>
        {result.contexts.map((context) => (
          <li key={context.entry.name}>{describe(context)}</li>
        ))}
      </ul>
      {result.warnings.map((warning) => (
        <p key={warning.source} role="alert">
          {warning.source} : {t(`contexts.warning.${warning.code}`)}
        </p>
      ))}
      <p>{t("contexts.unsaved")}</p>
    </>
  );
}

/** « titre — type », suivi de « lecture seule » pour un miroir importé (AGENTS.md). */
function describe({ entry }: ImportedContext): string {
  const parts = [entry.title, t(`contexts.type.${entry.type}`)];
  if (entry.readonly) parts.push(t("contexts.readonly"));
  return parts.join(" — ");
}
