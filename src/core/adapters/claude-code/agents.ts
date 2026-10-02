// Export des agents en sous-agents Claude Code, `.claude/agents/<nom>.md` (ADR-003, format (2)).
import type { AgentAExporter, FichierExporte, ModeleAExporter, ProblemeExport } from "../adapter";

/**
 * Nom accepté par Claude Code et sûr comme nom de fichier : non vide, sans `:` ni `-` initial
 * (ADR-003), sans séparateur de chemin. La règle R2 (US-007) le garantit déjà ; revérifié ici
 * parce que le nom devient un chemin.
 */
const NOM_SOUS_AGENT = /^[^-:/\\][^:/\\]*$/u;

export function validerAgents(modele: ModeleAExporter): ProblemeExport[] {
  return modele.agents.flatMap((agent) => {
    if (!NOM_SOUS_AGENT.test(agent.name)) return [{ code: "NOM_INCOMPATIBLE", detail: agent.name }];
    if (agent.instructions && instructionsEnTexte(agent.instructions) === null) {
      // Claude Code lit ses sous-agents en UTF-8 (ADR-003).
      return [{ code: "INSTRUCTIONS_NON_UTF8", detail: agent.name }];
    }
    return [];
  });
}

export function exporterAgents(modele: ModeleAExporter): FichierExporte[] {
  return modele.agents.map(fichierSousAgent);
}

/**
 * En-tête `name` puis `description` (toujours entre guillemets doubles, échappés ; texte de repli
 * si la description est vide), puis le corps (voir `corps`).
 */
function fichierSousAgent(agent: AgentAExporter): FichierExporte {
  const description =
    agent.description.trim() === "" ? `Agent ${agent.name} géré par Cadre.` : agent.description;
  return {
    chemin: `.claude/agents/${agent.name}.md`,
    source: `agent:${agent.id}`,
    // Une chaîne JSON est une chaîne YAML entre guillemets doubles valide (YAML 1.2) ; `name`
    // aussi est entre guillemets : `true`, `null` ou `123` resteraient sinon un booléen, null ou
    // un nombre.
    contenu: `---\nname: ${JSON.stringify(agent.name)}\ndescription: ${JSON.stringify(description)}\n---\n${corps(agent)}`,
  };
}

/**
 * Corps (décision PO, revue n° 2) : les instructions de l'agent si elles existent (ADR-001, D3),
 * sinon le rôle, résumé court. Sans BOM de tête, terminé par une fin de ligne s'il n'est pas vide ;
 * le reste est gardé tel quel, CRLF compris.
 */
function corps(agent: AgentAExporter): string {
  const texte = agent.instructions ? (instructionsEnTexte(agent.instructions) ?? "") : agent.role;
  return texte === "" || texte.endsWith("\n") ? texte : `${texte}\n`;
}

/**
 * Texte des octets sans leur BOM de tête (retiré par le décodeur) ; fins de ligne et reste du
 * contenu inchangés. `null` s'ils ne sont pas de l'UTF-8 valide.
 */
function instructionsEnTexte(octets: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets);
  } catch {
    return null;
  }
}
