// Détection d'un modèle `.cadre/` dans un projet (ADR-001, écarts constatés ; AC-006-5, AC-006-6).
import type { ProjectFiles } from "../project/ports";

/**
 * `modele` : `.cadre/cadre.yaml` existe. `incomplet` : `.cadre/` contient autre chose que `tmp/`
 * mais pas de `cadre.yaml` (AC-006-5). `aucun` : pas de `.cadre/`, ou seulement `tmp/` (verrou
 * laissé par un enregistrement raté, AC-006-6) : ce n'est pas un modèle.
 */
export type EtatDossierCadre = "aucun" | "incomplet" | "modele";

/** Dossier de `.cadre/` qui peut exister sans modèle (verrou permanent `tmp/verrou`, US-005). */
const DOSSIER_TEMPORAIRE = "tmp";

/** Lecture seule ; rejette si `.cadre/` ne peut pas être lu. */
export async function etatDossierCadre(
  files: ProjectFiles,
  root: string,
): Promise<EtatDossierCadre> {
  const entrees = await files.listDir(root, ".cadre");
  if (entrees === null) return "aucun";
  if (entrees.some((entree) => entree.name === "cadre.yaml" && entree.kind === "file")) {
    return "modele";
  }
  return entrees.some((entree) => entree.name !== DOSSIER_TEMPORAIRE) ? "incomplet" : "aucun";
}
