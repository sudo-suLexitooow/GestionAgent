import { useId, useRef, useState } from "react";
import type { ConfirmationEcrasement, ErreurExport, ResultatExport } from "../core/export/exporter";
import { t } from "./i18n";

export interface ExportBarProps {
  /** Nom de l'outil cible affiché sur le bouton. */
  outil: string;
  /** Modèle chargé et modifiable : sinon, rien à exporter. */
  disponible: boolean;
  /** Modifications non enregistrées : l'export ne les verrait pas, il est désactivé. */
  nonEnregistre: boolean;
  /** Lance l'export avec les écrasements confirmés, chacun pour un contenu précis (AC-008-4). */
  exporter: (confirmations: readonly ConfirmationEcrasement[]) => Promise<ResultatExport>;
  /** Empreintes actuelles des fichiers, lues quand la confirmation s'affiche. */
  lireEmpreintes: (chemins: readonly string[]) => Promise<ConfirmationEcrasement[]>;
}

type Etat =
  | { etape: "repos" }
  | { etape: "en-cours" }
  | { etape: "fait"; fichiers: string[] }
  | { etape: "a-confirmer"; fichiers: string[]; empreintes: ConfirmationEcrasement[] }
  | { etape: "annule" }
  | { etape: "erreur"; erreur: ErreurExport };

/** Bouton « Exporter vers <outil> », confirmation d'écrasement et résultat (US-008). */
export function ExportBar({
  outil,
  disponible,
  nonEnregistre,
  exporter,
  lireEmpreintes,
}: ExportBarProps) {
  const [etat, setEtat] = useState<Etat>({ etape: "repos" });
  // Garde synchrone : deux clics avant le rendu suivant ne lancent qu'un export.
  const enCours = useRef(false);
  const explicationId = useId();

  async function lancer(confirmations: readonly ConfirmationEcrasement[]) {
    if (enCours.current) return;
    enCours.current = true;
    setEtat({ etape: "en-cours" });
    let suivant: Etat;
    try {
      const resultat = await exporter(confirmations);
      if (resultat.ok) suivant = { etape: "fait", fichiers: resultat.fichiers };
      else if (resultat.aConfirmer) {
        // La confirmation ne vaudra que pour le contenu présent quand elle s'affiche.
        const empreintes = await lireEmpreintes(resultat.aConfirmer);
        suivant = { etape: "a-confirmer", fichiers: resultat.aConfirmer, empreintes };
      } else suivant = { etape: "erreur", erreur: resultat.erreur };
    } catch (exception) {
      // Filet : le cœur ne rejette pas, mais le bouton ne doit jamais rester bloqué.
      const detail = exception instanceof Error ? exception.message : String(exception);
      suivant = { etape: "erreur", erreur: { code: "ECHEC", detail } };
    } finally {
      enCours.current = false;
    }
    setEtat(suivant);
  }

  const occupe = etat.etape === "en-cours" || etat.etape === "a-confirmer";
  return (
    <div>
      <button
        type="button"
        disabled={!disponible || nonEnregistre || occupe}
        aria-describedby={nonEnregistre ? explicationId : undefined}
        onClick={() => void lancer([])}
      >
        {t("export.button").replace("{outil}", outil)}
      </button>
      {nonEnregistre && <p id={explicationId}>{t("export.unsaved")}</p>}
      {etat.etape === "fait" && (
        <div role="status" aria-label={t("export.title")}>
          <p>{t("export.done")}</p>
          <ListeFichiers fichiers={etat.fichiers} />
        </div>
      )}
      {etat.etape === "annule" && (
        <p role="status" aria-label={t("export.title")}>
          {t("export.cancelled")}
        </p>
      )}
      {etat.etape === "a-confirmer" && (
        <Confirmation
          fichiers={etat.fichiers}
          onEcraser={() => void lancer(etat.empreintes)}
          onAnnuler={() => {
            setEtat({ etape: "annule" });
          }}
        />
      )}
      {etat.etape === "erreur" && <ErreurExportAffichee erreur={etat.erreur} />}
    </div>
  );
}

function ListeFichiers({ fichiers }: { fichiers: readonly string[] }) {
  return (
    <ul>
      {fichiers.map((fichier) => (
        <li key={fichier}>
          <code>{fichier}</code>
        </li>
      ))}
    </ul>
  );
}

function Confirmation({
  fichiers,
  onEcraser,
  onAnnuler,
}: {
  fichiers: readonly string[];
  onEcraser: () => void;
  onAnnuler: () => void;
}) {
  const titreId = useId();
  return (
    <div role="alertdialog" aria-labelledby={titreId}>
      <h3 id={titreId}>{t("export.confirm.title")}</h3>
      <p>{t("export.confirm.intro")}</p>
      <ListeFichiers fichiers={fichiers} />
      <button type="button" onClick={onEcraser}>
        {t("export.confirm.overwrite")}
      </button>
      <button type="button" onClick={onAnnuler}>
        {t("export.confirm.cancel")}
      </button>
    </div>
  );
}

function ErreurExportAffichee({ erreur }: { erreur: ErreurExport }) {
  return (
    <div role="alert" aria-label={t("export.title")}>
      <p>{t(`export.error.${erreur.code}`)}</p>
      {erreur.detail && (
        <p>
          {t("export.detail")} : <code>{erreur.detail}</code>
        </p>
      )}
    </div>
  );
}
