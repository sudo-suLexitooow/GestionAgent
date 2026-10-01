import { useId, useState, type SyntheticEvent } from "react";
import type { ToolAdapter } from "../core/adapters/adapter";
import {
  creerAgent,
  type AgentNouveau,
  type AvertissementAgent,
  type RefusCreation,
} from "../core/agents/agent";
import { t } from "./i18n";

export interface AgentsSectionProps {
  /** Noms des agents du modèle enregistré (fichiers `.cadre/agents/<nom>.yaml`). */
  enregistres: readonly string[];
  /** Agents créés depuis l'ouverture, pas encore enregistrés. */
  nouveaux: readonly AgentNouveau[];
  /** Outils qui ont un adaptateur : seules cibles proposées (AC-007-2). */
  adaptateurs: readonly ToolAdapter[];
  /** Modèle non chargé, incomplet ou en lecture seule : aucune création. */
  desactive: boolean;
  onCreate: (agent: AgentNouveau) => void;
}

type Retour = { refus: RefusCreation } | { avertissement: AvertissementAgent } | null;

/** Agents du projet (enregistrés et non enregistrés) et formulaire « Nouvel agent » (US-007). */
export function AgentsSection({
  enregistres,
  nouveaux,
  adaptateurs,
  desactive,
  onCreate,
}: AgentsSectionProps) {
  const headingId = useId();
  const formId = useId();
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [cible, setCible] = useState(adaptateurs[0]?.id ?? "");
  const [retour, setRetour] = useState<Retour>(null);

  function soumettre(evenement: SyntheticEvent) {
    evenement.preventDefault();
    const creation = creerAgent(
      { nom, role, description, cible },
      {
        nomsExistants: [...enregistres, ...nouveaux.map((agent) => agent.name)],
        cibles: adaptateurs.map((adaptateur) => adaptateur.id),
      },
    );
    if (!creation.ok) {
      setRetour({ refus: creation.refus });
      return;
    }
    onCreate(creation.agent);
    const [avertissement] = creation.avertissements;
    setRetour(avertissement ? { avertissement } : null);
    setNom("");
    setRole("");
    setDescription("");
  }

  const lignes = [
    ...enregistres.map((nomAgent) => ({ nom: nomAgent, texte: nomAgent })),
    ...nouveaux.map(({ name }) => ({ nom: name, texte: `${name} — ${t("agents.unsaved")}` })),
  ].sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t("agents.title")}</h2>
      <ul>
        {lignes.map((ligne) => (
          <li key={ligne.nom}>{ligne.texte}</li>
        ))}
      </ul>
      <form aria-labelledby={formId} onSubmit={soumettre}>
        <h3 id={formId}>{t("agents.new")}</h3>
        <fieldset disabled={desactive}>
          <label>
            {t("agents.name")}
            <input
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
              }}
            />
          </label>
          <label>
            {t("agents.role")}
            <input
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
              }}
            />
          </label>
          <label>
            {t("agents.description")}
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </label>
          <label>
            {t("agents.target")}
            <select
              value={cible}
              onChange={(e) => {
                setCible(e.target.value);
              }}
            >
              {adaptateurs.map((adaptateur) => (
                <option key={adaptateur.id} value={adaptateur.id}>
                  {adaptateur.name ?? adaptateur.id}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">{t("agents.create")}</button>
        </fieldset>
        {retour && "refus" in retour && <p role="alert">{t(`agents.refus.${retour.refus}`)}</p>}
        {retour && "avertissement" in retour && (
          <p role="status">{t(`agents.warning.${retour.avertissement}`)}</p>
        )}
      </form>
    </section>
  );
}
