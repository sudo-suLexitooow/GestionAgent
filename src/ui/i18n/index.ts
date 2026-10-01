// Libellés de l'interface (Q-22) : clés stables, français d'abord ; l'anglais viendra plus tard.

const fr = {
  "app.title": "Cadre",
  "home.open": "Ouvrir un dossier",
  "home.dropHint": "ou déposez un dossier de projet dans cette fenêtre",
  "project.path": "Chemin",
  "error.not-found": "Ce dossier n'existe pas (ou plus). Vérifiez le chemin puis réessayez.",
  "error.unreadable": "Ce dossier ne peut pas être lu : droits d'accès insuffisants.",
  "error.not-a-directory": "Ce chemin n'est pas un dossier.",
  "error.drop-single-folder": "Déposez un seul dossier : pas un fichier, ni plusieurs éléments.",
  "error.unexpected": "Le dossier n'a pas pu être ouvert. Réessayez.",
  "contexts.title": "Contextes",
  "contexts.detected":
    "Fichiers de contexte détectés. Les importer dans Cadre ? Les fichiers d'origine ne seront pas modifiés.",
  "contexts.import": "Importer",
  "contexts.decline": "Ne pas importer",
  "skills.title": "Skills",
  "skills.none": "Aucune skill détectée.",
  "skills.failed": "Les skills n'ont pas pu être lues.",
  "skills.inError": "en erreur",
  "skills.line": "ligne",
  "skills.issue.no-header":
    "pas d'en-tête YAML (le fichier SKILL.md doit commencer par une ligne ---)",
  "skills.issue.unclosed-header": "en-tête YAML non fermé (ligne --- de fin manquante)",
  "skills.issue.yaml-syntax": "YAML invalide",
  "skills.issue.duplicate-key": "clé en double dans l'en-tête YAML",
  "skills.issue.not-a-mapping": "l'en-tête YAML doit être une suite de champs « clé: valeur »",
  "skills.issue.missing-name": "le champ name est absent ou vide",
  "skills.issue.missing-description": "le champ description est absent ou vide",
  "skills.issue.encoding": "le fichier SKILL.md n'est pas encodé en UTF-8",
  "skills.issue.unreadable": "le fichier SKILL.md ne peut pas être lu",
  "skills.issue.too-large": "le fichier SKILL.md dépasse la taille maximale de 8 Mio",
} as const;

export type LabelKey = keyof typeof fr;

export function t(key: LabelKey): string {
  return fr[key];
}
