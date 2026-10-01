// Création d'un agent du modèle `.cadre/` (US-007, ADR-001 D3).
import { stringify } from "yaml";
import { CARACTERES_INTERDITS, NOMS_RESERVES } from "../fichiers/nom-portable";
import type { FichierAEcrire } from "../fichiers/systeme-fichiers";
import schemaCadre from "../schemas/v1/cadre.json";

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

/** Règle de nom violée (ADR-001, R1 et R2), dans l'ordre où elles sont vérifiées. */
export type RegleNomAgent =
  "NOM_VIDE" | "NOM_CARACTERES_INTERDITS" | "NOM_RESERVE" | "NOM_FORMAT" | "NOM_EXISTANT";

/** Refus de création : règle de nom violée, ou outil cible sans adaptateur (AC-007-2). */
export type RefusCreation = RegleNomAgent | "CIBLE_INDISPONIBLE";

/** Rôle ou description vide : un outil peut refuser de charger l'agent exporté (ADR-003). */
export type AvertissementAgent = "DESCRIPTION_MANQUANTE";

export type ResultatCreation =
  | { ok: true; agent: AgentNouveau; avertissements: AvertissementAgent[] }
  | { ok: false; refus: RefusCreation };

const NOM_CADRE = new RegExp(schemaCadre.$defs.cadreName.pattern, "u");

/**
 * Première règle violée par `nom` (R1, R2), `null` s'il est valide. L'unicité est insensible à la
 * casse (AC-007-3) : APFS et NTFS ne distinguent pas `Frontend` de `frontend`.
 */
export function regleNomAgentViolee(
  nom: string,
  nomsExistants: readonly string[],
): RegleNomAgent | null {
  if (nom === "") return "NOM_VIDE";
  if (CARACTERES_INTERDITS.test(nom)) return "NOM_CARACTERES_INTERDITS";
  if (NOMS_RESERVES.test(nom)) return "NOM_RESERVE";
  if (!NOM_CADRE.test(nom)) return "NOM_FORMAT";
  const replie = nom.toLowerCase();
  if (nomsExistants.some((existant) => existant.toLowerCase() === replie)) return "NOM_EXISTANT";
  return null;
}

export function creerAgent(saisie: SaisieAgent, contexte: ContexteCreation): ResultatCreation {
  const regle = regleNomAgentViolee(saisie.nom, contexte.nomsExistants);
  if (regle) return { ok: false, refus: regle };
  if (!contexte.cibles.includes(saisie.cible)) return { ok: false, refus: "CIBLE_INDISPONIBLE" };
  const genererId = contexte.genererId ?? (() => crypto.randomUUID());
  const incomplet = saisie.role.trim() === "" || saisie.description.trim() === "";
  return {
    ok: true,
    agent: {
      id: genererId(),
      name: saisie.nom,
      role: saisie.role,
      description: saisie.description,
      target: saisie.cible,
    },
    avertissements: incomplet ? ["DESCRIPTION_MANQUANTE"] : [],
  };
}

/** `agents/<name>.yaml` : UTF-8 sans BOM, LF, indentation 2, ligne finale (ADR-001, D1). */
export function fichiersAgent(agent: AgentNouveau): FichierAEcrire[] {
  const contenu = stringify(agent, { indent: 2, indentSeq: true, lineWidth: 0 });
  return [{ chemin: `.cadre/agents/${agent.name}.yaml`, contenu }];
}
