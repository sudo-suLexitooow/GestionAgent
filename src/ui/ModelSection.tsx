import { useEffect, useId, useState, type ReactNode } from "react";
import {
  chargerModele,
  type ChargementModele,
  type ContexteCharge,
  type ErreurFichierModele,
} from "../core/cadre/charger-modele";
import type { ContextType } from "../core/contexts/context";
import type { ProjectFiles } from "../core/project/ports";
import { t } from "./i18n";

export interface ModelSectionProps {
  root: string;
  files: ProjectFiles;
}

/**
 * Modèle `.cadre/` du projet rouvert (US-006) : bandeaux (lecture seule, modèle incomplet, agents
 * en erreur) et contextes du modèle. Rien sans modèle, ni si `.cadre/` ne peut pas être lu (la
 * section Skills le signale). Lecture seule : rien n'est écrit.
 */
export function ModelSection({ root, files }: ModelSectionProps) {
  const [chargement, setChargement] = useState<ChargementModele | null>(null);

  useEffect(() => {
    let current = true;
    chargerModele(files, root).then(
      (resultat) => {
        if (current) setChargement(resultat);
      },
      () => {
        if (current) setChargement(null);
      },
    );
    return () => {
      current = false;
    };
  }, [files, root]);

  if (chargement === null || chargement.etat === "aucun") return null;
  if (chargement.etat === "incomplet") return <IncompleteBanner erreur={chargement.erreur} />;
  const enErreur = chargement.modele.agents.flatMap((agent) =>
    agent.statut === "erreur" ? [agent.erreur] : [],
  );
  return (
    <>
      {chargement.lectureSeule && <Banner role="status">{t("model.readOnly")}</Banner>}
      {enErreur.length > 0 && (
        <Banner role="alert">
          {enErreur.map((erreur) => (
            <p key={erreur.fichier}>
              {t("model.agentInError")} : {describeError(erreur)}
            </p>
          ))}
        </Banner>
      )}
      <ModelContexts contextes={chargement.modele.contextes} />
    </>
  );
}

function IncompleteBanner({ erreur }: { erreur: ErreurFichierModele }) {
  return (
    <Banner role="alert">
      <p>
        {t("model.incomplete")} : {describeError(erreur)}.
      </p>
      <p>{t("model.repair")}</p>
    </Banner>
  );
}

function Banner({ role, children }: { role: "status" | "alert"; children: ReactNode }) {
  return (
    <div role={role} aria-label={t("model.title")}>
      {children}
    </div>
  );
}

/** « fichier, ligne N : raison », la ligne seulement si elle est connue. */
function describeError({ fichier, code, ligne }: ErreurFichierModele): string {
  const ou = ligne === undefined ? fichier : `${fichier}, ${t("skills.line")} ${String(ligne)}`;
  return `${ou} : ${t(`model.error.${code}`)}`;
}

function ModelContexts({ contextes }: { contextes: ContexteCharge[] }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("contexts.title")}</h2>
      <ul>
        {contextes.map((contexte) => (
          <li key={String(contexte.entree.name)}>{describeContext(contexte)}</li>
        ))}
      </ul>
    </section>
  );
}

const TYPES: readonly ContextType[] = ["projet", "conventions", "architecture", "autre"];

/** « titre — type », suivi de « lecture seule » pour un miroir (ADR-001, D2). */
function describeContext({ entree }: ContexteCharge): string {
  const titre = typeof entree.title === "string" ? entree.title : String(entree.name);
  const type = TYPES.find((candidat) => candidat === entree.type) ?? "autre";
  const parts = [titre, t(`contexts.type.${type}`)];
  if (entree.readonly === true) parts.push(t("contexts.readonly"));
  return parts.join(" — ");
}
