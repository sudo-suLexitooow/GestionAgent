// Lignes ajoutées par Cadre au `.gitignore` racine (ADR-001, D6).

export const LIGNES_GITIGNORE_CADRE: readonly string[] = [
  ".cadre/runs/",
  ".cadre/backups/",
  ".cadre/tmp/",
];

/**
 * Renvoie le nouveau contenu du `.gitignore`, ou `null` s'il n'y a rien à écrire.
 * Les lignes absentes sont ajoutées à la fin, dans le style de fin de ligne du fichier ;
 * les lignes existantes ne sont jamais modifiées.
 */
const BOM = String.fromCharCode(0xfeff);

export function completerGitignore(existant: string | null): string | null {
  const texte = existant ?? "";
  // Un BOM éventuel ne fait pas partie de la première ligne.
  const sansBom = texte.startsWith(BOM) ? texte.slice(BOM.length) : texte;
  const presentes = new Set(sansBom.split("\n").map((ligne) => ligne.trimEnd()));
  const manquantes = LIGNES_GITIGNORE_CADRE.filter((ligne) => !presentes.has(ligne));
  if (manquantes.length === 0) return null;

  const finDeLigne = /\r\n|\n/.exec(texte)?.[0] ?? "\n";
  const separateur = texte === "" || texte.endsWith("\n") ? "" : finDeLigne;
  return texte + separateur + manquantes.map((ligne) => ligne + finDeLigne).join("");
}
