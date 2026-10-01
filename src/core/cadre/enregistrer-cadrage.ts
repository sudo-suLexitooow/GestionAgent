// Enregistrement du cadrage en mémoire (US-077, US-007) : contextes importés et agents créés, en
// une seule transaction, via le chemin d'écriture d'US-005.
import { fichiersAgent, regleNomAgentViolee, type AgentNouveau } from "../agents/agent";
import type { ImportedContext } from "../contexts/context";
import type { FichierAEcrire, SystemeFichiersProjet } from "../fichiers/systeme-fichiers";
import type { ProjectFiles } from "../project/ports";
import { serialiserCadre } from "./cadre-yaml";
import { chargerModele } from "./charger-modele";
import { etatDossierCadre } from "./detection";
import {
  enregistrerFichiers,
  versErreurEnregistrement,
  type ErreurEnregistrement,
  type ResultatEnregistrement,
} from "./enregistrer";
import { enregistrerContextesImportes, type OptionsEnregistrement } from "./enregistrer-import";

export interface CadrageNonEnregistre {
  /** Contextes importés : seulement dans un projet sans modèle (US-077). */
  contextes: readonly ImportedContext[];
  /** Agents créés depuis l'ouverture du projet (US-007). */
  agents: readonly AgentNouveau[];
}

const CADRE_YAML = ".cadre/cadre.yaml";

/**
 * Enregistre le cadrage non enregistré. Sans modèle (ou avec des contextes importés) : crée le
 * modèle (US-077). Avec un modèle : ajoute les agents, et l'outil cible à `tools` de `cadre.yaml`
 * seulement s'il y manque. Refuse sans rien écrire un modèle incomplet ou d'un format plus récent,
 * ou un agent dont le nom (casse comprise) est apparu sur le disque depuis sa création.
 * Ne rejette jamais.
 */
export async function enregistrerCadrage(
  disque: { fichiers: ProjectFiles; systeme: SystemeFichiersProjet },
  racine: string,
  cadrage: CadrageNonEnregistre,
  options: OptionsEnregistrement,
): Promise<ResultatEnregistrement> {
  const creerLeModele = () =>
    enregistrerContextesImportes(disque, racine, cadrage.contextes, options, cadrage.agents);
  if (cadrage.contextes.length > 0) return creerLeModele();
  let fichiers: FichierAEcrire[];
  try {
    if ((await etatDossierCadre(disque.fichiers, racine)) === "aucun") return await creerLeModele();
    const preparation = await preparerDansLeModele(disque.fichiers, racine, cadrage.agents);
    if ("erreur" in preparation) return { ok: false, erreur: preparation.erreur };
    fichiers = preparation.fichiers;
  } catch (erreur) {
    return { ok: false, erreur: versErreurEnregistrement(erreur) };
  }
  return enregistrerFichiers(disque.systeme, racine, fichiers);
}

async function preparerDansLeModele(
  fichiers: ProjectFiles,
  racine: string,
  agents: readonly AgentNouveau[],
): Promise<{ fichiers: FichierAEcrire[] } | { erreur: ErreurEnregistrement }> {
  const chargement = await chargerModele(fichiers, racine);
  if (chargement.etat !== "charge" || chargement.lectureSeule) {
    return { erreur: { code: "MODELE_NON_MODIFIABLE", detail: CADRE_YAML } };
  }
  const { cadre, agents: presents } = chargement.modele;
  // Tous les fichiers d'agents comptent, même en erreur : leur nom est pris sur le disque.
  const nomsPris = presents.map(({ fichier }) =>
    fichier.slice(".cadre/agents/".length, -".yaml".length),
  );
  const doublon = agents.find((agent) => regleNomAgentViolee(agent.name, nomsPris) !== null);
  if (doublon) return { erreur: { code: "AGENT_EXISTANT", detail: doublon.name } };

  const outils: unknown[] = Array.isArray(cadre.tools) ? cadre.tools : [];
  const manquants = [...new Set(agents.map((agent) => agent.target))].filter(
    (outil) => !outils.includes(outil),
  );
  const cadreModifie =
    manquants.length > 0
      ? [
          {
            chemin: CADRE_YAML,
            contenu: serialiserCadre({ ...cadre, tools: [...outils, ...manquants] }),
          },
        ]
      : [];
  return { fichiers: [...cadreModifie, ...agents.flatMap(fichiersAgent)] };
}
