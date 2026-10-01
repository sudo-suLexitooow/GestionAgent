// Export des agents en sous-agents Claude Code, `.claude/agents/<nom>.md` (ADR-003, format (2)).
import type { AgentAExporter, FichierExporte, ModeleAExporter, ProblemeExport } from "../adapter";

/**
 * Nom accepté par Claude Code et sûr comme nom de fichier : non vide, sans `:` ni `-` initial
 * (ADR-003), sans séparateur de chemin. La règle R2 (US-007) le garantit déjà ; revérifié ici
 * parce que le nom devient un chemin.
 */
const NOM_SOUS_AGENT = /^[^-:/\\][^:/\\]*$/u;

export function validerAgents(modele: ModeleAExporter): ProblemeExport[] {
  return modele.agents
    .filter((agent) => !NOM_SOUS_AGENT.test(agent.name))
    .map((agent) => ({ code: "NOM_INCOMPATIBLE", detail: agent.name }));
}

export function exporterAgents(modele: ModeleAExporter): FichierExporte[] {
  return modele.agents.map(fichierSousAgent);
}

/**
 * En-tête `name` puis `description` (toujours entre guillemets doubles, échappée ; texte de repli
 * si elle est vide), puis le rôle octet pour octet ; le fichier se termine par une fin de ligne.
 */
function fichierSousAgent(agent: AgentAExporter): FichierExporte {
  const description =
    agent.description.trim() === "" ? `Agent ${agent.name} géré par Cadre.` : agent.description;
  const corps = agent.role === "" || agent.role.endsWith("\n") ? agent.role : `${agent.role}\n`;
  return {
    chemin: `.claude/agents/${agent.name}.md`,
    source: `agent:${agent.id}`,
    // Une chaîne JSON est une chaîne YAML entre guillemets doubles valide (YAML 1.2).
    contenu: `---\nname: ${agent.name}\ndescription: ${JSON.stringify(description)}\n---\n${corps}`,
  };
}
