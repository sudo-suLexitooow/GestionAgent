// Création d'un agent du modèle `.cadre/` (US-007, ADR-001 D3).
import type { FichierAEcrire } from "../fichiers/systeme-fichiers";

export interface SaisieAgent {
  nom: string;
  role: string;
  description: string;
  cible: string;
}

export interface AgentNouveau {
  id: string;
  name: string;
  role: string;
  description: string;
  target: string;
}

export interface ContexteCreation {
  nomsExistants: readonly string[];
  cibles: readonly string[];
  genererId?: () => string;
}

export type ResultatCreation =
  { ok: true; agent: AgentNouveau; avertissements: string[] } | { ok: false; refus: string };

export function creerAgent(_saisie: SaisieAgent, _contexte: ContexteCreation): ResultatCreation {
  return { ok: false, refus: "NON_IMPLEMENTE" };
}

export function fichiersAgent(_agent: AgentNouveau): FichierAEcrire[] {
  return [];
}
