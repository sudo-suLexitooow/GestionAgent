import { useId } from "react";
import type { ErreurEnregistrement } from "../core/cadre/enregistrer";
import { t } from "./i18n";

export interface SaveBarProps {
  /** Quelque chose à enregistrer (contextes importés non enregistrés). */
  modifie: boolean;
  /** Modèle d'un format plus récent : rien ne doit y être écrit (AC-006-2). */
  lectureSeule: boolean;
  enCours: boolean;
  erreur: ErreurEnregistrement | null;
  onSave: () => void;
}

/** Bouton « Enregistrer » de l'écran principal, état en cours et erreur (US-077). */
export function SaveBar({ modifie, lectureSeule, enCours, erreur, onSave }: SaveBarProps) {
  const explicationId = useId();
  return (
    <div>
      <button
        type="button"
        onClick={onSave}
        disabled={lectureSeule || enCours || !modifie}
        aria-describedby={lectureSeule ? explicationId : undefined}
      >
        {t("save.button")}
      </button>
      {lectureSeule && <p id={explicationId}>{t("save.readOnly")}</p>}
      {enCours && (
        <p role="status" aria-label={t("save.title")}>
          {t("save.saving")}
        </p>
      )}
      {erreur && <SaveError erreur={erreur} />}
    </div>
  );
}

function SaveError({ erreur }: { erreur: ErreurEnregistrement }) {
  if (erreur.code === "SOURCE_MODIFIEE") {
    return (
      <p role="alert" aria-label={t("save.title")}>
        {erreur.detail} {t("save.error.SOURCE_MODIFIEE")}
      </p>
    );
  }
  return (
    <div role="alert" aria-label={t("save.title")}>
      <p>{t(`save.error.${erreur.code}`)}</p>
      {erreur.detail && (
        <p>
          {t("save.detail")} : <code>{erreur.detail}</code>
        </p>
      )}
    </div>
  );
}
