// @vitest-environment node
// AC-008-6 (NF-19) : le cœur ne connaît Claude Code qu'à travers son adaptateur.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const COEUR = fileURLToPath(new URL(".", import.meta.url));

/** Toute mention de Claude (Claude Code, `.claude/`, `claude-code`, `CLAUDE.md`…), casse ignorée. */
const REFERENCE_CLAUDE = /claude/iu;

/** Seul dossier du cœur autorisé à connaître Claude Code. */
const ADAPTATEUR_CLAUDE_CODE = "adapters/claude-code/";

/**
 * Exceptions, explicites : les fichiers de test (`*.test.ts`, `*.test.tsx`) peuvent utiliser
 * l'adaptateur réel ou des données Claude Code comme exemples ; ce n'est pas du code du cœur.
 */
const EXCEPTIONS: readonly RegExp[] = [/\.test\.tsx?$/u];

/** Chemins relatifs au cœur (séparateur `/`) de tous ses fichiers. */
function fichiersDuCoeur(dossier = COEUR): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersDuCoeur(chemin);
    return [relative(COEUR, chemin).split(sep).join("/")];
  });
}

function referencesHorsAdaptateur(): string[] {
  return fichiersDuCoeur()
    .filter((fichier) => !fichier.startsWith(ADAPTATEUR_CLAUDE_CODE))
    .filter((fichier) => !EXCEPTIONS.some((exception) => exception.test(fichier)))
    .flatMap((fichier) =>
      readFileSync(join(COEUR, fichier), "utf8")
        .split(/\r?\n/u)
        .flatMap((ligne, i) =>
          REFERENCE_CLAUDE.test(ligne) ? [`${fichier}:${String(i + 1)}: ${ligne.trim()}`] : [],
        ),
    );
}

describe("isolation de l'adaptateur Claude Code (NF-19)", () => {
  test("test_ac_008_6_la_recherche_parcourt_tout_le_coeur_et_trouve_l_adaptateur", () => {
    const fichiers = fichiersDuCoeur();

    expect(fichiers).toEqual(
      expect.arrayContaining([
        "export/exporter.ts",
        "cadre/enregistrer.ts",
        "schemas/v1/agent.json",
        "README.md",
        "adapters/claude-code/claude-code-adapter.ts",
      ]),
    );
    const adaptateur = readFileSync(join(COEUR, "adapters/claude-code/agents.ts"), "utf8");
    expect(REFERENCE_CLAUDE.test(adaptateur)).toBe(true);
  });

  test("test_ac_008_6_aucune_reference_a_claude_code_dans_le_coeur_hors_de_son_adaptateur", () => {
    expect(referencesHorsAdaptateur()).toEqual([]);
  });
});
