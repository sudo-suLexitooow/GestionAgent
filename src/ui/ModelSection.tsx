import { useEffect, useId, useState, type ReactNode } from "react";
import {
  chargerModele,
  type ChargementModele,
  type ContexteCharge,
  type ErreurFichierModele,
} from "../core/cadre/charger-modele";
import type { ContextType } from "../core/contexts/context";
import { DossierLieError } from "../core/project/dossier-lie";
import { readFailureReason, type ProjectFiles } from "../core/project/ports";
import { t } from "./i18n";

export interface ModelSectionProps {
  root: string;
  files: ProjectFiles;
  /** Modèle chargé (p. ex. pour désactiver l'enregistrement d'un modèle en lecture seule). */
  onLoaded?: (chargement: ChargementModele) => void;
}

/**
 * Modèle `.cadre/` du projet rouvert (US-006) : bandeaux (lecture seule, modèle incomplet, agents
 * ou contextes en erreur, modèle illisible) et contextes du modèle. Rien sans modèle. Lecture
 * seule : rien n'est écrit.
 */
export function ModelSection({ root, files, onLoaded }: ModelSectionProps) {
  /**
   * `null` : chargement en cours ; `echec` : un dossier du modèle n'a pas pu être lu (`dossierLie` :
   * ce dossier, p. ex. `.cadre`, est lui-même un lien, US-079).
   */
  const [chargement, setChargement] = useState<
    ChargementModele | { etat: "echec"; lien: boolean; dossierLie?: string } | null
  >(null);

  useEffect(() => {
    let current = true;
    chargerModele(files, root).then(
      (resultat) => {
        if (!current) return;
        setChargement(resultat);
        onLoaded?.(resultat);
      },
      (erreur: unknown) => {
        if (!current) return;
        const lien = readFailureReason(erreur) === "link";
        setChargement(
          erreur instanceof DossierLieError
            ? { etat: "echec", lien, dossierLie: erreur.chemin }
            : { etat: "echec", lien },
        );
      },
    );
    return () => {
      current = false;
    };
  }, [files, root, onLoaded]);

  if (chargement === null || chargement.etat === "aucun") return null;
  if (chargement.etat === "echec" && chargement.dossierLie !== undefined) {
    return (
      <Banner role="alert">
        {t("model.linkedFolder").replace("{chemin}", chargement.dossierLie)}
      </Banner>
    );
  }
  if (chargement.etat === "echec") {
    return <Banner role="alert">{t(chargement.lien ? "model.failedLink" : "model.failed")}</Banner>;
  }
  if (chargement.etat === "incomplet") return <IncompleteBanner erreur={chargement.erreur} />;
  const enErreur = [
    ...chargement.modele.agents.flatMap((agent) =>
      agent.statut === "erreur" ? [{ quoi: t("model.agentInError"), erreur: agent.erreur }] : [],
    ),
    ...chargement.modele.contextes.flatMap(({ erreur }) =>
      erreur ? [{ quoi: t("model.contextInError"), erreur }] : [],
    ),
  ];
  return (
    <>
      {chargement.lectureSeule && <Banner role="status">{t("model.readOnly")}</Banner>}
      {enErreur.length > 0 && (
        <Banner role="alert">
          {enErreur.map(({ quoi, erreur }) => (
            <p key={erreur.fichier}>
              {quoi} : {describeError(erreur)}
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
