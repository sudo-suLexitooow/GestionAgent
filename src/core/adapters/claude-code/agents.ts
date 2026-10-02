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
 * En-tête `name` puis `description` (toujours entre guillemets doubles, échappée ; texte de repli
 * si elle est vide), puis le corps : les instructions de l'agent octet pour octet (ADR-001, D9.1)
 * si elles existent ; sinon le rôle, suivi d'une fin de ligne s'il n'en a pas.
 */
function fichierSousAgent(agent: AgentAExporter): FichierExporte {
  const description =
    agent.description.trim() === "" ? `Agent ${agent.name} géré par Cadre.` : agent.description;
  return {
    chemin: `.claude/agents/${agent.name}.md`,
    source: `agent:${agent.id}`,
    // Une chaîne JSON est une chaîne YAML entre guillemets doubles valide (YAML 1.2).
    contenu: `---\nname: ${agent.name}\ndescription: ${JSON.stringify(description)}\n---\n${corps(agent)}`,
  };
}

function corps(agent: AgentAExporter): string {
  if (agent.instructions) return instructionsEnTexte(agent.instructions) ?? "";
  return agent.role === "" || agent.role.endsWith("\n") ? agent.role : `${agent.role}\n`;
}

/**
 * Texte dont l'encodage UTF-8 redonne exactement les octets (BOM et fins de ligne compris) ;
 * `null` s'ils ne sont pas de l'UTF-8 valide.
 */
function instructionsEnTexte(octets: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(octets);
  } catch {
    return null;
  }
}
