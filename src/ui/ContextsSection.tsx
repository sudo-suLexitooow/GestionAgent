import { useEffect, useId, useState } from "react";
import type { ToolAdapter } from "../core/adapters/adapter";
import type { ImportedContext } from "../core/contexts/context";
import {
  detecterImport,
  importerProjet,
  type ImportPropose,
  type ProjetImporte,
} from "../core/import/importer-projet";
import type { ProjectFiles } from "../core/project/ports";
import { t } from "./i18n";
import { SkillFailures } from "./SkillFailures";

/** `hidden` : rien à proposer, racine illisible, ou import refusé (plus reproposé dans la session). */
type State =
  | { kind: "detecting" }
  | { kind: "hidden" }
  | { kind: "proposed"; propose: ImportPropose }
  | { kind: "imported"; result: ProjetImporte };

export interface ContextsSectionProps {
  root: string;
  files: ProjectFiles;
  adapter: ToolAdapter;
  /** Contextes et skills importés en mémoire, à enregistrer (US-077, US-004). */
  onImported?: (result: ProjetImporte) => void;
}

/**
 * Proposition d'import de CLAUDE.md, AGENTS.md et des skills de l'outil, puis contextes et skills
 * importés en mémoire (PRJ-02).
 * Lecture seule : l'enregistrement dans `.cadre/` est fait par l'écran principal (US-077).
 */
export function ContextsSection({ root, files, adapter, onImported }: ContextsSectionProps) {
  const headingId = useId();
  const [state, setState] = useState<State>({ kind: "detecting" });

  useEffect(() => {
    let current = true;
    // Racine illisible : rien à proposer, sans planter.
    void detecterImport(files, root, adapter).then(
      (propose) => {
        if (!current) return;
        const rien = propose.specs.length === 0 && propose.skills === 0;
        setState(rien ? { kind: "hidden" } : { kind: "proposed", propose });
      },
      () => {
        if (current) setState({ kind: "hidden" });
      },
    );
    return () => {
      current = false;
    };
  }, [adapter, files, root]);

  function accept({ specs }: ImportPropose) {
    void importerProjet(files, root, adapter, specs).then((result) => {
      setState({ kind: "imported", result });
      onImported?.(result);
    });
  }

  if (state.kind === "detecting" || state.kind === "hidden") return null;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("contexts.title")}</h2>
      {state.kind === "proposed" && (
        <Proposal
          propose={state.propose}
          onAccept={() => {
            accept(state.propose);
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
  propose: ImportPropose;
  onAccept: () => void;
  onDecline: () => void;
}

/** Fichiers et skills détectés, et choix d'importer ou non. */
function Proposal({ propose: { specs, skills }, onAccept, onDecline }: ProposalProps) {
  return (
    <>
      <p>{t("contexts.detected")}</p>
      {specs.length > 0 && (
        <ul>
          {specs.map((spec) => (
            <li key={spec.file}>{spec.file}</li>
          ))}
        </ul>
      )}
      {skills > 0 && <p>{`${t("import.skills.detected")} : ${String(skills)}`}</p>}
      <button type="button" onClick={onAccept}>
        {t("contexts.import")}
      </button>
      <button type="button" onClick={onDecline}>
        {t("contexts.decline")}
      </button>
    </>
  );
}

/** Contextes et skills importés en mémoire, avertissements, et rappel qu'ils ne sont pas enregistrés. */
function Imported({ result }: { result: ProjetImporte }) {
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
      {result.skills.skills.length > 0 && (
        <p>{`${t("import.skills.imported")} : ${String(result.skills.skills.length)}`}</p>
      )}
      <SkillFailures failures={result.skills.failures} />
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
