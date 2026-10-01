// Détection d'un modèle `.cadre/` dans un projet (ADR-001, écarts constatés ; AC-006-5, AC-006-6).
import type { ProjectFiles } from "../project/ports";

/**
 * `modele` : `.cadre/cadre.yaml` existe. `incomplet` : `.cadre/` contient autre chose que ses
 * dossiers non versionnés, mais pas de `cadre.yaml` (AC-006-5). `aucun` : pas de `.cadre/`, ou
 * seulement des dossiers non versionnés (p. ex. le verrou `tmp/verrou` laissé par un
 * enregistrement raté, AC-006-6) : ce n'est pas un modèle.
 */
export type EtatDossierCadre = "aucun" | "incomplet" | "modele";

/** Dossiers non versionnés de `.cadre/` (ADR-001, D6), qui peuvent exister sans modèle. */
const DOSSIERS_NON_VERSIONNES: ReadonlySet<string> = new Set(["tmp", "runs", "backups"]);

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
  const autreContenu = entrees.some(
    (entree) => entree.kind !== "directory" || !DOSSIERS_NON_VERSIONNES.has(entree.name),
  );
  return autreContenu ? "incomplet" : "aucun";
}
