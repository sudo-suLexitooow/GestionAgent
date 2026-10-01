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
  "error.project-preparation-failed":
    "Le projet n'a pas pu être préparé : son dossier .cadre/ est inaccessible ou une écriture interrompue n'a pas pu être reprise. Réessayez ; si le problème persiste, examinez le dossier .cadre/tmp du projet.",
  "error.unexpected": "Le dossier n'a pas pu être ouvert. Réessayez.",
} as const;

export type LabelKey = keyof typeof fr;

export function t(key: LabelKey): string {
  return fr[key];
}
