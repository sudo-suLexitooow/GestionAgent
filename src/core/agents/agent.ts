// Création d'un agent du modèle `.cadre/` (US-007, ADR-001 D3).
import { stringify } from "yaml";
import type { FichierAEcrire } from "../fichiers/systeme-fichiers";

export interface SaisieAgent {
  nom: string;
  role: string;
  description: string;
  cible: string;
}

/** Agent créé, champs de `agents/<name>.yaml` (ADR-001, D3). */
export interface AgentNouveau {
  /** UUID v4, identité stable : jamais modifié. */
  id: string;
  name: string;
  role: string;
  description: string;
  target: string;
}

export interface ContexteCreation {
  nomsExistants: readonly string[];
  cibles: readonly string[];
  /** Générateur d'UUID v4, injectable pour les tests. */
  genererId?: () => string;
}

export type ResultatCreation =
  { ok: true; agent: AgentNouveau; avertissements: string[] } | { ok: false; refus: string };

export function creerAgent(saisie: SaisieAgent, contexte: ContexteCreation): ResultatCreation {
  const genererId = contexte.genererId ?? (() => crypto.randomUUID());
  return {
    ok: true,
    agent: {
      id: genererId(),
      name: saisie.nom,
      role: saisie.role,
      description: saisie.description,
      target: saisie.cible,
    },
    avertissements: [],
  };
}

/** `agents/<name>.yaml` : UTF-8 sans BOM, LF, indentation 2, ligne finale (ADR-001, D1). */
export function fichiersAgent(agent: AgentNouveau): FichierAEcrire[] {
  const contenu = stringify(agent, { indent: 2, indentSeq: true, lineWidth: 0 });
  return [{ chemin: `.cadre/agents/${agent.name}.yaml`, contenu }];
}
