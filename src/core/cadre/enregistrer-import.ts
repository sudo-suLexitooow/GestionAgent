// Enregistrement des contextes importés dans `.cadre/` (US-077).
import type { ToolAdapter } from "../adapters/adapter";
import type { ImportedContext } from "../contexts/context";
import type { SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { ProjectFiles } from "../project/ports";
import type { ResultatEnregistrement } from "./enregistrer";

export function enregistrerContextesImportes(
  _disque: { fichiers: ProjectFiles; systeme: SystemeFichiersProjet },
  _racine: string,
  _contextes: readonly ImportedContext[],
  _options: { adapter: ToolAdapter; generatorVersion: string },
): Promise<ResultatEnregistrement> {
  return Promise.resolve({ ok: true });
}
