// Enregistrement du cadrage en mémoire (US-077, US-007) : contextes importés et agents créés.
import type { AgentNouveau } from "../agents/agent";
import type { ImportedContext } from "../contexts/context";
import type { SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { ProjectFiles } from "../project/ports";
import type { ResultatEnregistrement } from "./enregistrer";
import type { OptionsEnregistrement } from "./enregistrer-import";

export interface CadrageNonEnregistre {
  contextes: readonly ImportedContext[];
  agents: readonly AgentNouveau[];
}

export function enregistrerCadrage(
  _disque: { fichiers: ProjectFiles; systeme: SystemeFichiersProjet },
  _racine: string,
  _cadrage: CadrageNonEnregistre,
  _options: OptionsEnregistrement,
): Promise<ResultatEnregistrement> {
  return Promise.resolve({ ok: false, erreur: { code: "ECHEC", detail: "non implémenté" } });
}
